/** @jsxImportSource @opentui/solid */
import { For, Show, createSignal, onMount } from "solid-js"
import { Plugin } from "@opencode/plugin/tui"
import type { Context, PanelInput } from "@opencode/plugin/tui/context"
import type { ScrollBoxRenderable } from "@opentui/core"
import { readClipboard, writeClipboard } from "./clipboard.ts"
import { translate, type TransOutput } from "./translate.ts"
import { getLastAssistantText, formatTransOutputMarkdown, formatKey } from "./tui-extract.ts"

const PANEL_NAME = "translate.panel"

export interface TuiSettings {
  targets: string
  engineMode: "auto" | "fast" | "llm"
  llmTimeoutMs: number
  dropSourceLang: boolean
  keyClipboard?: string
  keyLastTurn?: string
  keyPanel?: string
}

export const DEFAULT_TUI_SETTINGS: TuiSettings = {
  targets: "ru, en",
  engineMode: "auto",
  llmTimeoutMs: 3500,
  dropSourceLang: true,
  keyClipboard: "alt+t",
  keyLastTurn: "alt+shift+t",
  keyPanel: "alt+p",
}

export { formatKey }

export interface LatestTranslationState {
  originalText: string
  source: string
  output: TransOutput | null
  status: "idle" | "translating" | "done" | "error"
  errorMessage?: string
  lastCopied?: boolean
}

/**
 * Centered modal dialog for displaying full multiline translations with scrolling.
 */
