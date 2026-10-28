import { For, Show, createSignal, onCleanup, onMount } from "solid-js"
import { Portal } from "solid-js/web"
import type { TranslateOutput } from "./contract"

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
  /** Distance from the viewport bottom, when the popup sits above the selection. */
  bottom?: number
  /** Distance from the viewport top, when there is no room above. */
  top?: number
  results: TranslateOutput["results"]
  detected: string
  loading: boolean
  error?: string
  truncated: boolean
}

/**
 * The built-in quote toolbar sits above a selection of up to three lines, so this
 * popup clears it: 34px of toolbar plus an 8px gap, rounded up.
 */
const QUOTE_CLEARANCE = 52
const MAX_WIDTH = 560
const MAX_CHARS = 600

const POPUP_CLASS = "translate-selection-popup"

const shell = (view: View): Record<string, string> => ({
  position: "fixed",
  left: `${view.left}px`,
  ...(view.bottom !== undefined ? { bottom: `${view.bottom}px` } : { top: `${view.top ?? 0}px` }),
  "z-index": "2147483000",
  "max-width": `${MAX_WIDTH}px`,
  "min-width": "220px",
  padding: "7px 10px 8px",
  "border-radius": "10px",
  border: "1px solid rgba(255, 215, 94, 0.45)",
  background: "rgba(43, 34, 10, 0.97)",
  "box-shadow": "0 14px 34px rgba(0, 0, 0, 0.45)",
  color: "#ffd75e",
  font: "12.5px/1.45 ui-sans-serif, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
  "pointer-events": "auto",
  "user-select": "text",
  cursor: "default",
})

const row: Record<string, string> = {
  display: "flex",
  gap: "8px",
  "align-items": "baseline",
  padding: "2px 2px 3px",
  "border-radius": "6px",
}

const langTag: Record<string, string> = {
  flex: "none",
  "font-size": "10px",
  "font-weight": "600",
  "letter-spacing": "0.09em",
  "text-transform": "uppercase",
  color: "#c9a83f",
  "min-width": "20px",
}

const textStyle: Record<string, string> = {
  color: "#ffd75e",
  "white-space": "pre-wrap",
  "overflow-wrap": "anywhere",
}

const meta: Record<string, string> = {
  "margin-top": "4px",
  "padding-top": "4px",
  border: "none",
  "border-top": "1px solid rgba(255, 215, 94, 0.16)",
  "font-size": "10.5px",
  color: "#a68b3a",
}

function isEditable(node: Node | null): boolean {
  const element = node instanceof Element ? node : node?.parentElement
  if (!element) return false

  return !!element.closest(
    'textarea, input, [contenteditable=""], [contenteditable="true"], [contenteditable="plaintext-only"]',
  )
}

export function SelectionPopup(props: {
  targets: string[]
  labels: Labels
  translate(input: { text: string; targets: readonly string[] }): Promise<TranslateOutput>
  copy(text: string): void
  /** Set with `options.debug` to surface why a selection was skipped. */
  debug?(message: string): void
}) {
  const [view, setView] = createSignal<View | null>(null)
  const [copied, setCopied] = createSignal(false)

  let root: HTMLDivElement | undefined
  let pinned = false
  let sequence = 0
  let controller: AbortController | undefined
  let hideTimer: ReturnType<typeof setTimeout> | undefined
  let readTimer: ReturnType<typeof setTimeout> | undefined

  const hide = () => {
    sequence++
    controller?.abort()
    controller = undefined
    pinned = false
    setCopied(false)
    setView(null)
  }

  const hideSoon = (delay: number) => {
    clearTimeout(hideTimer)
    hideTimer = setTimeout(() => {
      if (pinned) return

      const selection = window.getSelection()
      if (selection && !selection.isCollapsed && selection.toString().trim()) return

      hide()
    }, delay)
  }

  const run = async (text: string, truncated: boolean, place: Omit<View, "results" | "detected" | "loading" | "error" | "text" | "truncated">) => {
    const id = ++sequence
    controller?.abort()
    const local = new AbortController()
    controller = local

    setCopied(false)
    setView({ ...place, text, truncated, results: [], detected: "", loading: true })

    try {
      const output = await props.translate({ text, targets: props.targets })
      if (id !== sequence) return

      props.debug?.(`translate: ${output.detected || "?"} -> ${output.results.map((item) => item.lang).join(",")}`)

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

    const raw = selection.toString().replace(/\s+/g, " ").trim()
    if (raw.length < 2) return

    const rect = selection.getRangeAt(0).getBoundingClientRect()
    if (!rect || (rect.width === 0 && rect.height === 0)) {
      props.debug?.("translate: no rect for selection")
      return
    }

    props.debug?.(`translate: ${raw.length} chars`)

    const truncated = raw.length > MAX_CHARS
    const text = truncated ? raw.slice(0, MAX_CHARS) : raw

    const left = Math.min(Math.max(8, Math.round(rect.left)), Math.max(8, Math.round(window.innerWidth - MAX_WIDTH - 8)))
    const roomAbove = rect.top > QUOTE_CLEARANCE + 190

    const place = roomAbove
      ? { left, bottom: Math.round(window.innerHeight - rect.top + QUOTE_CLEARANCE) }
      : { left, top: Math.round(rect.bottom + 12) }

    pinned = false
    void run(text, truncated, place)
  }

  const onMouseUp = (event: MouseEvent) => {
    if (root && event.target instanceof Node && root.contains(event.target)) return

    clearTimeout(readTimer)
    readTimer = setTimeout(read, 140)
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
    clearTimeout(hideTimer)
    clearTimeout(readTimer)
    controller?.abort()
  })

  const current = () => view()

  return (
    <Show when={current()}>
      {(shown) => (
        <Portal>
          <div
            ref={(element) => (root = element)}
            class={POPUP_CLASS}
            style={shell(shown())}
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
                <div style={{ ...row, color: "#c9a83f" }}>
                  <span style={langTag}>…</span>
                  <span style={textStyle}>{props.labels.loading}</span>
                </div>
              }
            >
              <Show
                when={!shown().error}
                fallback={
                  <div style={{ ...row, color: "#f0a35e" }}>
                    <span style={langTag}>!</span>
                    <span style={{ ...textStyle, color: "#f0a35e" }}>
                      {props.labels.failed}: {shown().error}
                    </span>
                  </div>
                }
              >
                <For each={shown().results}>
                  {(result) => (
                    <div
                      style={row}
                      onMouseDown={() => pinned = true}
                      onClick={() => {
                        if (!result.text) return
                        props.copy(result.text)
                        setCopied(true)
                      }}
                    >
                      <span style={langTag}>{result.lang}</span>
                      <span style={result.error ? { ...textStyle, color: "#f0a35e" } : textStyle}>
                        {result.error ? `${props.labels.failed}: ${result.error}` : result.text}
                      </span>
                    </div>
                  )}
                </For>
              </Show>
            </Show>

            <div style={meta}>
              <Show when={copied()} fallback={props.labels.copy}>
                {props.labels.copied}
              </Show>
              <Show when={shown().truncated}> · {props.labels.truncated}</Show>
            </div>
          </div>
        </Portal>
      )}
    </Show>
  )
}
