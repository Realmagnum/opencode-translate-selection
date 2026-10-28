export interface InlineToken {
  type: "text" | "code" | "strong"
  text: string
}

export function parseInlines(content: string): InlineToken[] {
  const tokens: InlineToken[] = []
  const regex = /(`[^`]+`|\*\*[^*]+\*\*)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", text: content.slice(lastIndex, match.index) })
    }
    const val = match[0]
    if (val.startsWith("`") && val.endsWith("`") && val.length >= 2) {
      tokens.push({ type: "code", text: val.slice(1, -1) })
    } else if (val.startsWith("**") && val.endsWith("**") && val.length >= 4) {
      tokens.push({ type: "strong", text: val.slice(2, -2) })
    }
    lastIndex = regex.lastIndex
  }

  if (lastIndex < content.length) {
    tokens.push({ type: "text", text: content.slice(lastIndex) })
  }

  return tokens
}

export interface LineInfo {
  type: "bullet" | "ordered" | "normal" | "empty"
  marker?: string
  inlines: InlineToken[]
}

export function parseLine(line: string): LineInfo {
  const trimmed = line.trim()
  if (!trimmed) {
    return { type: "empty", inlines: [] }
  }

  // Check for bullet list (•, -, *, +)
  const bulletMatch = line.match(/^(\s*)([•\-*+])\s+(.*)$/)
  if (bulletMatch && bulletMatch[2] && bulletMatch[3]) {
    return {
      type: "bullet",
      marker: "•",
      inlines: parseInlines(bulletMatch[3]),
    }
  }

  // Check for numbered list (1., 2), 1-)
  const orderedMatch = line.match(/^(\s*)(\d+[.)])\s+(.*)$/)
  if (orderedMatch && orderedMatch[2] && orderedMatch[3]) {
    return {
      type: "ordered",
      marker: orderedMatch[2],
      inlines: parseInlines(orderedMatch[3]),
    }
  }

  return {
    type: "normal",
    inlines: parseInlines(line),
  }
}
