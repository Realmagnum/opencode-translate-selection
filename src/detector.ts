/**
 * Lightweight heuristics to detect complex formatted text:
 * lists (bullets, numbers), code blocks, inline code, function calls, and technical syntax.
 */

export function isComplexFormattedText(raw: string): boolean {
  if (!raw) return false
  const trimmed = raw.trim()

  // Short single-line snippets under 40 chars without code, brackets, or fences are simple
  if (
    trimmed.length < 40 &&
    !trimmed.includes("\n") &&
    !trimmed.includes("`") &&
    !trimmed.includes("{") &&
    !trimmed.includes("(")
  ) {
    return false
  }

  const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean)

  // 1. Multi-line structures
  if (lines.length >= 2) {
    // Bullet or numbered lists: •, -, *, +, 1., 1)
    const hasListMarkers = lines.some((l) => /^([•\-*+]|\d+[.)]|\d+-\d+)\s/.test(l))
    if (hasListMarkers) return true

    // Markdown headers
    const hasHeadings = lines.some((l) => /^#{1,6}\s/.test(l))
    if (hasHeadings) return true

    // Markdown blockquotes
    const hasQuotes = lines.some((l) => /^>\s?/.test(l))
    if (hasQuotes) return true
  }

  // 2. Code fences (``` or ~~~) or inline code (`code`)
  if (/`{1,3}[^`]+`{1,3}/.test(trimmed)) return true

  // 3. Technical calls / identifiers (e.g. tools.opencode.models({ ... }))
  if (/\b[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*\(/.test(trimmed)) return true

  // 4. Key-value / JSON parameter syntax (e.g. { query: 'search' })
  if (/\{[\s\S]*:[ \t]*[\s\S]*\}/.test(trimmed)) return true

  // 5. If it has 3 or more lines, it has paragraph structure worth preserving
  if (lines.length >= 3) return true

  return false
}
