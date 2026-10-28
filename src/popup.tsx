import { For, Show, createSignal, onCleanup, onMount } from "solid-js"
import { Portal } from "solid-js/web"
import type { TranslateOutput } from "./contract"
import type { PluginSettings } from "./settings"
import { FormattedText } from "./formatter-view"

export interface Labels {
  loading: string
  failed: string
  truncated: string
  copy: string
  copied: string
}

interface View {
  text: string
  left: number
  bottom?: number
  top?: number
  results: TranslateOutput["results"]
  detected: string
  loading: boolean
  error?: string
  truncated: boolean
}

const POPUP_CLASS = "translate-selection-popup"

function hexToRgba(hex: string, alpha: number): string {
  let c = hex.replace("#", "").trim()
  if (c.length === 3) c = c.split("").map((x) => x + x).join("")
  const num = parseInt(c, 16)
  if (isNaN(num)) return hex
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function buildShellStyle(view: View | { left: number; top?: number; bottom?: number }, settings: PluginSettings): Record<string, string> {
  const bg = hexToRgba(settings.bgColor, settings.bgOpacity / 100)
  const border = hexToRgba(settings.accentColor, 0.45)
  return {
    position: "fixed",
    left: `${view.left}px`,
    ...(view.bottom !== undefined ? { bottom: `${view.bottom}px` } : { top: `${view.top ?? 0}px` }),
    "z-index": "2147483000",
    "max-width": `${settings.maxWidth}px`,
    "max-height": `${settings.maxHeight || 420}px`,
    "overflow-y": "auto",
    "box-sizing": "border-box",
    "min-width": "220px",
    padding: "7px 10px 8px",
    "border-radius": `${settings.borderRadius}px`,
    border: `1px solid ${border}`,
    background: bg,
    "box-shadow": "0 14px 34px rgba(0, 0, 0, 0.45)",
    color: settings.textColor,
    font: `${settings.fontSize}px/1.45 ui-sans-serif, -apple-system, BlinkMacSystemFont, system-ui, sans-serif`,
    "pointer-events": "auto",
    "user-select": "text",
    cursor: "default",
  }
}

export function buildPreviewShellStyle(settings: PluginSettings): Record<string, string> {
  const bg = hexToRgba(settings.bgColor, settings.bgOpacity / 100)
  const border = hexToRgba(settings.accentColor, 0.45)
  return {
    position: "relative",
    width: "100%",
    "max-width": `${settings.maxWidth}px`,
    "max-height": `${settings.maxHeight || 420}px`,
    "overflow-y": "auto",
    "box-sizing": "border-box",
    "min-width": "220px",
    padding: "7px 10px 8px",
    "border-radius": `${settings.borderRadius}px`,
    border: `1px solid ${border}`,
    background: bg,
    "box-shadow": "0 14px 34px rgba(0, 0, 0, 0.45)",
    color: settings.textColor,
    font: `${settings.fontSize}px/1.45 ui-sans-serif, -apple-system, BlinkMacSystemFont, system-ui, sans-serif`,
    "pointer-events": "auto",
    "user-select": "text",
    cursor: "default",
  }
}

export const rowStyle: Record<string, string> = {
  display: "flex",
  gap: "8px",
  "align-items": "baseline",
  padding: "2px 2px 3px",
  "border-radius": "6px",
  cursor: "pointer",
}

export function buildLangTagStyle(settings: PluginSettings): Record<string, string> {
  return {
    flex: "none",
    "font-size": `${Math.max(9, settings.fontSize - 2.5)}px`,
    "font-weight": "600",
    "letter-spacing": "0.09em",
    "text-transform": "uppercase",
    color: settings.accentColor,
    "min-width": "20px",
  }
}

export function buildTextStyle(settings: PluginSettings): Record<string, string> {
  return {
    color: settings.textColor,
    "white-space": "pre-wrap",
    "overflow-wrap": "anywhere",
  }
}

export function buildMetaStyle(settings: PluginSettings): Record<string, string> {
  return {
    "margin-top": "4px",
    "padding-top": "4px",
    border: "none",
    "border-top": `1px solid ${hexToRgba(settings.accentColor, 0.16)}`,
    "font-size": `${Math.max(9.5, settings.fontSize - 2)}px`,
    color: hexToRgba(settings.accentColor, 0.8),
  }
}

function isEditable(node: Node | null): boolean {
  const element = node instanceof Element ? node : node?.parentElement
  if (!element) return false

  return !!element.closest(
    'textarea, input, [contenteditable=""], [contenteditable="true"], [contenteditable="plaintext-only"]',
  )
}

export function SelectionPopup(props: {
  settings: () => PluginSettings
  labels: Labels
  translate(input: {
    text: string
    targets: readonly string[]
    sessionID?: string
    engineMode?: "auto" | "fast" | "llm"
    llmTimeoutMs?: number
  }): Promise<TranslateOutput>
  copy(text: string): void
  currentSessionId?(): string | undefined
  debug?(message: string): void
}) {
  const [view, setView] = createSignal<View | null>(null)
  const [copied, setCopied] = createSignal(false)

  let root: HTMLDivElement | undefined
  let pinned = false
  let sequence = 0
  let controller: AbortController | undefined
  let readTimer: ReturnType<typeof setTimeout> | undefined

  const cfg = () => props.settings()

  const hide = () => {
    sequence++
    controller?.abort()
    controller = undefined
    pinned = false
    setCopied(false)
    setView(null)
  }

  const run = async (
    text: string,
    truncated: boolean,
    place: Omit<View, "results" | "detected" | "loading" | "error" | "text" | "truncated">,
  ) => {
    const id = ++sequence
    controller?.abort()
    const local = new AbortController()
    controller = local

    setCopied(false)
    setView({ ...place, text, truncated, results: [], detected: "", loading: true })

    const currentCfg = cfg()
    const targets = currentCfg.targets
      .split(/[,;\s]+/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)

    try {
      const output = await props.translate({
        text,
        targets: targets.length > 0 ? targets : ["ru", "en"],
        sessionID: props.currentSessionId?.(),
        engineMode: currentCfg.engineMode,
        llmTimeoutMs: currentCfg.llmTimeoutMs,
      })
      if (id !== sequence) return

      props.debug?.(
        `translate: ${output.detected || "?"} -> ${output.results.map((item) => `${item.lang}(${item.engineUsed || "mt"})`).join(",")}`,
      )

      setView({
        ...place,
        text,
        truncated,
        results: output.results,
        detected: output.detected,
        loading: false,
        error: output.results.length === 0 ? props.labels.failed : undefined,
      })
    } catch (error) {
      if (id !== sequence) return

      setView({
        ...place,
        text,
        truncated,
        results: [],
        detected: "",
        loading: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const read = () => {
    const currentCfg = cfg()
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      props.debug?.("translate: no selection")
      return
    }

    if (root && selection.anchorNode && root.contains(selection.anchorNode)) return
    if (isEditable(selection.anchorNode)) {
      props.debug?.("translate: selection inside an editable field")
      return
    }

    // Preserve newlines so structured lists, bullets, and blocks retain formatting!
    const raw = selection
      .toString()
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .trim()
    if (raw.length < 2) return

    const rect = selection.getRangeAt(0).getBoundingClientRect()
    if (!rect || (rect.width === 0 && rect.height === 0)) {
      props.debug?.("translate: no rect for selection")
      return
    }

    props.debug?.(`translate: ${raw.length} chars`)

    const maxChars = currentCfg.maxChars
    const truncated = raw.length > maxChars
    const text = truncated ? raw.slice(0, maxChars) : raw

    const left = Math.min(
      Math.max(8, Math.round(rect.left)),
      Math.max(8, Math.round(window.innerWidth - currentCfg.maxWidth - 8)),
    )
    const roomAbove = rect.top > currentCfg.clearance + 190

    const place = roomAbove
      ? { left, bottom: Math.round(window.innerHeight - rect.top + currentCfg.clearance) }
      : { left, top: Math.round(rect.bottom + 12) }

    pinned = false
    void run(text, truncated, place)
  }

  const onMouseUp = (event: MouseEvent) => {
    if (root && event.target instanceof Node && root.contains(event.target)) return

    clearTimeout(readTimer)
    readTimer = setTimeout(read, cfg().debounceMs)
  }

  const onMouseDown = (event: MouseEvent) => {
    const target = event.target
    if (root && target instanceof Node && root.contains(target)) return

    hide()
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape") return
    if (!view()) return

    hide()
  }

  const onScrollOrResize = () => {
    if (view()) hide()
  }

  onMount(() => {
    document.addEventListener("mouseup", onMouseUp, true)
    document.addEventListener("mousedown", onMouseDown, true)
    document.addEventListener("keydown", onKeyDown, true)
    window.addEventListener("scroll", onScrollOrResize, true)
    window.addEventListener("resize", onScrollOrResize, true)
  })

  onCleanup(() => {
    document.removeEventListener("mouseup", onMouseUp, true)
    document.removeEventListener("mousedown", onMouseDown, true)
    document.removeEventListener("keydown", onKeyDown, true)
    window.removeEventListener("scroll", onScrollOrResize, true)
    window.removeEventListener("resize", onScrollOrResize, true)
    clearTimeout(readTimer)
    controller?.abort()
  })

  return (
    <Show when={view()}>
      {(shown) => {
        const c = cfg()
        return (
          <Portal>
            <div
              ref={(element) => (root = element)}
              class={POPUP_CLASS}
              style={buildShellStyle(shown(), c)}
              onMouseDown={(event) => {
                pinned = true
                event.stopPropagation()
              }}
              onMouseEnter={() => (pinned = true)}
              onMouseLeave={() => (pinned = false)}
            >
              <Show
                when={!shown().loading}
                fallback={
                  <div style={{ ...rowStyle, color: c.accentColor }}>
                    <span style={buildLangTagStyle(c)}>…</span>
                    <span style={buildTextStyle(c)}>{props.labels.loading}</span>
                  </div>
                }
              >
                <Show
                  when={!shown().error}
                  fallback={
                    <div style={{ ...rowStyle, color: "#f0a35e" }}>
                      <span style={buildLangTagStyle(c)}>!</span>
                      <span style={{ ...buildTextStyle(c), color: "#f0a35e" }}>
                        {props.labels.failed}: {shown().error}
                      </span>
                    </div>
                  }
                >
                  <For each={shown().results}>
                    {(result) => (
                      <div
                        style={rowStyle}
                        onMouseDown={() => (pinned = true)}
                        onClick={() => {
                          if (!result.text) return
                          props.copy(result.text)
                          setCopied(true)
                        }}
                      >
                        <div style={{ display: "flex", "flex-direction": "column", "align-items": "center", gap: "3px" }}>
                          <span style={buildLangTagStyle(c)}>{result.lang}</span>
                          <Show when={result.engineUsed === "llm"}>
                            <span
                              style={{
                                "font-size": "8px",
                                "font-weight": "700",
                                padding: "0 3px",
                                "border-radius": "3px",
                                background: "rgba(255, 215, 94, 0.16)",
                                color: c.accentColor,
                                "letter-spacing": "0.05em",
                                "line-height": "1.2",
                              }}
                            >
                              LLM
                            </span>
                          </Show>
                        </div>
                        <div style={{ flex: 1, "min-width": 0 }}>
                          <Show
                            when={!result.error}
                            fallback={
                              <span style={{ ...buildTextStyle(c), color: "#f0a35e" }}>
                                {props.labels.failed}: {result.error}
                              </span>
                            }
                          >
                            <FormattedText text={result.text} settings={c} />
                          </Show>
                        </div>
                      </div>
                    )}
                  </For>
                </Show>
              </Show>

              <div style={buildMetaStyle(c)}>
                <Show when={copied()} fallback={props.labels.copy}>
                  {props.labels.copied}
                </Show>
                <Show when={shown().truncated}> · {props.labels.truncated}</Show>
              </div>
            </div>
          </Portal>
        )
      }}
    </Show>
  )
}
