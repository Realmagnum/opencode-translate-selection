/**
 * Token Shielding: protects code, identifiers, and markdown code spans
 * from being mangled or translated by machine translation engines (Google, MyMemory).
 */

const SHIELD_RE =
  /(`{1,3}[^`]+`{1,3}|\b[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z0-9_.]+\([^)]*\)|\b(?:https?|ftp):\/\/[^\s/$.?#].[^\s]*)/g

export interface ShieldResult {
  shielded: string
  tokens: string[]
}

/** Replace protected tokens with mathematical brackets `⟦0⟧`, `⟦1⟧` */
export function shieldTokens(text: string): ShieldResult {
  const tokens: string[] = []
  const shielded = text.replace(SHIELD_RE, (match) => {
    const index = tokens.length
    tokens.push(match)
    return `⟦${index}⟧`
  })

  return { shielded, tokens }
}

/** Restore `⟦0⟧`, `⟦1⟧` back to their original code/identifier strings */
export function unshieldTokens(text: string, tokens: readonly string[]): string {
  if (tokens.length === 0) return text
  let out = text

  tokens.forEach((token, index) => {
    // Accommodate potential whitespace injected by MT engines (e.g. ⟦ 0 ⟧)
    const pattern = new RegExp(`⟦\\s*${index}\\s*⟧`, "g")
    out = out.replace(pattern, token)
  })

  return out
}
