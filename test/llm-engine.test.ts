import test from "node:test"
import assert from "node:assert/strict"
import { buildLlmPrompt, cleanLlmOutput, targetLangName } from "../src/llm-engine.ts"

test("llm-engine: maps language codes to English names", () => {
  assert.equal(targetLangName("ru"), "Russian")
  assert.equal(targetLangName("en"), "English")
  assert.equal(targetLangName("de"), "German")
  assert.equal(targetLangName("es"), "Spanish")
  assert.equal(targetLangName("zh-CN"), "Chinese")
})

test("llm-engine: buildLlmPrompt contains strict instructions", () => {
  const prompt = buildLlmPrompt("• Bullet point", "ru")
  assert.match(prompt, /Translate the following text to Russian/)
  assert.match(prompt, /Preserve all structural formatting exactly/)
  assert.match(prompt, /DO NOT translate, change, or rename code/)
  assert.match(prompt, /Return ONLY the translated content/)
  assert.match(prompt, /• Bullet point/)
})

test("llm-engine: cleanLlmOutput strips conversational intro and wrapper fences", () => {
  const withFence = "```markdown\n• Пункт один\n• Пункт два\n```"
  assert.equal(cleanLlmOutput(withFence, "• Item one\n• Item two"), "• Пункт один\n• Пункт два")

  const withIntro = "Here is the translation:\n• Пункт один"
  assert.equal(cleanLlmOutput(withIntro, "• Item one"), "• Пункт один")

  const withRussianIntro = "Вот перевод:\nКлючевые особенности"
  assert.equal(cleanLlmOutput(withRussianIntro, "Key Features"), "Ключевые особенности")
})
