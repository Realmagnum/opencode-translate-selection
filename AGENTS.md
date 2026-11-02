# AGENTS.md — opencode-translate-selection

Project instructions, architectural invariants, and verification workflows for AI coding agents working on `opencode-translate-selection`.

---

## 🧭 Project Overview

`opencode-translate-selection` is an official-grade OpenCode plugin providing:
- **OpenCode Desktop**: Instant inline floating translation tooltip directly on mouse text selection, cleanly positioned above the native `[ ❝ Quote ]` bar.
- **OpenCode TUI / Terminal**: Hotkeys (`Alt+T`, `Alt+Shift+T`, `Alt+P`), slash commands (`/translate`, `/translate-last`, `/translate-panel`, `/translate-config`), scrollable translation modal dialog, interactive sidebar panel (`session.panel`), and system clipboard integration.
- **Smart Hybrid Translation Routing**: Simple phrases go through instant MT (Google Translate / MyMemory, ~100ms, 0 tokens); multi-line or structured text (bullet points, numbered steps, code signatures, function calls) routes to the active session LLM outside chat context.

---

## 🛠️ Build & Verification Pipeline

Always verify changes using the official npm scripts before completing tasks. Never assume a build or test passes without running:

```bash
# 1. Typecheck TypeScript against @opencode/plugin SDK
npm run typecheck

# 2. Run test suite using native Node.js 22 test runner
npm test

# 3. Compile both GUI (Vite) and TUI (build-tui.mjs) bundles
npm run build

# 4. Full CI verification gate (typecheck + test + build)
npm run ci
```

> **Testing Note**: The test runner is Node's built-in `node --experimental-strip-types --test "test/**/*.test.ts"`. Do **not** install or configure Jest or Vitest.

---

## 📐 Dual Build Pipeline

The project compiles into two distinct artifacts:
1. **GUI (Desktop)**: Bundled via Vite + SolidJS (`vite.config.ts`) $\to$ `dist/gui-experimental.cjs`.
2. **TUI (Terminal)**: Bundled via `build-tui.mjs` (Esbuild + Babel with Solid preset) $\to$ `dist/tui.js`.

Running `npm run build` executes both in sequence (`vite build && node build-tui.mjs`).

---

## ⚠️ Architectural Invariants & Safety Rules

1. **Zero Context Pollution (LLM Translations)**:
   - LLM translations MUST run through `client.session.generate()`.
   - **Never** inject translation requests or temporary prompts into the conversation chat history (`client.session.prompt` or message mutation).
   - Translation generation must remain completely invisible to the user's ongoing session context.

2. **Dual-Process Separation**:
   - **Window / Renderer Process** (`src/popup.tsx`, `src/settings-view.tsx`, `src/formatter-view.tsx`, `src/gui.tsx`):
     - Renders inside OpenCode Desktop DOM tree with SolidJS.
     - Mounts in the `window.bottom` slot and projects floating popups via `<Portal>`.
     - Handles mouse selection (`window.getSelection()`), layout geometry, and UI state.
     - **No direct Node.js network calls** — delegates all background work over the typed IPC contract.
   - **Main / Background Process** (`src/translate.ts`, `src/llm-engine.ts`, `src/shield.ts`, `src/detector.ts`):
     - Handles network requests (Google Translate `gtx`/`dict-chrome-ex`, MyMemory API fallback).
     - Manages the LRU translation cache (500 items).
     - Communicates with session LLM outside conversation history.
   - **IPC Contract** (`src/contract.ts`):
     - Typed boundary between Window and Main using Effect `Schema`.

3. **Preserve Root Entry Shims**:
   - `server.ts`, `tui.ts`, and `tui.tsx` at the package root are required by OpenCode's local plugin resolver when developing plugins from a local directory.
   - **Do not delete, rename, or move these root shims into `src/`**.

4. **Token Shielding (`⟦0⟧`) & Code Protection**:
   - `src/shield.ts` implements mathematical token shielding (`⟦0⟧`, `⟦1⟧`, etc.) to protect code blocks, backticks, and identifier syntax from being mangled by MT engines.
   - Any changes to `src/detector.ts`, `src/shield.ts`, or `src/llm-engine.ts` must be accompanied by new or updated unit tests in `test/`.

5. **Localization (i18n)**:
   - When adding UI strings or settings options to `src/i18n.ts`, ensure corresponding translations are provided across all supported locales (`en`, `ru`, `zh`, `ja`, `de`, `fr`, `es`).
   - `test/i18n.test.ts` automatically asserts key parity across all language dictionaries.

6. **Terminal TUI Compatibility**:
   - TUI components in `src/tui.tsx` rely on `@opentui/core` and `@opentui/solid`.
   - Modals and panels must handle narrow terminal widths gracefully and clean up event listeners / subscriptions on unmount.
