# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.3.2] - 2026-10-28

### Added
- **Full Dynamic Internationalization (i18n) for Plugin Settings & UI**:
  - The entire Settings page, preset names, live preview mockup, control labels, section titles, and action buttons now dynamically adapt to the active interface and system language.
  - Comprehensive localization catalogs added for major world languages:
    - English (`en`, `en-US`, `en-GB`)
    - Russian (`ru`, `ru-RU`)
    - Simplified & Traditional Chinese (`zh`, `zh-CN`, `zh-Hans`, `zht`, `zh-TW`, `zh-Hant`)
    - German (`de`, `de-DE`)
    - Spanish (`es`, `es-ES`)
    - French (`fr`, `fr-FR`)
    - Japanese (`ja`, `ja-JP`)
  - Reactive `SettingsPage` factory registration (`ctx.add(SettingsPage, () => ({ ... }))`) ensuring the settings navigation sidebar label updates instantly when switching language in OpenCode.
  - Dynamic getters in `TranslationSurface` labels ensuring the popup tooltip labels re-render reactively.
  - Intelligent default target languages on reset (`getDefaultTargetsForLocale`), adapting default targets to the active system locale (`ru, en`, `zh, en`, `de, en`, `es, en`, `fr, en`, `ja, en`, etc.).
  - Added locale awareness to terminal TUI dialogs and commands, automatically displaying in Russian or English based on system locale (`LANG`, `LC_ALL`, `Intl`).
- **Comprehensive i18n Test Suite**:
  - Added unit tests verifying key completeness across all 7 supported dictionaries, parameter interpolation, country-code matching, fallback behavior, and locale-based defaults (28 unit tests, 100% passing).

### Removed
- Removed outdated `STRUCTURED-TRANSLATION-SPEC.md`.

---

## [0.3.1] - 2026-10-28

### Added
- **Customizable TUI Keybindings**:
  - Configure keybindings directly from the Desktop GUI (`Settings > Translation > Terminal (TUI) Keybindings`) or interactively in the terminal via `/translate-config > Горячие клавиши`.
  - Fixes shortcut collisions with terminal emulators (e.g. Ghostty's native `Alt+T`, iTerm2, Alacritty) by allowing users to set any key combinations (e.g. `alt+y`, `ctrl+t`, `alt+c`).
  - Seamless two-way persistence: keybinding changes made in GUI settings are saved to TUI state (`plugin.translate-selection.tui-settings.json`) and vice-versa.
- **TUI Visual Documentation**:
  - Added screenshots of the multiline scrollable modal dialog (`assets/tui-modal.png`) and the responsive side panel (`assets/tui-panel.png`) to README.
- **Enhanced Symmetrical Modal & Responsive Panel Layout**:
  - Removed asymmetric borders in `TranslationModal` to match native OpenCode modal dialogs.
  - Redesigned side panel header and footer for narrow terminal widths (30–40 columns): non-breaking chip-based hotkey legend and responsive header hierarchy.

---

## [0.3.0] - 2026-10-28

### Added
- **First-Class OpenCode Terminal (TUI) Support (`./tui`)**:
  - Full-featured TUI plugin adapter utilizing OpenTUI (`@opentui/solid` and `@opentui/core`).
  - **Conflict-Free Keybindings & Commands**:
    - `Alt+T` / `/translate [text]` (alias: `/tr`): Instantly translate clipboard text or custom input.
    - `Alt+Shift+T` / `/translate-last` (alias: `/trl`): Translate the last assistant turn in current session.
    - `Alt+P` / `/translate-panel` (alias: `/trp`): Toggle persistent translation side panel (`session.panel`).
    - `/translate-config`: Interactive TUI configuration dialog for target languages and engine modes.
  - **Scrollable Multiline Translation Modal (`TranslationModal`)**:
    - Centered high-contrast modal dialog replacing single-line selectors.
    - Full word wrapping (`wrapMode="word"`) displaying extensive multi-paragraph translations and code blocks without truncation.
    - Dedicated scroll container (`<scrollbox>`) with keyboard scrolling (`↑`/`↓`, `j`/`k`, `PageUp`/`PageDown`).
    - Quick actions: `y` (copy to clipboard), `Enter` (copy and close), `p` (open in side panel), `q` / `Esc` (dismiss).
  - **Seamless In-Place Side Panel Updates**:
    - When the side panel is open, pressing `Alt+T` or `Alt+Shift+T` updates the translation in-place inside the panel without opening popup dialogs.
    - Displays non-intrusive confirmation toast (`✓ Перевод обновлён в панели`).
  - **Interactive Side Panel (`session.panel`)**:
    - Real-time translation viewer with word wrap and persistent scrolling.
    - Visual focus tracking indicator (`[фокус]` / `(клик для фокуса)`).
    - Quick hotkeys when focused:
      - `t`: Translate current clipboard.
      - `l`: Translate last assistant response.
      - `y`: Copy Markdown translation to clipboard.
      - `m`: Cycle engine mode on the fly (`AUTO` ⇄ `FAST` ⇄ `LLM`).
      - `f`: Toggle full-screen panel presentation.
      - `q` / `Esc`: Close side panel.
  - **Interactive TUI Configuration (`/translate-config`)**:
    - Select target languages (e.g. `ru, en` or custom comma-separated list).
    - Switch engine mode (`AUTO` / `FAST` / `LLM`).
    - Reset settings to defaults with durable persistence via `context.storage.store`.
  - **Cross-Platform Clipboard Engine**:
    - Asynchronous, non-blocking clipboard read/write supporting macOS (`pbpaste`/`pbcopy`), Linux Wayland (`wl-paste`/`wl-copy`), Linux X11 (`xclip`, `xsel`), Windows (`powershell`), and terminal OSC 52.
  - **Dedicated TUI Build Pipeline**:
    - Added `build-tui.mjs` compiling OpenTUI Solid components into `dist/tui.js` using esbuild + universal Babel Solid transform for runtime compatibility in Node and Bun.
- **Unit Test Suite Expansion**:
  - Added unit test cases for assistant message extraction and markdown output formatting (total 20 unit tests, 100% passing).

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
