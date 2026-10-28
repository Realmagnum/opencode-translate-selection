/**
 * Direct LLM translation outside conversation history using OpenCode's
 * `client.session.generate({ sessionID, prompt })`.
 */

const LANGUAGE_NAMES: Record<string, string> = {
  ru: "Russian",
  en: "English",
  de: "German",
  fr: "French",
  es: "Spanish",
  zh: "Chinese",
  ja: "Japanese",
  it: "Italian",
  pt: "Portuguese",
  ko: "Korean",
  ar: "Arabic",
  hi: "Hindi",
  tr: "Turkish",
  uk: "Ukrainian",
  pl: "Polish",
}

export function targetLangName(code: string): string {
  const norm = code.toLowerCase().trim().split("-")[0] ?? ""
  return LANGUAGE_NAMES[norm] ?? code.toUpperCase()
}

export function buildLlmPrompt(text: string, targetLang: string): string {
  const lang = targetLangName(targetLang)
  return `Translate the following text to ${lang}.
Strict requirements:
1. Preserve all structural formatting exactly: bullet lists (•, -, *), numbered steps, indentations, line breaks, and Markdown.
2. DO NOT translate, change, or rename code, function calls, parameters, variable names, URLs, or technical identifiers (e.g. tools.opencode.models({ query: 'search' })).
3. Return ONLY the translated content. No explanations, no introductory text, no conversational phrases.

Text to translate:
${text}`
}

export function cleanLlmOutput(output: string, originalText: string): string {
  let text = output.trim()

  // Strip outer ```markdown ... ``` wrapper if the source text was not a code block
  if (!originalText.trim().startsWith("```") && text.startsWith("```") && text.endsWith("```")) {
    text = text.replace(/^```[a-zA-Z]*\r?\n?/, "").replace(/\r?\n?```$/, "").trim()
  }

  // Strip conversational intros if the model added any
  text = text.replace(/^(?:Here is the translation|Вот перевод|Translation|Перевод):\s*\r?\n?/i, "").trim()

  return text
}

export interface LlmTranslateInput {
  text: string
  targetLang: string
  sessionID: string
  client: any
  timeoutMs?: number
}

export async function translateWithLlm(
  input: LlmTranslateInput,
  externalSignal: AbortSignal,
): Promise<{ text: string; lang: string }> {
  const timeoutMs = input.timeoutMs ?? 3500
  const timeoutController = new AbortController()
  const timer = setTimeout(() => timeoutController.abort(), timeoutMs)

  let combinedSignal: AbortSignal
  if (typeof AbortSignal.any === "function") {
    combinedSignal = AbortSignal.any([externalSignal, timeoutController.signal])
  } else {
    combinedSignal = timeoutController.signal
    externalSignal.addEventListener("abort", () => timeoutController.abort(), { once: true })
  }

  try {
    const prompt = buildLlmPrompt(input.text, input.targetLang)
    const result = await input.client.session.generate(
      { sessionID: input.sessionID, prompt },
      { signal: combinedSignal },
    )

    const raw = typeof result?.text === "string" ? result.text : (result?.data?.text ?? "")
    if (!raw.trim()) throw new Error("LLM returned empty translation")

    return {
      text: cleanLlmOutput(raw, input.text),
      lang: input.targetLang,
    }
  } finally {
    clearTimeout(timer)
  }
}
