import { For, Show } from "solid-js"
import type { PluginSettings } from "./settings"
import { parseLine } from "./formatter.ts"

export function FormattedText(props: { text: string; settings: PluginSettings }) {
  const s = () => props.settings
  const lines = () => props.text.split(/\r?\n/)

  const codeStyle = () => ({
    background: "rgba(255, 215, 94, 0.12)",
    color: s().textColor,
    padding: "1px 5px",
    "border-radius": "4px",
    "font-family": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    "font-size": "0.92em",
    "word-break": "break-all" as const,
  })

  const strongStyle = () => ({
    "font-weight": "600",
    color: s().textColor,
  })

  return (
    <div style={{ display: "flex", "flex-direction": "column", gap: "2px" }}>
      <For each={lines()}>
        {(rawLine) => {
          const info = parseLine(rawLine)

          if (info.type === "empty") {
            return <div style={{ height: "4px" }} />
          }

          if (info.type === "bullet") {
            return (
              <div style={{ display: "flex", gap: "6px", "align-items": "baseline", "padding-left": "2px" }}>
                <span
                  style={{
                    color: s().accentColor,
                    "font-size": "11px",
                    "flex-shrink": 0,
                    "user-select": "none",
                    "line-height": "1",
                  }}
                >
                  •
                </span>
                <div style={{ flex: 1, "word-break": "break-word" }}>
                  <For each={info.inlines}>
                    {(token) => (
                      <Show
                        when={token.type === "code"}
                        fallback={
                          <Show when={token.type === "strong"} fallback={<span>{token.text}</span>}>
                            <strong style={strongStyle()}>{token.text}</strong>
                          </Show>
                        }
                      >
                        <code style={codeStyle()}>{token.text}</code>
                      </Show>
                    )}
                  </For>
                </div>
              </div>
            )
          }

          if (info.type === "ordered") {
            return (
              <div style={{ display: "flex", gap: "6px", "align-items": "baseline", "padding-left": "2px" }}>
                <span
                  style={{
                    color: s().accentColor,
                    "font-size": "10.5px",
                    "font-weight": "600",
                    "flex-shrink": 0,
                    "min-width": "16px",
                    "user-select": "none",
                  }}
                >
                  {info.marker}
                </span>
                <div style={{ flex: 1, "word-break": "break-word" }}>
                  <For each={info.inlines}>
                    {(token) => (
                      <Show
                        when={token.type === "code"}
                        fallback={
                          <Show when={token.type === "strong"} fallback={<span>{token.text}</span>}>
                            <strong style={strongStyle()}>{token.text}</strong>
                          </Show>
                        }
                      >
                        <code style={codeStyle()}>{token.text}</code>
                      </Show>
                    )}
                  </For>
                </div>
              </div>
            )
          }

          return (
            <div style={{ "word-break": "break-word" }}>
              <For each={info.inlines}>
                {(token) => (
                  <Show
                    when={token.type === "code"}
                    fallback={
                      <Show when={token.type === "strong"} fallback={<span>{token.text}</span>}>
                        <strong style={strongStyle()}>{token.text}</strong>
                      </Show>
                    }
                  >
                    <code style={codeStyle()}>{token.text}</code>
                  </Show>
                )}
              </For>
            </div>
          )
        }}
      </For>
    </div>
  )
}
