import test from "node:test"
import assert from "node:assert/strict"
import { parseInlines, parseLine } from "../src/formatter.ts"

test("formatter: parseInlines extracts code and bold segments", () => {
  const line = "Use `tools.opencode.models()` and **important note** here"
  const tokens = parseInlines(line)

  assert.equal(tokens.length, 5)
  assert.equal(tokens[0]?.type, "text")
  assert.equal(tokens[0]?.text, "Use ")
  assert.equal(tokens[1]?.type, "code")
  assert.equal(tokens[1]?.text, "tools.opencode.models()")
  assert.equal(tokens[2]?.type, "text")
  assert.equal(tokens[2]?.text, " and ")
  assert.equal(tokens[3]?.type, "strong")
  assert.equal(tokens[3]?.text, "important note")
  assert.equal(tokens[4]?.type, "text")
  assert.equal(tokens[4]?.text, " here")
})

test("formatter: parseLine recognizes bullet points", () => {
  const line = "• Web integration: Direct web search"
  const parsed = parseLine(line)

  assert.equal(parsed.type, "bullet")
  assert.equal(parsed.marker, "•")
  assert.equal(parsed.inlines.length, 1)
  assert.equal(parsed.inlines[0]?.text, "Web integration: Direct web search")
})

test("formatter: parseLine recognizes dash and asterisk bullets", () => {
  const dash = parseLine("- Feature one")
  assert.equal(dash.type, "bullet")
  assert.equal(dash.inlines[0]?.text, "Feature one")

  const asterisk = parseLine("* Feature two")
  assert.equal(asterisk.type, "bullet")
  assert.equal(asterisk.inlines[0]?.text, "Feature two")
})

test("formatter: parseLine recognizes numbered steps", () => {
  const line = "1. First step"
  const parsed = parseLine(line)

  assert.equal(parsed.type, "ordered")
  assert.equal(parsed.marker, "1.")
  assert.equal(parsed.inlines[0]?.text, "First step")
})
