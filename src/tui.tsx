/** @jsxImportSource @opentui/solid */
import { Show } from "solid-js"
import { Plugin } from "@opencode/plugin/tui"
import type { Context, PanelInput } from "@opencode/plugin/tui/context"
import { readClipboard, writeClipboard } from "./clipboard.ts"
import { translate, type TransOutput } from "./translate.ts"
import { getLastAssistantText, formatTransOutputMarkdown } from "./tui-extract.ts"

const PANEL_NAME = "translate.panel"

export interface TuiSettings {
  targets: string
  engineMode: "auto" | "fast" | "llm"
  llmTimeoutMs: number
  dropSourceLang: boolean
}

export const DEFAULT_TUI_SETTINGS: TuiSettings = {
  targets: "ru, en",
  engineMode: "auto",
  llmTimeoutMs: 3500,
  dropSourceLang: true,
}

export interface LatestTranslationState {
  originalText: string
  source: string
  output: TransOutput | null
  status: "idle" | "translating" | "done" | "error"
  errorMessage?: string
  lastCopied?: boolean
}

/**
 * Solid component rendered inside the session side panel (session.panel slot).
 */
function TranslationPanel(props: {
  panel: PanelInput
  context: Context
  settings: () => TuiSettings
  latest: LatestTranslationState
  onTranslateClipboard: () => void
  onTranslateLast: () => void
  onCycleEngineMode: () => void
  onCopyTranslation: () => void
}) {
  const panel = props.panel
  const ctx = props.context
  const theme = () => ctx.theme

  // Register panel-specific shortcuts active when panel is focused
  ctx.keymap.layer(() => ({
    target: () => null,
    commands: [
      {
        id: "translate.panel.clipboard",
        title: "Translate clipboard",
        bind: "t",
        run: () => props.onTranslateClipboard(),
      },
      {
        id: "translate.panel.last",
        title: "Translate last reply",
        bind: "l",
        run: () => props.onTranslateLast(),
      },
      {
        id: "translate.panel.copy",
        title: "Copy translation",
        bind: "y",
        run: () => props.onCopyTranslation(),
      },
      {
        id: "translate.panel.mode",
        title: "Cycle engine mode",
        bind: "m",
        run: () => props.onCycleEngineMode(),
      },
      {
        id: "translate.panel.fullscreen",
        title: "Toggle fullscreen",
        bind: "f",
        run: panel.toggleFullscreen,
      },
      {
        id: "translate.panel.close",
        title: "Close panel",
        bind: "escape",
        run: panel.close,
      },
      {
        id: "translate.panel.close_q",
        title: "Close panel",
        bind: "q",
        run: panel.close,
      },
    ],
  }))

  const formattedOutput = () => {
    if (!props.latest.output) return ""
    return formatTransOutputMarkdown(props.latest.output, props.latest.originalText)
  }

  const modeBadge = () => props.settings().engineMode.toUpperCase()
  const targetsBadge = () => props.settings().targets

  return (
    <box flexDirection="column" padding={1} width="100%" height="100%">
      {/* Header */}
      <box flexDirection="row" justifyContent="space-between" paddingBottom={1} border={["bottom"]}>
        <text fg="#ffd75e">
          {"🌐 TRANSLATE"}
        </text>
        <text fg="#38bdf8">
          {`[${modeBadge()} | ${targetsBadge()}]`}
        </text>
      </box>

      {/* Status Notifications */}
      <Show when={props.latest.status === "translating"}>
        <box paddingTop={1}>
          <text fg="#facc15">{"⏳ Translating..."}</text>
        </box>
      </Show>

      <Show when={props.latest.status === "error"}>
        <box paddingTop={1}>
          <text fg="#ef4444">{`❌ Error: ${props.latest.errorMessage || "Unknown error"}`}</text>
        </box>
      </Show>

      {/* Scrollable Translation Output */}
      <box flexGrow={1} minHeight={0} paddingTop={1} paddingBottom={1}>
        <scrollbox width="100%" height="100%">
          <Show
            when={props.latest.output && props.latest.output.results.length > 0}
            fallback={
              <box flexDirection="column" gap={1}>
                <text fg={theme().text?.subdued ?? "#94a3b8"}>
                  {"No translation active yet."}
                </text>
                <text fg={theme().text?.subdued ?? "#94a3b8"}>
                  {"Press [t] to translate clipboard or [l] to translate last assistant message."}
                </text>
              </box>
            }
          >
            <box flexDirection="column" gap={1}>
              <Show when={props.latest.source}>
                <text fg="#64748b">{`Source: ${props.latest.source}`}</text>
              </Show>
              <text fg={theme().text?.default ?? "#f8fafc"}>
                {formattedOutput()}
              </text>
            </box>
          </Show>
        </scrollbox>
      </box>

      {/* Footer Hotkey Legend */}
      <box flexDirection="row" paddingTop={1} border={["top"]} justifyContent="space-between">
        <text fg={theme().text?.subdued ?? "#94a3b8"}>
          {"[t] Clip  [l] Last  [y] Copy  [m] Mode  [f] Full  [q] Close"}
        </text>
        <Show when={props.latest.lastCopied}>
          <text fg="#10b981">{"✓ Copied!"}</text>
        </Show>
      </box>
    </box>
  )
}

