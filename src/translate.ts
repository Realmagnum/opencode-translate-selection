/**
 * Translation backend, called from the Electron main process.
 *
 * Multi-tier translation pipeline:
 * 1. Google Translate `gtx` (primary)
 * 2. Google Translate `dict-chrome-ex` (backup Google client endpoint)
 * 3. MyMemory Translate API (independent fallback if Google is blocked/rate-limited)
 *
 * Source language is detected automatically, and targets matching the source
 * are omitted (e.g. Russian text shows only English).
 */

import { get as httpsGet } from "node:https"

export interface TransResult {
  lang: string
  text: string
  error?: string
}

export interface TransOutput {
  detected: string
  results: TransResult[]
}

export type Log = (level: "debug" | "info" | "warn" | "error", message: string, data?: Record<string, unknown>) => void

interface Entry {
  text: string
  detected: string
}

const CACHE_LIMIT = 500
const cache = new Map<string, Entry>()

function remember(key: string, value: Entry) {
  cache.set(key, value)
  if (cache.size <= CACHE_LIMIT) return

  const oldest = cache.keys().next()
  if (!oldest.done) cache.delete(oldest.value)
}

const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)"

/** Perform an HTTP GET with User-Agent header, falling back to node:https. */
async function requestJson(url: string, signal: AbortSignal): Promise<unknown> {
  if (signal.aborted) throw new Error("call aborted before the request")

  const headers = {
    accept: "application/json",
    "user-agent": USER_AGENT,
  }

  const implementation = globalThis.fetch
  if (typeof implementation === "function") {
    try {
      const response = await implementation(url, { signal, headers })
      if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`)
      return await response.json()
    } catch (error) {
      if (signal.aborted) throw error
      if (error instanceof Error && error.message.startsWith("HTTP ")) throw error
    }
  }

  return viaHttps(url, signal)
}

function viaHttps(url: string, signal: AbortSignal): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const request = httpsGet(url, { headers: { accept: "application/json", "user-agent": USER_AGENT } }, (response) => {
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

/** Decode common HTML entities that some translation APIs return. */
function unescapeHtml(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
}

/** Google Translate endpoint with specific client ID. */
async function fetchGoogle(text: string, to: string, client: string, signal: AbortSignal): Promise<Entry> {
  const url = `https://translate.googleapis.com/translate_a/single?client=${encodeURIComponent(client)}&sl=auto&tl=${encodeURIComponent(to)}&dt=t&q=${encodeURIComponent(text)}`
  const body = await requestJson(url, signal)

  const chunks = Array.isArray(body) ? (body[0] as unknown) : undefined
  if (!Array.isArray(chunks)) throw new Error("unexpected response shape")

  const translated = chunks
    .map((chunk) => (Array.isArray(chunk) && typeof chunk[0] === "string" ? chunk[0] : ""))
    .join("")
    .trim()

  if (!translated) throw new Error("empty translation")

  const detected = Array.isArray(body) && typeof body[2] === "string" ? (body[2] as string) : ""
  return { text: translated, detected }
}

/** MyMemory API fallback (free, keyless alternative). */
async function fetchMyMemory(text: string, to: string, signal: AbortSignal): Promise<Entry> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=autodetect|${encodeURIComponent(to)}`
  const body = (await requestJson(url, signal)) as Record<string, any>

  const translated = body?.responseData?.translatedText
  if (typeof translated !== "string" || !translated.trim()) {
    throw new Error(body?.responseDetails || "MyMemory returned empty result")
  }

  // Detect simple source language heuristic if detectedLanguage is provided
  const detected = typeof body?.matches?.[0]?.["source-language"] === "string"
    ? body.matches[0]["source-language"]
    : (/[а-яё]/i.test(text) ? "ru" : "en")

  return { text: unescapeHtml(translated.trim()), detected }
}

/** Attempt translation via primary Google, secondary Google client, and MyMemory fallback. */
async function translateWithFallback(text: string, to: string, signal: AbortSignal, log?: Log): Promise<Entry> {
  const key = `${to}\u0000${text}`
  const hit = cache.get(key)
  if (hit !== undefined) return hit

  // Tier 1: Google gtx
  try {
    const entry = await fetchGoogle(text, to, "gtx", signal)
    remember(key, entry)
    return entry
  } catch (errGtx) {
    log?.("warn", "Google gtx failed, trying dict-chrome-ex", { to, error: describe(errGtx) })
  }

  // Tier 2: Google dict-chrome-ex
  try {
    const entry = await fetchGoogle(text, to, "dict-chrome-ex", signal)
    remember(key, entry)
    return entry
  } catch (errDict) {
    log?.("warn", "Google dict-chrome-ex failed, trying MyMemory fallback", { to, error: describe(errDict) })
  }

  // Tier 3: MyMemory API fallback
  try {
    const entry = await fetchMyMemory(text, to, signal)
    remember(key, entry)
    return entry
  } catch (errMyMemory) {
    log?.("error", "All translation backends failed", { to, error: describe(errMyMemory) })
    throw new Error(`All backends failed: ${describe(errMyMemory)}`)
  }
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

  const settled = await Promise.allSettled(
    targets.map((lang) => translateWithFallback(text, lang, signal, log)),
  )

  const failures = settled.filter((result) => result.status === "rejected")
  if (failures.length > 0) {
    log?.("warn", "translate request partial failure", {
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
