# opencode-translate-selection

> Instant inline translation tooltip on text selection for **OpenCode Desktop**.

Select text anywhere in the session timeline or side panels, and a floating translation popup appears automatically — positioned directly above OpenCode's native **Quote** toolbar. No hotkeys required. Click any translation line to copy it to clipboard.

![Translate Selection in OpenCode Desktop](assets/screenshot.png)

---

## ✨ Features

- **Zero-friction workflow**: Just select text with your mouse. The translation appears automatically after a subtle 140ms debounce.
- **Smart positioning**: Floats cleanly **above** the built-in `[ ❝ Quote ]` toolbar (`QUOTE_CLEARANCE = 52px`), without overlapping or jumping.
- **Bilingual & smart filtering**: Automatically detects the source language. Translates into your configured target languages (`RU` and `EN` by default) and drops the language matching the source (e.g. selecting English text shows only the Russian translation).
- **High-contrast warm dark theme**: Deep olive background (`rgba(43, 34, 10, 0.97)`), bright yellow translation text (`#ffd75e`), and golden language badges (`#c9a83f`).
- **One-click copy**: Click on any translated line to copy it directly to your clipboard.
- **Multi-tier fallback engine**:
  1. **Google Translate (Primary)** via `gtx` endpoint.
  2. **Google Translate (Secondary client)** via `dict-chrome-ex` if primary is rate-limited.
  3. **MyMemory Translate API (Fallback)** if Google services are unavailable or blocked.
- **In-memory LRU cache**: Keeps up to 500 recent translations in memory for instant повторный просмотр with zero network overhead.
- **Zero runtime footprint**: Built as an ultra-compact single file bundle (`9.6 KB`) running in OpenCode's SolidJS environment.

---

## 📦 Installation

### Option A: Install from GitHub

```bash
opencode plugin add github:Realmagnum/opencode-translate-selection
```

Restart OpenCode Desktop after installation.

### Option B: Local development / manual installation

1. Clone the repository into your projects directory:

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

3. Restart OpenCode Desktop once. Subsequent edits via `npm run watch` reload the GUI automatically without needing an app restart!

---

## ⚙️ Configuration

In your `~/.config/opencode/opencode.json`:

```jsonc
{
  "plugins": [
    {
      "package": "github:Realmagnum/opencode-translate-selection",
      "options": {
        // Target languages to translate into (default: ["ru", "en"])
        "targets": ["ru", "en"],
        // Enable diagnostic toasts on every selection
        "debug": false
      }
    }
  ]
}
```

---

## 🛠️ How It Works

```
┌────────────────────────────────────────────────────────┐
│  OpenCode Desktop (Electron Window / SolidJS Renderer) │
│                                                        │
│  User selects text in timeline                         │
│   └─► `window.getSelection()`                          │
│   └─► `selection.getRangeAt(0).getBoundingClientRect()`│
│   └─► Solid `<Portal>` renders above Quote toolbar     │
└──────────────────────────┬─────────────────────────────┘
                           │ Ipc (Effect Schema bridge)
                           ▼
┌────────────────────────────────────────────────────────┐
│  Electron Main Process (Node.js runtime)               │
│                                                        │
│  1. Check in-memory LRU Cache                          │
│  2. Google Translate (gtx / dict-chrome-ex)            │
│  3. Fallback: MyMemory Translate API                   │
│  4. Deduplicate & return detected source + results     │
└────────────────────────────────────────────────────────┘
```

1. **Window setup (`src/gui.tsx`)**: Mounts a non-intrusive reactive surface into the `window.bottom` slot.
2. **Selection & Popup (`src/popup.tsx`)**: Tracks mouse release on the document, reads the active `Selection` range, measures coordinates, and portals a fixed-position popup above the native Quote toolbar.
3. **Electron Main Bridge (`src/translate.ts`)**: Translation requests run in the Electron main process via typed OpenCode `Ipc`, bypassing renderer CORS or Content Security Policy restrictions completely.

---

## ⚠️ Known Limitations

- **DOM text only**: Works across the chat timeline, tool cards, markdown messages, and sidebar panels. Does **not** work on text inside the integrated terminal, because the terminal renders to an HTML5 canvas (ghostty-web) where text selection does not produce DOM nodes.
- **Input fields**: Text selection inside textareas, inputs, or the prompt composer is intentionally ignored to avoid interfering with typing.

---

## 💻 Development

```bash
npm run typecheck   # Typecheck TypeScript against @opencode/plugin
npm run build       # Build dist/gui-experimental.cjs (Vite + Solid)
npm run watch       # Watch & rebuild on changes (auto-reloads GUI in OpenCode)
```

### Why is `node_modules` so large?

`node_modules` (~200 dependencies) contains **only build-time tools** (`vite`, `esbuild`, `rollup`, `typescript`, `@babel/*` for JSX). When built, the entire plugin compiles into **a single 9.6 KB file** (`dist/gui-experimental.cjs`). In OpenCode Desktop at runtime, **none** of `node_modules` is loaded or used; SolidJS and Effect are provided by OpenCode itself.

---

## 📄 License

[MIT](LICENSE) © 2026 [Realmagnum](https://github.com/Realmagnum)
