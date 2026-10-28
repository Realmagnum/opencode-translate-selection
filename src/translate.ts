/**
 * Translation backend with Smart Hybrid Routing:
 * - Simple phrases -> Fast Multi-tier MT (Google gtx, dict-chrome-ex, MyMemory)
 * - Complex/structured/code text -> Session LLM outside conversation history
 * - Automatic fail-safe fallback to Token-Shielded MT if LLM times out or errors.
 */

import { get as httpsGet } from "node:https"
import { isComplexFormattedText } from "./detector.ts"
import { shieldTokens, unshieldTokens } from "./shield.ts"
import { translateWithLlm } from "./llm-engine.ts"

export interface TransResult {
  lang: string
  text: string
  engineUsed?: string
  error?: string
}

export interface TransOutput {
  detected: string
  results: TransResult[]
}

export type Log = (level: "debug" | "info" | "warn" | "error", message: string, data?: Record<string, unknown>) => void

export interface TranslateOptions {
  log?: Log
  client?: any
}

export interface TranslateInputParams {
  text: string
  targets: readonly string[]
  sessionID?: string
  engineMode?: "auto" | "fast" | "llm"
  llmTimeoutMs?: number
  dropSourceLang?: boolean
}

interface Entry {
  text: string
  detected: string
  engineUsed?: string
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

const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)"

async function requestJson(url: string, signal: AbortSignal): Promise<unknown> {
  if (signal.aborted) throw new Error("call aborted before the request")

  const headers = { accept: "application/json", "user-agent": USER_AGENT }
  const implementation = globalThis.fetch
  if (typeof implementation === "function") {
    try {
      const response = await implementation(url, { signal, headers })
      if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`)
      return await response.json()
    } catch (error) {
      if (signal.aborted || (error instanceof Error && error.message.startsWith("HTTP "))) throw error
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

function unescapeHtml(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
}

async function fetchGoogle(text: string, to: string, clientName: string, signal: AbortSignal): Promise<Entry> {
  const url = `${ENDPOINT}?client=${encodeURIComponent(clientName)}&sl=auto&tl=${encodeURIComponent(to)}&dt=t&q=${encodeURIComponent(text)}`
  const body = await requestJson(url, signal)

  const chunks = Array.isArray(body) ? (body[0] as unknown) : undefined
  if (!Array.isArray(chunks)) throw new Error("unexpected response shape")

  const translated = chunks
    .map((chunk) => (Array.isArray(chunk) && typeof chunk[0] === "string" ? chunk[0] : ""))
    .join("")
    .trim()

  if (!translated) throw new Error("empty translation")

  const detected = Array.isArray(body) && typeof body[2] === "string" ? (body[2] as string) : ""
  return { text: translated, detected, engineUsed: clientName }
}

async function fetchMyMemory(text: string, to: string, signal: AbortSignal): Promise<Entry> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=autodetect|${encodeURIComponent(to)}`
  const body = (await requestJson(url, signal)) as Record<string, any>

  const translated = body?.responseData?.translatedText
  if (typeof translated !== "string" || !translated.trim()) {
    throw new Error(body?.responseDetails || "MyMemory returned empty result")
  }

  const detected = typeof body?.matches?.[0]?.["source-language"] === "string"
    ? body.matches[0]["source-language"]
    : (/[а-яё]/i.test(text) ? "ru" : "en")

  return { text: unescapeHtml(translated.trim()), detected, engineUsed: "mymemory" }
}

async function translateWithFallback(text: string, to: string, signal: AbortSignal, log?: Log): Promise<Entry> {
  const key = `mt\0${to}\0${text}`
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
  input: TranslateInputParams,
  signal: AbortSignal,
  options?: TranslateOptions,
): Promise<TransOutput> {
  const log = options?.log
  const client = options?.client
  const text = input.text.replace(/\r/g, "").trim()
  const targets = [...new Set(input.targets.map((lang) => lang.trim()).filter(Boolean))]

  if (!text) return { detected: "", results: [] }

  const mode = input.engineMode ?? "auto"
  const isComplex = isComplexFormattedText(text)
  const shouldTryLlm = (mode === "llm" || (mode === "auto" && isComplex)) && !!input.sessionID && !!client

  log?.("info", "translate request", {
    chars: text.length,
    targets,
    mode,
    isComplex,
    shouldTryLlm,
    hasSession: !!input.sessionID,
  })

  // ──────────────────────────── LLM Translation Path ────────────────────────────
  if (shouldTryLlm) {
    try {
      const dropSource = input.dropSourceLang !== false
      const detectedSource = /[а-яё]/i.test(text) ? "ru" : "en"
      const activeTargets = dropSource
        ? targets.filter((t) => t.toLowerCase().split("-")[0] !== detectedSource)
        : targets
      const targetsToTranslate = activeTargets.length > 0 ? activeTargets : targets

      const llmSettled = await Promise.allSettled(
        targetsToTranslate.map(async (target) => {
          const cacheKey = `llm\0${target}\0${text}`
          const cached = cache.get(cacheKey)
          if (cached) return cached

          const res = await translateWithLlm(
            {
              text,
              targetLang: target,
              sessionID: input.sessionID!,
              client,
              timeoutMs: input.llmTimeoutMs ?? 3500,
            },
            signal,
          )

          const entry: Entry = { text: res.text, detected: detectedSource, engineUsed: "llm" }
          remember(cacheKey, entry)
          return entry
        }),
      )

      const fulfilled = llmSettled.filter(
        (r): r is PromiseFulfilledResult<Entry> => r.status === "fulfilled",
      )

      if (fulfilled.length > 0) {
        const results: TransResult[] = llmSettled.map((r, index) => {
          const lang = targetsToTranslate[index] ?? ""
          if (r.status === "fulfilled") {
            return { lang, text: r.value.text, engineUsed: "llm" }
          }
          return { lang, text: "", error: describe(r.reason) }
        })

        return { detected: detectedSource, results }
      }

      // If all LLM targets failed, throw to fall back to MT pipeline
      const firstError = llmSettled.find((r) => r.status === "rejected")
      throw (firstError as PromiseRejectedResult)?.reason ?? new Error("LLM failed")
    } catch (llmError) {
      log?.("warn", "LLM translation failed or timed out, falling back to MT pipeline", {
        error: describe(llmError),
      })
      if (mode === "llm") {
        return {
          detected: "",
          results: targets.map((lang) => ({ lang, text: "", error: describe(llmError) })),
        }
      }
    }
  }

  // ──────────────────────── MT Pipeline (with Token Shielding) ───────────────────
  const { shielded, tokens } = shieldTokens(text)

  const settled = await Promise.allSettled(
    targets.map((lang) => translateWithFallback(shielded, lang, signal, log)),
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
    if (result.status === "fulfilled") {
      const unshielded = unshieldTokens(result.value.text, tokens)
      return { lang, text: unshielded, engineUsed: result.value.engineUsed }
    }
    return { lang, text: "", error: describe(result.reason) }
  })

  const source = detected.toLowerCase().split("-")[0]
  const useful = source
    ? results.filter((result) => result.lang.toLowerCase().split("-")[0] !== source || result.error)
    : results

  return { detected, results: useful.length > 0 ? useful : results }
}
