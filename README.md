# opencode-translate-selection

Select text in OpenCode Desktop and get a floating translation popup. No hotkey: the
popup appears on its own, above the built-in **Quote** toolbar, in a warm dark box with
yellow text. Click a line to copy it.

Works anywhere in the app window where the selection is real DOM text — the session
timeline, panels, settings. Not the integrated terminal: it draws to a canvas, so its
selection is not DOM text.

## Install

Already registered in `~/.config/opencode/opencode.json`:

```jsonc
{
  "plugins": [
    "…",
    "/Users/rm/Documents/!Projects/opencode-translate-selection"
  ]
}
```

Restart OpenCode Desktop once: the server part and the GUI are read at start. After that
`npm run watch` reloads the GUI in every window on each rebuild, without a restart.

## Options

```jsonc
{
  "plugins": [
    {
      "package": "/Users/rm/Documents/!Projects/opencode-translate-selection",
      "options": { "targets": ["ru", "en"] }
    }
  ]
}
```

`targets` defaults to `["ru", "en"]`. The source language is detected, and a target equal
to it is dropped, so an English selection shows only the Russian line and vice versa.

## How it works

- `src/gui.tsx` — plugin definition. The window half mounts one component into the
  `window.bottom` slot; the main-process half provides the `translate-selection.translate`
  Ipc.
- `src/popup.tsx` — reads `window.getSelection()` (this is the one piece the GUI SDK does
  not expose), positions itself with `position: fixed` through a Solid `Portal`, and
  renders the result. The popup clears the quote toolbar with `QUOTE_CLEARANCE` (52px)
  measured from the selection's top edge.
- `src/translate.ts` — runs in the Electron main process, where no CSP or CORS applies.
  Uses Google's keyless `gtx` endpoint, caches 500 entries in memory, one request per
  target language.

## Tuning

| What | Where |
| --- | --- |
| Gap above the quote toolbar | `QUOTE_CLEARANCE` in `src/popup.tsx` |
| Popup width | `MAX_WIDTH` in `src/popup.tsx` |
| Character limit | `MAX_CHARS` in `src/popup.tsx` |
| Colours, font | `shell()`, `langTag`, `textStyle` in `src/popup.tsx` |

## Build

```bash
npm install
npm run build      # dist/gui-experimental.cjs
npm run typecheck
npm run watch      # rebuild on change, reloads the GUI in the app
```

## Limits

- The popup hides on scroll, resize, `Esc`, a click outside, or a new selection.
- Selections inside the composer, inputs and text fields are ignored.
- Long selections are trimmed to 600 characters and say so in the footer.
- The GUI plugin API is experimental in 2.2.0: `window.getSelection()` is not part of it
  and may need revisiting after an app update.
