# Contributing to opencode-translate-selection

Thank you for your interest in improving `opencode-translate-selection`!

We welcome contributions of all kinds: bug reports, pull requests, UI styling improvements, language additions, and feature proposals.

---

## 🛠️ Local Development Setup

### Prerequisites
- **Node.js**: v22.0.0 or higher.
- **OpenCode Desktop**: v2.2.0 or newer.

### Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/Realmagnum/opencode-translate-selection.git
   cd opencode-translate-selection
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Link the plugin into your global OpenCode configuration (`~/.config/opencode/opencode.json`):
   ```jsonc
   {
     "plugins": [
       "/absolute/path/to/opencode-translate-selection"
     ]
   }
   ```

4. Start Vite in watch mode:
   ```bash
   npm run watch
   ```
   OpenCode Desktop automatically detects changes to `dist/gui-experimental.cjs` and reloads the GUI in real time without restarting the app.

---

## 🧪 Testing and Verification

Before submitting a Pull Request, ensure all checks pass:

```bash
# Typecheck TypeScript against @opencode/plugin SDK
npm run typecheck

# Run unit tests (detector, shield, formatter, llm-engine)
npm test

# Verify production build bundle
npm run build

# Run complete CI verification locally
npm run ci
```

---

## 📐 Architecture Overview

The plugin follows OpenCode's dual-process architecture:

- **Window Process (`src/popup.tsx`, `src/formatter-view.tsx`, `src/settings-view.tsx`)**:
  - Rendered with SolidJS into OpenCode Desktop's DOM tree.
  - Mounts in the `window.bottom` slot and renders floating tooltips with `<Portal>`.
  - Captures selections via `window.getSelection()`, calculates bounding boxes, and handles user interactions.
- **Electron Main Process (`src/translate.ts`, `src/llm-engine.ts`, `src/shield.ts`)**:
  - Handles network operations (Google Translate, MyMemory API) without renderer CORS or CSP restrictions.
  - Calls `client.session.generate()` for structured LLM translations outside conversation history.
  - Manages the LRU translation cache.
- **IPC Contract (`src/contract.ts`)**:
  - Typed bridge between Window and Main using Effect `Schema`.

---

## 📝 Pull Request Guidelines

1. Create a focused feature branch (`git checkout -b feature/my-enhancement`).
2. Keep changes minimal, clean, and well-commented.
3. If modifying translation logic, add or update corresponding unit tests in `test/`.
4. Run `npm run ci` to confirm clean compilation and green tests.
5. Submit your PR with a clear summary of what was changed and why.

---

## 📄 License

By contributing to this repository, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