export default Plugin.define({
  id: "translate-selection",
  setup(context) {
    // Durable settings
    const [settings, updateSettings] = context.storage.store<TuiSettings>("tui-settings", {
      initial: DEFAULT_TUI_SETTINGS,
    })

    // Ephemeral runtime translation state
    const [latest, updateLatest] = context.storage.memory<LatestTranslationState>("tui-latest-trans", {
      initial: {
        originalText: "",
        source: "",
        output: null,
        status: "idle",
      },
    })

    const getTargetsList = (): string[] => {
      return (settings.targets || "ru, en")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    }

    /**
     * Executes translation via the unified MT / LLM engine.
     */
    async function performTranslation(
      text: string,
      sourceDesc: string,
      sessionID?: string,
    ): Promise<TransOutput | null> {
      const clean = text.trim()
      if (!clean) return null

      updateLatest((draft) => {
        draft.originalText = clean
        draft.source = sourceDesc
        draft.status = "translating"
        draft.errorMessage = undefined
        draft.lastCopied = false
      })

      const abortController = new AbortController()

      try {
        const output = await translate(
          {
            text: clean,
            targets: getTargetsList(),
            sessionID,
            engineMode: settings.engineMode,
            llmTimeoutMs: settings.llmTimeoutMs,
            dropSourceLang: settings.dropSourceLang,
          },
          abortController.signal,
          {
            client: context.client,
          },
        )

        updateLatest((draft) => {
          draft.output = output
          draft.status = "done"
        })

        return output
      } catch (err: any) {
        const message = err instanceof Error ? err.message : String(err)
        updateLatest((draft) => {
          draft.status = "error"
          draft.errorMessage = message
        })
        throw err
      }
    }

    /**
     * Copies text to clipboard using both OSC52 and system commands.
     */
    async function copyToClipboard(text: string): Promise<boolean> {
      let osc52Ok = false
      try {
        osc52Ok = (context.renderer as any)?.copyToClipboardOSC52?.(text) === true
      } catch {
        osc52Ok = false
      }

      const sysOk = await writeClipboard(text)
      return osc52Ok || sysOk
    }

    /**
     * Shows translation result in an interactive select dialog.
     */
    async function showTranslationDialog(output: TransOutput, originalText: string) {
      const markdown = formatTransOutputMarkdown(output, originalText)

      const action = await context.ui.dialog.select<"copy" | "open_panel" | "close">({
        title: `🌐 Translation (${output.detected || "auto"} → ${output.results.map((r) => r.lang).join(", ")})`,
        placeholder: "Press Enter / y to copy or p to open panel...",
        options: [
          {
            title: "📋 Copy Translation to Clipboard",
            value: "copy",
            description: "Copies formatted markdown to system clipboard",
          },
          {
            title: "📑 Open in Side Panel",
            value: "open_panel",
            description: "View with persistent scrolling and shortcuts",
          },
          {
            title: "✕ Dismiss",
            value: "close",
          },
        ],
        actions: [
          {
            bind: "y",
            title: "Copy",
            selection: "none",
            onTrigger: async () => {
              await copyToClipboard(markdown)
              context.ui.toast.show({ message: "Translation copied to clipboard", variant: "success" })
              context.ui.dialog.clear()
            },
          },
          {
            bind: "p",
            title: "Panel",
            selection: "none",
            onTrigger: () => {
              context.ui.panel.open(PANEL_NAME)
              context.ui.dialog.clear()
            },
          },
        ],
      })

      if (action === "copy") {
        await copyToClipboard(markdown)
        context.ui.toast.show({ message: "Translation copied to clipboard", variant: "success" })
      } else if (action === "open_panel") {
        context.ui.panel.open(PANEL_NAME)
      }
    }

    /**
     * Action: Translate Clipboard
     */
    async function handleTranslateClipboard(inputArg?: string) {
      let textToTranslate = inputArg?.trim()

      if (!textToTranslate) {
        textToTranslate = (await readClipboard()).trim()
      }

      if (!textToTranslate) {
        const prompted = await context.ui.dialog.prompt({
          title: "🌐 Translate Text",
          placeholder: "Type or paste text to translate...",
        })
        if (!prompted?.trim()) return
        textToTranslate = prompted.trim()
      }

      const currentRoute = context.ui.router.current()
      const sessionID = currentRoute.type === "session" ? currentRoute.sessionID : undefined

      context.ui.toast.show({ message: "Translating clipboard...", duration: 2000 })

      try {
        const output = await performTranslation(textToTranslate, "Clipboard / Input", sessionID)
        if (output) {
          await showTranslationDialog(output, textToTranslate)
        }
      } catch (err: any) {
        context.ui.toast.show({
          title: "Translation Error",
          message: err?.message || "Failed to translate",
          variant: "error",
        })
      }
    }

    /**
     * Action: Translate Last Assistant Turn
     */
    async function handleTranslateLastTurn() {
      const currentRoute = context.ui.router.current()
      if (currentRoute.type !== "session") {
        context.ui.toast.show({
          title: "Translation",
          message: "Open a session first to translate assistant messages",
          variant: "warning",
        })
        return
      }

      const sessionID = currentRoute.sessionID
      context.ui.toast.show({ message: "Fetching last assistant message...", duration: 1500 })

      const text = await getLastAssistantText(context, sessionID)
      if (!text) {
        context.ui.toast.show({
          title: "Translation",
          message: "No assistant message found in current session",
          variant: "warning",
        })
        return
      }

      context.ui.toast.show({ message: "Translating last turn...", duration: 2000 })

      try {
        const output = await performTranslation(text, "Last Assistant Turn", sessionID)
        if (output) {
          await showTranslationDialog(output, text)
        }
      } catch (err: any) {
        context.ui.toast.show({
          title: "Translation Error",
          message: err?.message || "Failed to translate last turn",
          variant: "error",
        })
      }
    }

    /**
     * Action: Cycle Engine Mode
     */
    async function handleCycleEngineMode() {
      const modes: Array<"auto" | "fast" | "llm"> = ["auto", "fast", "llm"]
      const currentIndex = modes.indexOf(settings.engineMode)
      const nextMode = modes[(currentIndex + 1) % modes.length] ?? "auto"

      await updateSettings((draft) => {
        draft.engineMode = nextMode
      })

      context.ui.toast.show({
        title: "Translation Engine",
        message: `Mode: ${nextMode.toUpperCase()}`,
        variant: "info",
      })
    }

    /**
     * Action: Copy current translation to clipboard
     */
    async function handleCopyTranslation() {
      if (!latest.output) {
        context.ui.toast.show({ message: "No translation to copy", variant: "warning" })
        return
      }

      const markdown = formatTransOutputMarkdown(latest.output, latest.originalText)
      const ok = await copyToClipboard(markdown)
      if (ok) {
        updateLatest((draft) => {
          draft.lastCopied = true
        })
        context.ui.toast.show({ message: "✓ Copied to clipboard", variant: "success" })
      }
    }

    /**
     * Action: Configure TUI settings
     */
    async function handleConfig() {
      const picked = await context.ui.dialog.select<"languages" | "engine" | "reset">({
        title: "⚙️ Translation Configuration",
        options: [
          {
            title: `Target Languages: [${settings.targets}]`,
            value: "languages",
            description: "Configure comma-separated target language codes (e.g. ru, en)",
          },
          {
            title: `Engine Mode: [${settings.engineMode.toUpperCase()}]`,
            value: "engine",
            description: "Auto (Smart Hybrid) / Fast MT (Google) / Session LLM",
          },
          {
            title: "Reset to Defaults",
            value: "reset",
            description: "Restore target languages and mode to default",
          },
        ],
      })

      if (picked === "languages") {
        const input = await context.ui.dialog.prompt({
          title: "Target Languages",
          description: "Enter comma-separated ISO language codes (e.g. ru, en, de, zh)",
          value: settings.targets,
        })
        if (input && input.trim()) {
          await updateSettings((draft) => {
            draft.targets = input.trim()
          })
          context.ui.toast.show({ message: `Targets set to: ${input.trim()}`, variant: "success" })
        }
      } else if (picked === "engine") {
        const mode = await context.ui.dialog.select<"auto" | "fast" | "llm">({
          title: "Engine Mode",
          current: settings.engineMode,
          options: [
            {
              title: "Auto (Smart Hybrid)",
              value: "auto",
              description: "Google MT for simple phrases, Session LLM for structured lists & code",
            },
            {
              title: "Fast MT Only",
              value: "fast",
              description: "Google Translate / MyMemory with zero token usage",
            },
            {
              title: "Session LLM Only",
              value: "llm",
              description: "Always translate via current session's active model",
            },
          ],
        })
        if (mode) {
          await updateSettings((draft) => {
            draft.engineMode = mode
          })
          context.ui.toast.show({ message: `Engine mode: ${mode.toUpperCase()}`, variant: "success" })
        }
      } else if (picked === "reset") {
        await updateSettings((draft) => {
          Object.assign(draft, DEFAULT_TUI_SETTINGS)
        })
        context.ui.toast.show({ message: "Settings restored to defaults", variant: "info" })
      }
    }

    // ──────────────────────────── Slots & Global Keymaps ────────────────────────────

    // App-level slot registering global palette and keymap commands
    context.ui.slot({
      append: "app",
      render: () => {
        context.keymap.layer(() => ({
          mode: "global",
          priority: 20,
          commands: [
            {
              id: "translate.clipboard",
              title: "Translate clipboard selection",
              group: "Translation",
              bind: "alt+t",
              palette: true,
              slash: { name: "translate", aliases: ["tr"], arguments: true },
              suggested: true,
              run: async (input) => {
                await handleTranslateClipboard(input)
              },
            },
            {
              id: "translate.last",
              title: "Translate last assistant message",
              group: "Translation",
              bind: "alt+shift+t",
              palette: true,
              slash: { name: "translate-last", aliases: ["trl"] },
              run: async () => {
                await handleTranslateLastTurn()
              },
            },
            {
              id: "translate.panel",
              title: "Toggle translation side panel",
              group: "Translation",
              bind: "alt+p",
              palette: true,
              slash: { name: "translate-panel", aliases: ["trp"] },
              run: () => {
                const current = context.ui.panel.current()
                if (current?.name === PANEL_NAME) {
                  context.ui.panel.close()
                } else {
                  if (!context.ui.panel.open(PANEL_NAME)) {
                    context.ui.toast.show({ message: "Open a session first to view side panel", variant: "warning" })
                  }
                }
              },
            },
            {
              id: "translate.config",
              title: "Translation settings",
              group: "Translation",
              palette: true,
              slash: { name: "translate-config" },
              run: async () => {
                await handleConfig()
              },
            },
          ],
        }))
        return null
      },
    })

    // Session side panel slot
    context.ui.slot({
      append: "session.panel",
      render: (panel) => (
        <Show when={panel.name === PANEL_NAME}>
          <TranslationPanel
            panel={panel}
            context={context}
            settings={() => settings}
            latest={latest}
            onTranslateClipboard={handleTranslateClipboard}
            onTranslateLast={handleTranslateLastTurn}
            onCycleEngineMode={handleCycleEngineMode}
            onCopyTranslation={handleCopyTranslation}
          />
        </Show>
      ),
    })
  },
})
