import test from "node:test"
import assert from "node:assert/strict"
import { isComplexFormattedText } from "../src/detector.ts"
import { detectScriptLanguage } from "../src/translate.ts"

test("detector: identifies script language for Chinese, Russian, Japanese and English", () => {
  assert.equal(detectScriptLanguage("这是一个测试"), "zh")
  assert.equal(detectScriptLanguage("主要功能：• 搜索"), "zh")
  assert.equal(detectScriptLanguage("Привет мир"), "ru")
  assert.equal(detectScriptLanguage("こんにちは"), "ja")
  assert.equal(detectScriptLanguage("Hello world"), "en")
})

test("detector: identifies short plain phrases as simple (not complex)", () => {
  assert.equal(isComplexFormattedText("Hello world"), false)
  assert.equal(isComplexFormattedText("Model-specific search"), false)
  assert.equal(isComplexFormattedText("Direct web search and content fetching"), false)
  assert.equal(isComplexFormattedText(""), false)
})

test("detector: identifies bullet lists as complex", () => {
  const bulletSample = `Key Features:
• Model-specific search: Use tools.opencode.models()
• Web integration: Direct web search`
  assert.equal(isComplexFormattedText(bulletSample), true)

  const dashSample = `Tasks to do:
- First task
- Second task`
  assert.equal(isComplexFormattedText(dashSample), true)
})

test("detector: identifies numbered lists as complex", () => {
  const numbered = `Steps:
1. Clone repo
2. Run build`
  assert.equal(isComplexFormattedText(numbered), true)
})

test("detector: identifies code snippets and function calls as complex", () => {
  assert.equal(isComplexFormattedText("tools.opencode.models({ query: 'search' })"), true)
  assert.equal(isComplexFormattedText("Check the value of `variableName` here"), true)
  assert.equal(isComplexFormattedText("```ts\nconst x = 1\n```"), true)
})

test("detector: identifies JSON-like key-value arguments as complex", () => {
  assert.equal(isComplexFormattedText("options: { query: 'search', limit: 10 }"), true)
})
