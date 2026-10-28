<div align="center">

# opencode-translate-selection

[![OpenCode Desktop](https://img.shields.io/badge/OpenCode_Desktop-v2.2.0+-blue.svg?logo=electron&logoColor=white)](https://opencode.ai/)
[![OpenCode TUI](https://img.shields.io/badge/OpenCode_TUI-v2.2.0+-green.svg?logo=gnubash&logoColor=white)](https://opencode.ai/)
[![CI](https://github.com/Realmagnum/opencode-translate-selection/actions/workflows/ci.yml/badge.svg)](https://github.com/Realmagnum/opencode-translate-selection/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![SolidJS](https://img.shields.io/badge/SolidJS-1.9-2c4f7c.svg?logo=solid&logoColor=white)](https://www.solidjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Instant inline translation tooltip on text selection for OpenCode Desktop & Full Terminal TUI Support with Smart Hybrid LLM/MT routing — supports all languages.**

<br>

<img src="assets/screenshot.png" alt="Translate Selection in OpenCode Desktop" width="700" />

</div>

---

> [!IMPORTANT]
> **Requires OpenCode v2.2.0 or newer**.
> - **In OpenCode Desktop**: Provides an instant floating translation tooltip on text selection directly above the native **Quote** toolbar.
> - **In OpenCode TUI / Terminal**: Provides conflict-free hotkeys (`Alt+T`, `Alt+Shift+T`, `Alt+P`), slash commands (`/translate`, `/translate-last`, `/translate-panel`, `/translate-config`), a scrollable multiline translation modal, an interactive side panel (`session.panel`), and seamless clipboard integration.

---

## ✨ Features

- **Zero-friction workflow**: Just select text with your mouse. The translation appears automatically after a subtle 140ms debounce.
- **Smart positioning**: Floats cleanly **above** the built-in `[ ❝ Quote ]` toolbar (`QUOTE_CLEARANCE = 52px`), without overlapping or jumping.
- **Smart Hybrid Translation**:
  - **Simple phrases & words**: Translated instantly via Google Translate (~100ms) with zero token usage.
  - **Complex structures & code**: Multi-line selections (bullet lists `•`, numbered steps `1.`, function calls like `tools.opencode.models()`, parameter objects) automatically route to the **active session's LLM** outside conversation history.
  - **Zero context pollution**: LLM translations run via `client.session.generate()`, so they never add messages to your chat or consume conversation context.
- **Fail-safe Fallback with Token Shielding**: If the LLM times out (> 3.5s) or is busy, requests seamlessly fall back to the multi-tier MT pipeline with mathematical token shielding (`⟦0⟧`) protecting code and identifiers.
- **Universal Language Support & Smart Filtering**: Works with **any language** supported by Google Translate (130+ languages) and your session's LLM — including Chinese, Japanese, Korean, Russian, English, German, French, Spanish, and more. Automatically detects the source language, translates into your configured target languages (`ru, en` by default or any custom list in Settings), and intelligently hides the target that matches the source (e.g. selecting English text shows only Russian; selecting Chinese or Japanese displays Russian and English; or configure a single target like `ru` to translate everything exclusively into Russian).
- **Structured Popup Rendering**:
  - Clean bullet tags (`•`), numbered steps (`1.`), and indentations.
  - Inline code highlighted in monospace font on subtle background chips: `<code style="...">`.
  - Subtle `LLM` tag badge when translated via session model.
  - Vertical scroll containment (`maxHeight = 420px`) for long multi-item lists.
- **High-contrast warm dark theme**: Deep olive background (`rgba(43, 34, 10, 0.97)`), bright yellow translation text (`#ffd75e`), and golden language badges (`#c9a83f`).
- **One-click copy**: Click on any translated block to copy full formatted Markdown to your clipboard.
- **Multi-tier MT engine**: Google Translate (`gtx` + `dict-chrome-ex`) with MyMemory API fallback.
- **In-memory LRU cache**: Keeps up to 500 recent translations in memory for instant lookups with zero network overhead.
- **Dedicated GUI Settings**: Full-featured settings page (`/settings?tab=translate`) with an embedded Live Preview, Engine Mode selector (Auto / Fast MT / Session LLM), LLM timeout slider, 5 color presets, and geometry controls.
- **Zero runtime footprint**: Built as an ultra-compact single file bundle (`37 KB` unminified / `12 KB` gzip) running in OpenCode's SolidJS environment.

---

## 📦 Installation

### Option A: Install from GitHub

```bash
opencode plugin add github:Realmagnum/opencode-translate-selection
```

Restart OpenCode Desktop after installation.

### Option B: Local development / manual installation

1. Clone the repository:

```bash
git clone https://github.com/Realmagnum/opencode-translate-selection.git \
  ~/Documents/!Projects/opencode-translate-selection
cd ~/Documents/!Projects/opencode-translate-selection
npm install
npm run build
```

2. Add the absolute path to `~/.config/opencode/opencode.json`:

```jsonc
{
  "plugins": [
    "/Users/you/Documents/!Projects/opencode-translate-selection"
  ]
}
```

3. Restart OpenCode Desktop once. Subsequent edits via `npm run watch` reload the GUI automatically in real time without needing an app restart!

---

## 💻 Terminal (TUI) Usage

When running OpenCode in your terminal (`opencode`), the plugin automatically activates its first-class TUI module powered by OpenTUI (`@opentui/solid` & `@opentui/core`) with zero configuration required.

### ⌨️ Keybindings & Slash Commands

All hotkeys are conflict-free and don't clash with OpenCode's native keys:

| Keybind | Command / Slash | Description |
|---|---|---|
| `Alt+T` | `/translate [text]` (alias: `/tr`) | **Translate clipboard text** (or custom prompt if clipboard is empty). If the side panel is open, updates the panel in-place; otherwise opens a scrollable modal dialog. |
| `Alt+Shift+T` | `/translate-last` (alias: `/trl`) | **Translate last assistant message** from active session. Out-of-band translation with zero session history pollution. |
| `Alt+P` | `/translate-panel` (alias: `/trp`) | **Toggle side panel** (`session.panel`) for persistent side-by-side reading. |
| — | `/translate-config` | Open interactive TUI settings (target languages, engine mode: `AUTO` / `FAST` / `LLM`). |

*(All commands are also discoverable in the command palette via `Ctrl+P`).*

---

### 🪟 Scrollable Multiline Translation Modal

<p align="center">
  <img src="assets/tui-modal.png" alt="OpenCode TUI Multiline Translation Modal" width="620" />
</p>

When the side panel is closed, pressing `Alt+T` opens a centered, high-contrast modal dialog:

- **Full Multiline Text & Word Wrapping**: Unlike standard one-line menus, translations render with complete word wrapping (`wrapMode="word"`). Long paragraphs, code snippets, and lists are displayed without truncation.
- **Smooth Keyboard & Mouse Scrolling**: Dedicated `<scrollbox>` navigable via `↑`/`↓`, `j`/`k`, `PageUp`/`PageDown`, or mouse wheel.
- **One-Click Actions**:
  - `y`: Copy translation to system clipboard.
  - `Enter`: Copy translation to clipboard and immediately dismiss the modal.
  - `p`: Transfer current translation into the persistent side panel and close the modal.
  - `q` / `Esc`: Dismiss the modal.

---

### 📑 Persistent Side Panel (`session.panel`)

<p align="center">
  <img src="assets/tui-panel.png" alt="OpenCode TUI Translation Sidebar Panel" width="340" />
</p>

Press `Alt+P` or run `/translate-panel` to open a persistent translation sidebar alongside your active chat session.

#### 🔄 Seamless In-Place Updates
When the side panel is already open, pressing `Alt+T` (clipboard) or `Alt+Shift+T` (last turn) **never spawns popup dialogs**. It seamlessly translates the text and **reactively updates the translation in-place inside the panel**, accompanied by a subtle confirmation toast (`✓ Перевод обновлён в панели`).

#### 🎮 Panel Hotkeys & Focus Control
When the panel has focus (indicated by a green `[фокус]` badge in the top right; click anywhere in the panel to focus):
- **`t`**: Translate current clipboard contents.
- **`l`**: Translate the last assistant message.
- **`y`**: Copy full formatted Markdown translation to clipboard.
- **`m`**: Cycle engine mode on the fly (`AUTO` ⇄ `FAST` ⇄ `LLM`).
- **`f`**: Toggle full-screen mode (expands panel across the entire terminal for reading lengthy documentation).
- **`q`** or **`Esc`**: Close the side panel.
- **`↑`/`↓`, `j`/`k`, `PageUp`/`PageDown`**: Scroll through translation text.

---

### ⌨️ Customizable Keybindings (Ghostty & Custom Terminals)

If your terminal emulator (such as **Ghostty**, iTerm2, Alacritty, or Kitty) intercepts `Alt+T` for native window/tab shortcuts, you can easily customize all translation shortcuts:

1. **Via Desktop GUI Settings** (`Settings > Translation > Terminal (TUI) Keybindings`):
   - Edit **Translate Clipboard Hotkey** (e.g. `alt+y`, `ctrl+t`, `alt+c`).
   - Edit **Translate Last Turn Hotkey** (e.g. `alt+shift+y`, `ctrl+shift+t`).
   - Edit **Toggle Side Panel Hotkey** (e.g. `alt+o`, `ctrl+p`).
   - All changes instantly sync to your terminal configuration!
2. **Directly in the Terminal** (`/translate-config`):
   - Select **Горячие клавиши** to change key combinations interactively on the fly.

---

### ⚙️ Interactive TUI Configuration (`/translate-config`)

Run `/translate-config` inside any terminal session to configure settings stored durably via `context.storage.store`:
1. **Target Languages**: Edit comma-separated ISO language codes (e.g. `ru, en` or a single target like `ru`).
2. **Engine Mode**:
   - `Auto (Smart Hybrid)`: Fast Google MT (~100ms) for single words/phrases; Session LLM for structured lists and code.
   - `Fast MT Only`: 100% Google Translate / MyMemory with zero token usage.
   - `Session LLM Only`: Always translate using the session's active model.
3. **Reset to Defaults**: Quickly restore default preferences.

---

### 📋 Cross-Platform Clipboard Integration

Translations can be copied and pasted seamlessly regardless of your operating system:
- **macOS**: Native `pbpaste` / `pbcopy`.
- **Linux**: Automatic detection of Wayland (`wl-paste` / `wl-copy`) and X11 (`xclip` / `xsel`).
- **Windows**: PowerShell clipboard interoperability.
- **OSC 52**: Terminal escape sequence fallback for remote SSH sessions.

---

## ⚙️ Settings (GUI)

The plugin integrates seamlessly with OpenCode Desktop's Settings:

### 1. Plugin Management (`Settings > Extensions > Plugins`)

The plugin automatically registers with OpenCode's native extensions manager. You can reload its GUI or toggle it on/off at any time without restarting OpenCode:

<p align="center">
  <img src="assets/extensions.png" alt="OpenCode Extensions Plugins Manager" width="620" />
</p>

### 2. Dedicated Configuration (`Settings > Translation`)

A dedicated **Translation** page is added directly to OpenCode Desktop's Settings (`/settings?tab=translate`, icon: `globe`).

<p align="center">
  <img src="assets/settings.png" alt="Translation Tooltip Settings with Live Preview" width="620" />
</p>

You can customize everything in real-time with an **interactive Live Preview**:
- **Engine Mode**:
  - `Auto (Smart)` *(Default)*: Google MT for single phrases; Session LLM for structured lists and code.
  - `Fast MT Only`: Always use Google / MyMemory (fastest, zero LLM usage).
  - `Session LLM Only`: Always translate using the active session's model.
- **LLM Fallback Timeout**: Configurable wait time (1.5s – 8.0s) before falling back to Google Translate.
- **Theme Presets**: Switch instantly between *Amber Gold*, *Midnight OLED*, *Cyberpunk*, *Nordic Slate*, or *Paper Light*.
- **Custom Colors**: Pick custom background, text, and accent/badge colors, and adjust backdrop opacity (40% – 100%).
- **Position & Dimensions**:
  - Quote clearance height (20px – 100px).
  - Corner border-radius (0px – 24px).
  - Maximum tooltip width (300px – 800px).
  - Maximum tooltip height (200px – 700px).
  - Text font size (10px – 18px).
- **Target Languages**: Edit comma-separated ISO language codes (e.g. `ru, en, de, fr, es, zh, ja, ko`). Supports **any language** understood by Google Translate (130+ languages) or your active LLM. Set a single code like `ru` to translate all foreign text (English, Chinese, etc.) strictly into Russian.
- **Behavior**: Adjust selection debounce delay (60ms – 400ms) and character limits (200 – 2500).
- **Reset**: Restore defaults with one click.

All changes are saved automatically via OpenCode's `Store.global` and apply instantly without restarting OpenCode.

---

## 🛠️ Architecture & How It Works

```mermaid
flowchart TD
    subgraph UI ["Desktop Window (SolidJS Renderer)"]
        direction TB
        SEL["User selects text in timeline"] --> DET{"isComplexFormattedText?"}
        DET -->|Simple phrase| FAST["Mode: Fast MT"]
        DET -->|Bullets / Code / Lists| HYBRID["Mode: Session LLM"]
    end

    subgraph MAIN ["Electron Main Process (Node.js)"]
        direction TB
        HYBRID --> LLM["LLM Engine (client.session.generate)"]
        LLM -->|Success &lt; 3.5s| RES["Preserved Markdown Translation"]
        LLM -->|Timeout or Error| FALLBACK["Token Shielding (⟦0⟧)"]
        FAST --> FALLBACK
        FALLBACK --> MT["Multi-tier MT (Google / MyMemory)"]
        MT --> UN["Unshield Tokens"]
        UN --> RES
    end

    RES --> POPUP["Solid &lt;Portal&gt; Popup above Quote toolbar"]
    POPUP -->|Click line| CLIP["Copy Markdown to clipboard"]
```

1. **Window setup (`src/gui.tsx`)**: Mounts a non-intrusive reactive surface into the `window.bottom` slot.
2. **Selection & Popup (`src/popup.tsx`)**: Tracks mouse release on the document, reads the active `Selection` range, measures coordinates, and portals a fixed-position popup above the native Quote toolbar.
3. **Electron Main Bridge (`src/translate.ts`)**: Translation requests run in the Electron main process via typed OpenCode `Ipc`, bypassing renderer CORS or Content Security Policy restrictions completely.
4. **Session LLM Generation (`src/llm-engine.ts`)**: Executes outside conversation history via `client.session.generate({ sessionID, prompt })`, producing symbol-for-symbol accurate translations without polluting the user's session.

---

## ⚠️ Known Limitations

- **DOM text only**: Works across the chat timeline, tool cards, markdown messages, and sidebar panels. Does **not** work on text inside the integrated terminal, because the terminal renders to an HTML5 canvas (ghostty-web) where text selection does not produce DOM nodes.
- **Input fields**: Text selection inside textareas, inputs, or the prompt composer is intentionally ignored to avoid interfering with typing.

---

## 💻 Development & Testing

```bash
npm run typecheck   # Typecheck TypeScript against @opencode/plugin
npm test            # Run 15 unit tests (detector, shield, formatter, llm-engine)
npm run build       # Build dist/gui-experimental.cjs (Vite + Solid)
npm run watch       # Watch & rebuild on changes (auto-reloads GUI in OpenCode)
npm run ci          # Full CI suite: typecheck + test + build
```

---

## 📄 License

[MIT](LICENSE) © 2026 [Realmagnum](https://github.com/Realmagnum)
