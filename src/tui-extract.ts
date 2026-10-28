import type { Context } from "@opencode/plugin/tui/context"
import type { SessionMessageAssistant, SessionMessageInfo } from "@opencode/client"
import type { TransOutput } from "./translate.ts"

/**
 * Extracts raw text content from an assistant session message.
 */
export function extractAssistantText(message: SessionMessageAssistant): string {
  if (!Array.isArray(message.content)) return ""

  const texts: string[] = []
  for (const part of message.content) {
    if (typeof (part as any)?.text === "string" && (part as any)?.type === "text") {
      texts.push((part as any).text)
    }
  }

  return texts.join("\n\n").trim()
}

/**
 * Retrieves the last assistant message's text from a session.
 */
export async function getLastAssistantText(
  context: Context,
  sessionID: string,
): Promise<string | undefined> {
  try {
    await context.data.session.message.sync(sessionID)
  } catch {
    // ignore sync failure and use current cache
  }

  const messages: SessionMessageInfo[] = context.data.session.message.list(sessionID) ?? []
  const assistantMessages = messages.filter(
    (m): m is SessionMessageAssistant => (m as any)?.type === "assistant",
  )

  if (assistantMessages.length === 0) return undefined

  for (let i = assistantMessages.length - 1; i >= 0; i--) {
    const text = extractAssistantText(assistantMessages[i])
    if (text) return text
  }

  return undefined
}

/**
 * Formats translation output into clean markdown for dialogs and panels.
 */
export function formatTransOutputMarkdown(output: TransOutput, originalText?: string): string {
  const parts: string[] = []

  for (const res of output.results) {
    const badge = res.engineUsed === "llm" ? " [LLM]" : ""
    if (res.error) {
      parts.push(`**[${res.lang.toUpperCase()}]**${badge} (Error: ${res.error})`)
    } else {
      parts.push(`**[${res.lang.toUpperCase()}]**${badge}\n${res.text}`)
    }
  }

  return parts.join("\n\n---\n\n")
}

/**
 * Formats a keybinding string into an uppercase, readable badge (e.g. "alt+t" -> "Alt+T").
 */
export function formatKey(key?: string): string {
  if (!key) return ""
  return key
    .split("+")
    .map((part) => {
      const p = part.trim().toLowerCase()
      if (p === "alt") return "Alt"
      if (p === "ctrl") return "Ctrl"
      if (p === "shift") return "Shift"
      if (p === "cmd" || p === "super") return "Cmd"
      return p.toUpperCase()
    })
    .join("+")
}
