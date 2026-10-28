import test from "node:test"
import assert from "node:assert/strict"
import { extractAssistantText, formatTransOutputMarkdown, formatKey } from "../src/tui-extract.ts"
import type { TransOutput } from "../src/translate.ts"

test("tui-extract: extractAssistantText concatenates text chunks correctly", () => {
  const dummyAssistant: any = {
    type: "assistant",
    content: [
      { type: "reasoning", text: "Thinking process..." },
      { type: "text", text: "Hello from assistant!" },
      { type: "tool", state: {} },
      { type: "text", text: "Here is step 2." },
    ],
  }

  const extracted = extractAssistantText(dummyAssistant)
  assert.equal(extracted, "Hello from assistant!\n\nHere is step 2.")
})

test("tui-extract: extractAssistantText returns empty string for empty content", () => {
  const dummyAssistant: any = {
    type: "assistant",
    content: [],
  }

  assert.equal(extractAssistantText(dummyAssistant), "")
})

test("tui-extract: formatTransOutputMarkdown formats results with language headers", () => {
  const output: TransOutput = {
    detected: "en",
    results: [
      {
        lang: "ru",
        text: "Привет мир",
        engineUsed: "gtx",
      },
      {
        lang: "de",
        text: "Hallo Welt",
        engineUsed: "llm",
      },
    ],
  }

  const md = formatTransOutputMarkdown(output)
  assert.match(md, /\*\*\[RU\]\*\*\s*Привет мир/)
  assert.match(md, /\*\*\[DE\]\*\* \[LLM\]\s*Hallo Welt/)
})

test("tui-extract: formatTransOutputMarkdown includes errors when present", () => {
  const output: TransOutput = {
    detected: "en",
    results: [
      {
        lang: "ru",
        text: "",
        error: "Network timeout",
      },
    ],
  }

  const md = formatTransOutputMarkdown(output)
  assert.match(md, /Error: Network timeout/)
})

test("tui-extract: formatKey formats combinations into readable labels", () => {
  assert.equal(formatKey("alt+t"), "Alt+T")
  assert.equal(formatKey("alt+shift+t"), "Alt+Shift+T")
  assert.equal(formatKey("ctrl+shift+p"), "Ctrl+Shift+P")
  assert.equal(formatKey("cmd+y"), "Cmd+Y")
  assert.equal(formatKey(""), "")
})
