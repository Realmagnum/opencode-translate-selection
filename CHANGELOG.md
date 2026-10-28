# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.3.0] - 2026-10-28

### Added
- **Full OpenCode Terminal (TUI) Support (`./tui`)**:
  - Implemented TUI plugin adapter utilizing OpenTUI (`@opentui/solid` and `@opentui/core`).
  - **Clipboard Translation**: Press `<leader>t` (or `/translate [text]`) to immediately translate clipboard contents with fallback to interactive prompt.
  - **Last Assistant Turn Translation**: Press `<leader>tl` (or `/translate-last`) to fetch and translate the last assistant message in the active session without touching chat context.
  - **Interactive Side Panel (`session.panel`)**: Press `<leader>tp` (or `/translate-panel`) to toggle a dedicated side panel with real-time translation viewer, engine mode badge, and quick keyboard shortcuts (`t`, `l`, `y`, `m`, `f`, `q`).
  - **TUI Settings Command**: `/translate-config` allows interactive switching of target languages and engine mode directly in the terminal, persisted with `context.storage.store`.
  - **Cross-platform Clipboard Integration**: Asynchronous, non-blocking clipboard read/write supporting macOS (`pbpaste`/`pbcopy`), Linux (`wl-paste`/`wl-copy`, `xclip`, `xsel`), and Windows (`powershell`).
  - **Interactive Result Dialogs**: Rich selection dialog offering one-click copy (`y` / `Enter`) and panel redirection.
- **Unit Tests**:
  - Added unit test cases for assistant message extraction and markdown output formatting (total 20 unit tests).

---

## [0.2.0] - 2026-10-28

### Added
- **Smart Hybrid Translation Routing**:
  - Short and plain text (< 40–80 chars) is routed to ultra-fast Google MT (~100ms) with zero token usage.
  - Multi-line structured text (bullet points, numbered lists, function calls, code blocks) automatically routes to the **active session's LLM** outside conversation history.
  - Zero session context pollution: LLM requests run via `client.session.generate()` without storing messages in conversation history or consuming chat context.
- **Multi-Script & All-Languages Support**:
  - Unicode script detection for Chinese (CJK), Japanese (Hiragana/Katakana), Korean (Hangul), Cyrillic (Russian), and Latin (English, German, French, etc.).
  - Supports any language understood by Google Translate (130+ languages) and the session's active LLM.
- **Fail-safe Fallback Engine with Token Shielding**:
  - LLM timeout protection (configurable, 3.5s default). If the model is busy, times out, or errors, requests automatically fall back to the multi-tier MT pipeline.
  - Mathematical Token Shielding (`⟦0⟧`, `⟦1⟧`) isolates code blocks and identifier calls (`tools.opencode.models(...)`) so MT engines do not mangle casing or syntax.
- **Structured Popup Rendering**:
  - Dedicated SolidJS component (`FormattedText`) with bullet tags `•`, numbered steps `1.`, indentations, and monospace inline code chips on subtle background.
  - Engine source indicator badge (`LLM` tag) when translation is produced by the session model.
  - Vertical scroll containment (`maxHeight`, 420px default) for long multi-item lists.
  - Formatted Markdown clipboard copy on click.
- **Dedicated GUI Settings Page (`/settings?tab=translate`)**:
  - Real-time **Live Preview** showcasing structured formatting and color adjustments.
  - **Engine Mode Selector**: `Auto (Smart)`, `Fast MT Only`, or `Session LLM Only`.
  - **LLM Timeout Slider**: configurable wait time (1.5s – 8.0s).
  - **Popup Dimensions**: sliders for Quote clearance, border radius, font size, max width, and max height.
  - 5 Theme Presets: Amber Gold, Midnight OLED, Cyberpunk, Nordic Slate, Paper Light.
  - Real-time state persistence via OpenCode's `Store.global`.
- **Unit Test Suite**:
  - 15 automated test cases covering structure detection, token shielding, prompt generation, LLM output sanitization, and line formatting.
- **GitHub Actions CI**:
  - Automated workflow verifying typecheck, unit tests, and build on Node 22.

---

## [0.1.0] - 2026-10-28

### Added
- Initial release for OpenCode Desktop (v2.2.0+).
- Automatic selection popup positioned cleanly above OpenCode's native Quote toolbar (`QUOTE_CLEARANCE = 52px`).
- Multi-tier machine translation pipeline:
  1. Google Translate `gtx` endpoint.
  2. Google Translate `dict-chrome-ex` secondary client.
  3. MyMemory Translate API fallback.
- In-memory LRU cache (500 items).
- Bilingual source language auto-filtering (e.g. English selection shows only Russian target).
- Single-click clipboard copying.
