import test from "node:test"
import assert from "node:assert/strict"
import { shieldTokens, unshieldTokens } from "../src/shield.ts"

test("shield: preserves inline code spans", () => {
  const original = "Use `tools.opencode.models()` and `another_func()` to search."
  const { shielded, tokens } = shieldTokens(original)

  assert.equal(tokens.length, 2)
  assert.equal(tokens[0], "`tools.opencode.models()`")
  assert.equal(tokens[1], "`another_func()`")
  assert.equal(shielded, "Use ⟦0⟧ and ⟦1⟧ to search.")

  const restored = unshieldTokens(shielded, tokens)
  assert.equal(restored, original)
})

test("shield: restores tokens even if MT engine adds whitespace inside brackets", () => {
  const original = "Select `myVariable` here"
  const { shielded, tokens } = shieldTokens(original)

  // Emulate Google Translate adding spaces inside ⟦ 0 ⟧
  const mtMangled = shielded.replace("⟦0⟧", "⟦ 0 ⟧")
  const restored = unshieldTokens(mtMangled, tokens)

  assert.equal(restored, original)
})

test("shield: preserves function call syntax without backticks", () => {
  const original = "Run tools.opencode.models({ query: 'test' }) now"
  const { shielded, tokens } = shieldTokens(original)

  assert.ok(tokens.length >= 1)
  assert.match(shielded, /⟦0⟧/)

  const restored = unshieldTokens(shielded, tokens)
  assert.equal(restored, original)
})
