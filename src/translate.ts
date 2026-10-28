/**
 * Translation backend, called from the Electron main process.
 *
 * Google's `gtx` endpoint needs no key and detects the source language, so the same
 * text can be translated into several targets at once and the ones equal to the
 * detected source are dropped (a Russian selection then shows only the English line).
 */

import { get as httpsGet } from "node:https"

export interface TransResult {
  lang: string
  text: string
  error?: string
}export interface TransOutput {
  detected: string
  results: TransResult[]
}

export type Log = (level: "debug" | "info" | "warn" | "error", message: string, data?: Record<string, unknown>) => void

interface Entry {
  text: string
  detected: string
}

const ENDPOINT = "https://translate.googleapis.com/translate_a/single"
const CACHE_LIMIT = 500

const cache = new Map<string, Entry>()

function remember(key: string, value: Entry) {
  cache.set(key, value)
  if (cache.size <= CACHE_LIMIT) return

  const oldest = cache.keys().next()
  if (!oldest.done) cache.delete(oldest.value)
}

/** One GET that reports why it failed instead of hiding it in a bare rejection. */
async function requestJson(url: string, signal: AbortSignal): Promise<unknown> {
  if (signal.aborted) throw new Error("call aborted before the request")

  const implementation = globalThis.fetch
  if (typeof implementation !== "function") return viaHttps(url, signal)

  try {
    const response = await implementation(url, { signal })
    if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`)

    return await response.json()
  } catch (error) {
    // A transport-level failure may come from the host's fetch rather than the network.
    // Retry once over node:https before reporting it, but keep HTTP statuses as they are.
    if (signal.aborted) throw error
    if (error instanceof Error && error.message.startsWith("HTTP ")) throw error

    return viaHttps(url, signal)
  }
}

/** Last-resort transport, so a broken or unavailable `fetch` does not sink translation. */
function viaHttps(url: string, signal: AbortSignal): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const request = httpsGet(url, { headers: { accept: "application/json" } }, (response) => {
      const status = response.statusCode ?? 0
      if (status < 200 || status >= 300) {
        response.resume()
        reject(new Error(`HTTP ${status}`))
        return
      }

      let body = ""
      response.setEncoding("utf8")
      response.on("data", (chunk: string) => (body += chunk))
      response.on("end", () => {
        try {
          resolve(JSON.parse(body))
        } catch {
          reject(new Error("response is not JSON"))
        }
      })
    })

    request.on("error", (error: Error) => reject(error))
    signal.addEventListener("abort", () => request.destroy(new Error("call aborted")), { once: true })
  })
}

async function google(text: string, to: string, signal: AbortSignal): Promise<Entry> {
  const key = `${to}\u0000${text}`
  const hit = cache.get(key)
  if (hit !== undefined) return hit

  const url = `${ENDPOINT}?client=gtx&sl=auto&tl=${encodeURIComponent(to)}&dt=t&q=${encodeURIComponent(text)}`
  const body = await requestJson(url, signal)

  const chunks = Array.isArray(body) ? (body[0] as unknown) : undefined
  if (!Array.isArray(chunks)) throw new Error("unexpected response shape")

  const translated = chunks
    .map((chunk) => (Array.isArray(chunk) && typeof chunk[0] === "string" ? chunk[0] : ""))
    .join("")
    .trim()

  if (!translated) throw new Error("empty translation")

  const detected = Array.isArray(body) && typeof body[2] === "string" ? (body[2] as string) : ""
  const entry = { text: translated, detected }

  remember(key, entry)
  return entry
}

function describe(reason: unknown): string {
  if (reason instanceof Error) return `${reason.name}: ${reason.message}`
  return String(reason)
}

export async function translate(
  input: { text: string; targets: readonly string[] },
  signal: AbortSignal,
  log?: Log,
): Promise<TransOutput> {
  const text = input.text.replace(/\r/g, "").trim()
  const targets = [...new Set(input.targets.map((lang) => lang.trim()).filter(Boolean))]

  if (!text) return { detected: "", results: [] }

  log?.("info", "translate request", { chars: text.length, targets, aborted: signal.aborted })

  const settled = await Promise.allSettled(targets.map((lang) => google(text, lang, signal)))

  const failures = settled.filter((result) => result.status === "rejected")
  if (failures.length > 0) {
    log?.("warn", "translate request failed", {
      targets,
      errors: failures.map((result) => (result.status === "rejected" ? describe(result.reason) : "")),
      aborted: signal.aborted,
    })
  }

  const detected = settled
    .map((result) => (result.status === "fulfilled" ? result.value.detected : ""))
    .find(Boolean) ?? ""

  const results: TransResult[] = settled.map((result, index) => {
    const lang = targets[index] ?? ""

    if (result.status === "fulfilled") return { lang, text: result.value.text }
    return { lang, text: "", error: describe(result.reason) }
  })

  // A target equal to the source adds nothing. Keep it only when dropping it would
  // leave the popup empty, so the user always sees something.
  const source = detected.toLowerCase().split("-")[0]
  const useful = source
    ? results.filter((result) => result.lang.toLowerCase().split("-")[0] !== source || result.error)
    : results

  return { detected, results: useful.length > 0 ? useful : results }
}