function TranslationModal(props: {
  context: Context
  output: TransOutput
  originalText: string
  onClose: () => void
  onCopy: () => void
  onOpenPanel: () => void
}) {
  const theme = () => props.context.theme
  let scrollRef: ScrollBoxRenderable | undefined
  const [copied, setCopied] = createSignal(false)

  const detected = (props.output.detected || "auto").toUpperCase()
  const targetLangs = props.output.results.map((r) => r.lang.toUpperCase()).join(", ")

  const handleCopy = () => {
    props.onCopy()
    setCopied(true)
  }

  // Keymap active while this modal dialog is open
  props.context.keymap.layer(() => ({
    mode: "modal",
    commands: [
      {
        id: "translate.modal.copy",
        title: "Копировать",
        bind: "y",
        run: () => {
          handleCopy()
        },
      },
      {
        id: "translate.modal.copy_and_close",
        title: "Копировать и закрыть",
        bind: "return",
        run: () => {
          handleCopy()
          props.onClose()
        },
      },
      {
        id: "translate.modal.panel",
        title: "Открыть в боковой панели",
        bind: "p",
        run: () => {
          props.onOpenPanel()
        },
      },
      {
        id: "translate.modal.close",
        title: "Закрыть",
        bind: "escape",
        run: () => {
          props.onClose()
        },
      },
      {
        id: "translate.modal.close_q",
        title: "Закрыть",
        bind: "q",
        run: () => {
          props.onClose()
        },
      },
      {
        id: "translate.modal.down",
        title: "Вниз",
        bind: "down,j",
        run: () => {
          scrollRef?.scrollBy(2)
        },
      },
      {
        id: "translate.modal.up",
        title: "Вверх",
        bind: "up,k",
        run: () => {
          scrollRef?.scrollBy(-2)
        },
      },
      {
        id: "translate.modal.pagedown",
        title: "Страница вниз",
        bind: "pagedown,space",
        run: () => {
          scrollRef?.scrollBy(6)
        },
      },
      {
        id: "translate.modal.pageup",
        title: "Страница вверх",
        bind: "pageup",
        run: () => {
          scrollRef?.scrollBy(-6)
        },
      },
    ],
  }))

  const termHeight = props.context.renderer?.terminalHeight || 30
  const modalHeight = Math.max(10, Math.min(24, Math.floor(termHeight * 0.75)))

  return (
    <box
      flexDirection="column"
      width="100%"
      height={modalHeight}
      paddingLeft={2}
      paddingRight={2}
      paddingBottom={1}
    >
      {/* Header */}
      <box
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        paddingBottom={1}
        border={["bottom"]}
        borderColor={theme().border?.base ?? "#334155"}
      >
        <box flexDirection="row" gap={1} alignItems="center">
          <text fg="#ffd75e">{"🌐 ПЕРЕВОД"}</text>
          <text fg="#38bdf8">{`[${detected} → ${targetLangs}]`}</text>
        </box>
        <text fg={theme().text?.subdued ?? "#94a3b8"}>{"[Esc / q] Закрыть"}</text>
      </box>

      {/* Main Full Scrollable Translation Text */}
      <box flexGrow={1} minHeight={0} paddingTop={1} paddingBottom={1}>
        <scrollbox
          ref={(el: unknown) => {
            scrollRef = el as ScrollBoxRenderable
          }}
          focused={true}
          width="100%"
          height="100%"
        >
          <box flexDirection="column" gap={1}>
            <For each={props.output.results}>
              {(res) => (
                <box flexDirection="column" gap={0} paddingBottom={1}>
                  <box flexDirection="row" gap={1} alignItems="center">
                    <text fg="#38bdf8">{`[${res.lang.toUpperCase()}]`}</text>
                    <Show when={res.engineUsed === "llm"}>
                      <text fg="#a3e635">{"• LLM"}</text>
                    </Show>
                    <Show when={res.error}>
                      <text fg="#ef4444">{`(Ошибка: ${res.error})`}</text>
                    </Show>
                  </box>
                  <text wrapMode="word" fg={theme().text?.default ?? "#f8fafc"}>
                    {res.text || "(пустой перевод)"}
                  </text>
                </box>
              )}
            </For>
          </box>
        </scrollbox>
      </box>

      {/* Footer Controls */}
      <box
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        paddingTop={1}
        border={["top"]}
        borderColor={theme().border?.base ?? "#334155"}
      >
        <box flexDirection="row" flexWrap="wrap" columnGap={1}>
          <text fg={theme().text?.subdued ?? "#94a3b8"}>{"[y] Копия"}</text>
          <text fg={theme().text?.subdued ?? "#94a3b8"}>{"[Enter] Копия+Закрыть"}</text>
          <text fg={theme().text?.subdued ?? "#94a3b8"}>{"[p] В панель"}</text>
          <text fg={theme().text?.subdued ?? "#94a3b8"}>{"[↑/↓] Скролл"}</text>
          <text fg={theme().text?.subdued ?? "#94a3b8"}>{"[q] Закрыть"}</text>
        </box>
        <Show when={copied()}>
          <text fg="#10b981">{"✓ Скопировано!"}</text>
        </Show>
      </box>
    </box>
  )
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
  let scrollRef: ScrollBoxRenderable | undefined

  onMount(() => {
    props.panel.focus()
  })

  // Register panel-specific shortcuts active when panel owns input
  ctx.keymap.layer(() => ({
    commands: [
      {
        id: "translate.panel.clipboard",
        title: "Перевести буфер обмена",
        bind: "t",
        run: () => props.onTranslateClipboard(),
      },
      {
        id: "translate.panel.last",
        title: "Перевести последний ответ",
        bind: "l",
        run: () => props.onTranslateLast(),
      },
      {
        id: "translate.panel.copy",
        title: "Скопировать перевод",
        bind: "y",
        run: () => props.onCopyTranslation(),
      },
      {
        id: "translate.panel.mode",
        title: "Переключить режим движка",
        bind: "m",
        run: () => props.onCycleEngineMode(),
      },
      {
        id: "translate.panel.fullscreen",
        title: "Полноэкранный режим",
        bind: "f",
        run: () => {
          if (panel.width < 108) {
            ctx.ui.toast.show({
              title: "Размер окна",
              message: "Терминал узкий (< 108 колонок), панель уже занимает всё доступное место",
              variant: "info",
              duration: 2500,
            })
            return
          }
          panel.toggleFullscreen()
          const isFull = panel.presentation === "fullscreen"
          ctx.ui.toast.show({
            message: isFull ? "Обычный вид панели" : "Панель на полный экран",
            duration: 1500,
          })
        },
      },
      {
        id: "translate.panel.scroll_down",
        title: "Вниз",
        bind: "down,j",
        run: () => {
          scrollRef?.scrollBy(2)
        },
      },
      {
        id: "translate.panel.scroll_up",
        title: "Вверх",
        bind: "up,k",
        run: () => {
          scrollRef?.scrollBy(-2)
        },
      },
      {
        id: "translate.panel.page_down",
        title: "Страница вниз",
        bind: "pagedown,space",
        run: () => {
          scrollRef?.scrollBy(6)
        },
      },
      {
        id: "translate.panel.page_up",
        title: "Страница вверх",
        bind: "pageup",
        run: () => {
          scrollRef?.scrollBy(-6)
        },
      },
      {
        id: "translate.panel.close",
        title: "Закрыть панель",
        bind: "escape",
        run: panel.close,
      },
      {
        id: "translate.panel.close_q",
        title: "Закрыть панель",
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
    <box
      flexDirection="column"
      padding={1}
      width="100%"
      height="100%"
      onMouseUp={() => props.panel.focus()}
    >
      {/* Header */}
      <box
        flexDirection="column"
        paddingBottom={1}
        border={["bottom"]}
        borderColor={theme().border?.base ?? "#334155"}
        gap={0}
      >
        <box flexDirection="row" justifyContent="space-between" alignItems="center">
          <box flexDirection="row" gap={1} alignItems="center">
            <text fg="#ffd75e">{"🌐"}</text>
            <text fg="#ffd75e">{"ПЕРЕВОД"}</text>
          </box>
          <Show
            when={props.panel.focused}
            fallback={<text fg="#f59e0b">{"(фокус)"}</text>}
          >
            <text fg="#10b981">{"[фокус]"}</text>
          </Show>
        </box>
        <box flexDirection="row" gap={1} paddingTop={0} alignItems="center">
          <text fg="#38bdf8">{`[${modeBadge()} | ${targetsBadge()}]`}</text>
        </box>
      </box>

      {/* Status Notifications */}
      <Show when={props.latest.status === "translating"}>
        <box paddingTop={1}>
          <text fg="#facc15">{"⏳ Перевод в процессе..."}</text>
        </box>
      </Show>

      <Show when={props.latest.status === "error"}>
        <box paddingTop={1}>
          <text fg="#ef4444">{`❌ Ошибка: ${props.latest.errorMessage || "Неизвестная ошибка"}`}</text>
        </box>
      </Show>

      {/* Scrollable Translation Output with Word Wrap */}
      <box flexGrow={1} minHeight={0} paddingTop={1} paddingBottom={1}>
        <scrollbox
          ref={(el: unknown) => {
            scrollRef = el as ScrollBoxRenderable
          }}
          focused={true}
          width="100%"
          height="100%"
        >
          <Show
            when={props.latest.output && props.latest.output.results.length > 0}
            fallback={
              <box flexDirection="column" gap={1}>
                <text fg={theme().text?.subdued ?? "#94a3b8"}>
                  {"Перевод пока не выполнен."}
                </text>
                <text fg={theme().text?.subdued ?? "#94a3b8"}>
                  {"Нажмите [t] для перевода буфера или [l] для перевода ответа ассистента."}
                </text>
              </box>
            }
          >
            <box flexDirection="column" gap={1}>
              <Show when={props.latest.source}>
                <text fg="#64748b">{`Источник: ${props.latest.source}`}</text>
              </Show>
              <For each={props.latest.output!.results}>
                {(res) => (
                  <box flexDirection="column" gap={0} paddingBottom={1}>
                    <box flexDirection="row" gap={1} alignItems="center">
                      <text fg="#38bdf8">{`[${res.lang.toUpperCase()}]`}</text>
                      <Show when={res.engineUsed === "llm"}>
                        <text fg="#a3e635">{"• LLM"}</text>
                      </Show>
                      <Show when={res.error}>
                        <text fg="#ef4444">{`(Ошибка: ${res.error})`}</text>
                      </Show>
                    </box>
                    <text wrapMode="word" fg={theme().text?.default ?? "#f8fafc"}>
                      {res.text || "(пустой перевод)"}
                    </text>
                  </box>
                )}
              </For>
            </box>
          </Show>
        </scrollbox>
      </box>

      {/* Footer Hotkey Legend */}
      <box
        flexDirection="column"
        paddingTop={1}
        border={["top"]}
        borderColor={theme().border?.base ?? "#334155"}
        gap={0}
      >
        <box flexDirection="row" flexWrap="wrap" columnGap={1} rowGap={0}>
          <text fg={theme().text?.subdued ?? "#94a3b8"}>{"[t] Буфер"}</text>
          <text fg={theme().text?.subdued ?? "#94a3b8"}>{"[l] Ответ"}</text>
          <text fg={theme().text?.subdued ?? "#94a3b8"}>{"[y] Копия"}</text>
          <text fg={theme().text?.subdued ?? "#94a3b8"}>{"[m] Режим"}</text>
          <text fg={theme().text?.subdued ?? "#94a3b8"}>{"[f] Экран"}</text>
          <text fg={theme().text?.subdued ?? "#94a3b8"}>{"[q] Выход"}</text>
        </box>
        <Show when={props.latest.lastCopied}>
          <box paddingTop={0}>
            <text fg="#10b981">{"✓ Перевод скопирован в буфер!"}</text>
          </box>
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
     * Shows full translation in a scrollable, multiline modal dialog.
     */
    function showTranslationModal(output: TransOutput, originalText: string) {
      const markdown = formatTransOutputMarkdown(output, originalText)

      context.ui.dialog.set({ size: "large", centered: true })
      context.ui.dialog.show(() => (
        <TranslationModal
          context={context}
          output={output}
          originalText={originalText}
          onClose={() => context.ui.dialog.clear()}
          onCopy={async () => {
            await copyToClipboard(markdown)
            context.ui.toast.show({ message: "✓ Перевод скопирован в буфер", variant: "success" })
          }}
          onOpenPanel={() => {
            context.ui.dialog.clear()
            context.ui.panel.open(PANEL_NAME)
          }}
        />
      ))
    }

    /**
     * Action: Translate Clipboard
     */
    async function handleTranslateClipboard(inputArg?: string) {
      const currentRoute = context.ui.router.current()
      const sessionID = currentRoute.type === "session" ? currentRoute.sessionID : undefined
      const isPanelOpen = context.ui.panel.current()?.name === PANEL_NAME

      let textToTranslate = inputArg?.trim()

      if (!textToTranslate) {
        textToTranslate = (await readClipboard()).trim()
      }

      if (!textToTranslate) {
        if (isPanelOpen) {
          const keyName = formatKey(settings.keyClipboard || "alt+t")
          context.ui.toast.show({
            title: "Перевод",
            message: `Буфер обмена пуст. Скопируйте текст перед нажатием ${keyName}.`,
            variant: "warning",
          })
          return
        }

        const prompted = await context.ui.dialog.prompt({
          title: "🌐 Перевод текста",
          placeholder: "Введите или вставьте текст для перевода...",
        })
        if (!prompted?.trim()) return
        textToTranslate = prompted.trim()
      }

      if (isPanelOpen) {
        context.ui.toast.show({ message: "Перевод...", duration: 1500 })
      } else {
        context.ui.toast.show({ message: "Перевод...", duration: 2000 })
      }

      try {
        const output = await performTranslation(textToTranslate, "Буфер обмена", sessionID)
        if (!output) return

        // Если боковая панель открыта — просто обновляем её без модального окна!
        if (isPanelOpen) {
          context.ui.toast.show({
            message: "✓ Перевод обновлён в панели",
            duration: 1500,
            variant: "success",
          })
          return
        }

        // Если панель закрыта — открываем полноценное скроллируемое модальное окно
        showTranslationModal(output, textToTranslate)
      } catch (err: any) {
        context.ui.toast.show({
          title: "Ошибка перевода",
          message: err?.message || "Не удалось перевести",
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
          title: "Перевод",
          message: "Откройте сессию для перевода ответа ассистента",
          variant: "warning",
        })
        return
      }

      const sessionID = currentRoute.sessionID
      const isPanelOpen = context.ui.panel.current()?.name === PANEL_NAME

      context.ui.toast.show({ message: "Получение ответа ассистента...", duration: 1500 })

      const text = await getLastAssistantText(context, sessionID)
      if (!text) {
        context.ui.toast.show({
          title: "Перевод",
          message: "В текущей сессии нет сообщений ассистента",
          variant: "warning",
        })
        return
      }

      context.ui.toast.show({ message: "Перевод...", duration: 2000 })

      try {
        const output = await performTranslation(text, "Последний ответ ассистента", sessionID)
        if (!output) return

        if (isPanelOpen) {
          context.ui.toast.show({
            message: "✓ Перевод обновлён в панели",
            duration: 1500,
            variant: "success",
          })
          return
        }

        showTranslationModal(output, text)
      } catch (err: any) {
        context.ui.toast.show({
          title: "Ошибка перевода",
          message: err?.message || "Не удалось перевести",
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

      const desc =
        nextMode === "auto"
          ? "AUTO (Google MT для простых фраз, LLM для кода и списков)"
          : nextMode === "fast"
            ? "FAST (Только Google Translate / MyMemory, 0 токенов)"
            : "LLM (Перевод моделью активной сессии)"

      context.ui.toast.show({
        title: "Режим перевода",
        message: desc,
        variant: "info",
        duration: 3000,
      })
    }

    /**
     * Action: Copy current translation to clipboard
     */
    async function handleCopyTranslation() {
      if (!latest.output) {
        context.ui.toast.show({ message: "Нет перевода для копирования", variant: "warning" })
        return
      }

      const markdown = formatTransOutputMarkdown(latest.output, latest.originalText)
      const ok = await copyToClipboard(markdown)
      if (ok) {
        updateLatest((draft) => {
          draft.lastCopied = true
        })
        context.ui.toast.show({ message: "✓ Скопировано в буфер обмена", variant: "success" })
      }
    }

    /**
     * Action: Configure TUI settings
     */
    async function handleConfig() {
      const clipKey = formatKey(settings.keyClipboard || "alt+t")
      const lastKey = formatKey(settings.keyLastTurn || "alt+shift+t")
      const panelKey = formatKey(settings.keyPanel || "alt+p")

      const picked = await context.ui.dialog.select<"languages" | "engine" | "hotkeys" | "reset">({
        title: "⚙️ Настройки перевода (TUI)",
        options: [
          {
            title: `Языки перевода: [${settings.targets}]`,
            value: "languages",
            description: "Коды языков через запятую (например, ru, en или просто ru)",
          },
          {
            title: `Режим движка: [${settings.engineMode.toUpperCase()}]`,
            value: "engine",
            description: "Auto (Smart Hybrid) / Fast MT (Google) / Session LLM",
          },
          {
            title: `Горячие клавиши: [${clipKey}, ${lastKey}, ${panelKey}]`,
            value: "hotkeys",
            description: "Настроить комбинации клавиш (для Ghostty, iTerm2 и других эмуляторов)",
          },
          {
            title: "Сбросить к умолчаниям",
            value: "reset",
            description: "Вернуть целевые языки, режим и хоткеи к стандартным",
          },
        ],
      })

      if (picked === "languages") {
        const input = await context.ui.dialog.prompt({
          title: "Целевые языки",
          description: "Введите ISO-коды языков через запятую (например: ru, en, de, zh)",
          value: settings.targets,
        })
        if (input && input.trim()) {
          await updateSettings((draft) => {
            draft.targets = input.trim()
          })
          context.ui.toast.show({ message: `Целевые языки: ${input.trim()}`, variant: "success" })
        }
      } else if (picked === "engine") {
        const mode = await context.ui.dialog.select<"auto" | "fast" | "llm">({
          title: "Режим движка",
          current: settings.engineMode,
          options: [
            {
              title: "Auto (Smart Hybrid)",
              value: "auto",
              description: "Google MT для простых фраз, Session LLM для списков и кода",
            },
            {
              title: "Fast MT Only",
              value: "fast",
              description: "Google Translate / MyMemory с нулевым расходом токенов",
            },
            {
              title: "Session LLM Only",
              value: "llm",
              description: "Всегда переводить моделью текущей сессии",
            },
          ],
        })
        if (mode) {
          await updateSettings((draft) => {
            draft.engineMode = mode
          })
          context.ui.toast.show({ message: `Режим: ${mode.toUpperCase()}`, variant: "success" })
        }
      } else if (picked === "hotkeys") {
        const keyAction = await context.ui.dialog.select<"clipboard" | "last" | "panel" | "reset_keys">({
          title: "⌨️ Настройка горячих клавиш TUI",
          options: [
            {
              title: `Перевод буфера: [${formatKey(settings.keyClipboard || "alt+t")}]`,
              value: "clipboard",
              description: "Комбинация для перевода выделенного/скопированного текста (по умолч.: alt+t)",
            },
            {
              title: `Перевод ответа ассистента: [${formatKey(settings.keyLastTurn || "alt+shift+t")}]`,
              value: "last",
              description: "Комбинация для перевода последнего ответа модели (по умолч.: alt+shift+t)",
            },
            {
              title: `Боковая панель: [${formatKey(settings.keyPanel || "alt+p")}]`,
              value: "panel",
              description: "Комбинация для открытия/закрытия боковой панели (по умолч.: alt+p)",
            },
            {
              title: "Сбросить хоткеи к умолчаниям",
              value: "reset_keys",
              description: "Вернуть alt+t, alt+shift+t, alt+p",
            },
          ],
        })

        if (keyAction === "clipboard") {
          const val = await context.ui.dialog.prompt({
            title: "Хоткей: Перевод буфера обмена",
            description: "Введите комбинацию клавиш (например: alt+t, alt+y, ctrl+t, alt+c):",
            value: settings.keyClipboard || "alt+t",
          })
          if (val && val.trim()) {
            const cleanKey = val.trim().toLowerCase()
            await updateSettings((draft) => {
              draft.keyClipboard = cleanKey
            })
            context.ui.toast.show({
              message: `Хоткей перевода буфера: ${formatKey(cleanKey)}`,
              variant: "success",
            })
          }
        } else if (keyAction === "last") {
          const val = await context.ui.dialog.prompt({
            title: "Хоткей: Перевод ответа ассистента",
            description: "Введите комбинацию клавиш (например: alt+shift+t, alt+shift+y, ctrl+shift+t):",
            value: settings.keyLastTurn || "alt+shift+t",
          })
          if (val && val.trim()) {
            const cleanKey = val.trim().toLowerCase()
            await updateSettings((draft) => {
              draft.keyLastTurn = cleanKey
            })
            context.ui.toast.show({
              message: `Хоткей последнего ответа: ${formatKey(cleanKey)}`,
              variant: "success",
            })
          }
        } else if (keyAction === "panel") {
          const val = await context.ui.dialog.prompt({
            title: "Хоткей: Боковая панель перевода",
            description: "Введите комбинацию клавиш (например: alt+p, alt+o, ctrl+p):",
            value: settings.keyPanel || "alt+p",
          })
          if (val && val.trim()) {
            const cleanKey = val.trim().toLowerCase()
            await updateSettings((draft) => {
              draft.keyPanel = cleanKey
            })
            context.ui.toast.show({
              message: `Хоткей боковой панели: ${formatKey(cleanKey)}`,
              variant: "success",
            })
          }
        } else if (keyAction === "reset_keys") {
          await updateSettings((draft) => {
            draft.keyClipboard = "alt+t"
            draft.keyLastTurn = "alt+shift+t"
            draft.keyPanel = "alt+p"
          })
          context.ui.toast.show({
            message: "Хоткеи сброшены к Alt+T, Alt+Shift+T, Alt+P",
            variant: "info",
          })
        }
      } else if (picked === "reset") {
        await updateSettings((draft) => {
          Object.assign(draft, DEFAULT_TUI_SETTINGS)
        })
        context.ui.toast.show({ message: "Настройки сброшены", variant: "info" })
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
              bind: settings.keyClipboard || "alt+t",
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
              bind: settings.keyLastTurn || "alt+shift+t",
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
              bind: settings.keyPanel || "alt+p",
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
