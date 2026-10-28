import { For, Show } from "solid-js"
import {
  DEFAULT_SETTINGS,
  PRESETS,
  type EngineMode,
  type PluginSettings,
  type Preset,
} from "./settings"
import {
  buildLangTagStyle,
  buildMetaStyle,
  buildPreviewShellStyle,
  buildTextStyle,
  rowStyle,
} from "./popup"

interface Props {
  settings: () => PluginSettings
  update(patch: Partial<PluginSettings>): void
  reset(): void
}

const sectionHeader: Record<string, string> = {
  "font-size": "14px",
  "font-weight": "600",
  "margin-top": "24px",
  "margin-bottom": "12px",
  color: "var(--text-default, #eceff4)",
  "border-bottom": "1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))",
  "padding-bottom": "6px",
}

const cardStyle: Record<string, string> = {
  background: "var(--background-surface, rgba(255, 255, 255, 0.03))",
  border: "1px solid var(--border-default, rgba(255, 255, 255, 0.08))",
  "border-radius": "8px",
  padding: "16px",
  display: "flex",
  "flex-direction": "column",
  gap: "14px",
}

const fieldRow: Record<string, string> = {
  display: "flex",
  "justify-content": "space-between",
  "align-items": "center",
  gap: "16px",
}

const labelStyle: Record<string, string> = {
  "font-size": "13px",
  color: "var(--text-default, #eceff4)",
  display: "flex",
  "flex-direction": "column",
  gap: "2px",
}

const subLabelStyle: Record<string, string> = {
  "font-size": "11px",
  color: "var(--text-subdued, #94a3b8)",
}

const inputStyle: Record<string, string> = {
  background: "var(--background-input, rgba(0, 0, 0, 0.25))",
  border: "1px solid var(--border-default, rgba(255, 255, 255, 0.15))",
  color: "var(--text-default, #eceff4)",
  "border-radius": "6px",
  padding: "6px 10px",
  "font-size": "13px",
  outline: "none",
}

const buttonStyle: Record<string, string> = {
  background: "var(--background-action-neutral, rgba(255, 255, 255, 0.08))",
  border: "1px solid var(--border-default, rgba(255, 255, 255, 0.15))",
  color: "var(--text-default, #eceff4)",
  "border-radius": "6px",
  padding: "6px 12px",
  "font-size": "12px",
  cursor: "pointer",
  transition: "all 0.15s ease",
}

export function SettingsView(props: Props) {
  const c = () => ({ ...DEFAULT_SETTINGS, ...props.settings() })

  const applyPreset = (preset: Preset) => {
    props.update({
      bgColor: preset.bgColor,
      bgOpacity: preset.bgOpacity,
      textColor: preset.textColor,
      accentColor: preset.accentColor,
    })
  }

  const setEngine = (mode: EngineMode) => {
    props.update({ engineMode: mode })
  }

  return (
    <div style={{ "max-width": "700px", padding: "16px 8px 48px", font: "13px/1.5 system-ui, sans-serif" }}>
      {/* Title & Description */}
      <div style={{ "margin-bottom": "20px" }}>
        <h2 style={{ "font-size": "18px", "font-weight": "600", "margin-bottom": "4px", color: "var(--text-default, #eceff4)" }}>
          Translation Tooltip Settings
        </h2>
        <p style={{ "font-size": "12.5px", color: "var(--text-subdued, #94a3b8)" }}>
          Customize the inline translation popup appearance, target languages, positioning, and behavior.
        </p>
      </div>

      {/* Live Interactive Preview */}
      <div style={{ "margin-bottom": "24px" }}>
        <div style={{ "font-size": "12px", "font-weight": "600", "text-transform": "uppercase", "letter-spacing": "0.05em", color: "var(--text-subdued, #94a3b8)", "margin-bottom": "8px" }}>
          Live Preview
        </div>
        <div
          style={{
            background: "var(--background-canvas, rgba(0, 0, 0, 0.3))",
            border: "1px dashed var(--border-subtle, rgba(255, 255, 255, 0.12))",
            "border-radius": "8px",
            padding: "24px",
            display: "flex",
            "justify-content": "center",
            "align-items": "center",
          }}
        >
          <div style={buildPreviewShellStyle(c())}>
            <div style={rowStyle}>
              <div style={{ display: "flex", "flex-direction": "column", "align-items": "center", gap: "3px" }}>
                <span style={buildLangTagStyle(c())}>RU</span>
                <span
                  style={{
                    "font-size": "8px",
                    "font-weight": "700",
                    padding: "0 3px",
                    "border-radius": "3px",
                    background: "rgba(255, 215, 94, 0.16)",
                    color: c().accentColor,
                    "letter-spacing": "0.05em",
                    "line-height": "1.2",
                  }}
                >
                  LLM
                </span>
              </div>
              <div style={{ flex: 1, "min-width": 0, "font-size": `${c().fontSize}px`, color: c().textColor }}>
                <div style={{ "font-weight": "600", "margin-bottom": "3px" }}>Ключевые особенности:</div>
                <div style={{ display: "flex", gap: "6px", "align-items": "baseline", "padding-left": "2px" }}>
                  <span style={{ color: c().accentColor, "font-size": "11px", "user-select": "none" }}>•</span>
                  <span>
                    Поиск по модели:{" "}
                    <code
                      style={{
                        background: "rgba(255, 215, 94, 0.12)",
                        color: c().textColor,
                        padding: "1px 5px",
                        "border-radius": "4px",
                        "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
                        "font-size": "0.92em",
                      }}
                    >
                      tools.opencode.models()
                    </code>
                  </span>
                </div>
              </div>
            </div>
            <div style={buildMetaStyle(c())}>click a line to copy</div>
          </div>
        </div>
      </div>

      {/* Quick Theme Presets */}
      <div style={sectionHeader}>Theme Presets</div>
      <div style={{ display: "flex", gap: "8px", "flex-wrap": "wrap", "margin-bottom": "16px" }}>
        <For each={PRESETS}>
          {(preset) => (
            <button
              type="button"
              style={{
                ...buttonStyle,
                display: "flex",
                "align-items": "center",
                gap: "6px",
              }}
              onClick={() => applyPreset(preset)}
            >
              <span
                style={{
                  width: "12px",
                  height: "12px",
                  "border-radius": "50%",
                  background: preset.bgColor,
                  border: `2px solid ${preset.accentColor}`,
                  display: "inline-block",
                }}
              />
              {preset.name}
            </button>
          )}
        </For>
      </div>

      {/* Translation Engine */}
      <div style={sectionHeader}>Translation Engine</div>
      <div style={cardStyle}>
        <div style={fieldRow}>
          <div style={labelStyle}>
            <span>Engine Mode</span>
            <span style={subLabelStyle}>
              {c().engineMode === "auto" && "Auto (Smart): Google MT for phrases, Session LLM for lists & code"}
              {c().engineMode === "fast" && "Fast MT Only: Always use Google / MyMemory (fastest, zero LLM usage)"}
              {c().engineMode === "llm" && "Session LLM Only: Always translate using active session's model"}
            </span>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              type="button"
              style={{
                ...buttonStyle,
                background: c().engineMode === "auto" ? "var(--background-action-primary, #2563eb)" : buttonStyle.background,
                color: c().engineMode === "auto" ? "#ffffff" : buttonStyle.color,
                "font-weight": c().engineMode === "auto" ? "600" : "normal",
              }}
              onClick={() => setEngine("auto")}
            >
              Auto (Smart)
            </button>
            <button
              type="button"
              style={{
                ...buttonStyle,
                background: c().engineMode === "fast" ? "var(--background-action-primary, #2563eb)" : buttonStyle.background,
                color: c().engineMode === "fast" ? "#ffffff" : buttonStyle.color,
                "font-weight": c().engineMode === "fast" ? "600" : "normal",
              }}
              onClick={() => setEngine("fast")}
            >
              Fast MT
            </button>
            <button
              type="button"
              style={{
                ...buttonStyle,
                background: c().engineMode === "llm" ? "var(--background-action-primary, #2563eb)" : buttonStyle.background,
                color: c().engineMode === "llm" ? "#ffffff" : buttonStyle.color,
                "font-weight": c().engineMode === "llm" ? "600" : "normal",
              }}
              onClick={() => setEngine("llm")}
            >
              Session LLM
            </button>
          </div>
        </div>

        <Show when={c().engineMode !== "fast"}>
          <div style={fieldRow}>
            <div style={labelStyle}>
              <span>LLM Fallback Timeout ({(c().llmTimeoutMs / 1000).toFixed(1)}s)</span>
              <span style={subLabelStyle}>Maximum wait time before falling back to Google Translate</span>
            </div>
            <input
              type="range"
              min="1500"
              max="8000"
              step="250"
              value={c().llmTimeoutMs}
              onInput={(e) => props.update({ llmTimeoutMs: Number(e.currentTarget.value) })}
            />
          </div>
        </Show>
      </div>

      {/* Languages */}
      <div style={sectionHeader}>Languages</div>
      <div style={cardStyle}>
        <div style={fieldRow}>
          <div style={labelStyle}>
            <span>Target Languages</span>
            <span style={subLabelStyle}>Comma-separated ISO language codes (e.g. ru, en, de, fr, es, zh)</span>
          </div>
          <input
            type="text"
            style={{ ...inputStyle, width: "160px" }}
            value={c().targets}
            onInput={(e) => props.update({ targets: e.currentTarget.value })}
          />
        </div>
      </div>

      {/* Colors & Appearance */}
      <div style={sectionHeader}>Colors & Style</div>
      <div style={cardStyle}>
        {/* Background Color */}
        <div style={fieldRow}>
          <div style={labelStyle}>
            <span>Background Color</span>
            <span style={subLabelStyle}>Base background tone</span>
          </div>
          <div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
            <input
              type="color"
              style={{ cursor: "pointer", width: "32px", height: "32px", border: "none", "border-radius": "4px", background: "none" }}
              value={c().bgColor}
              onInput={(e) => props.update({ bgColor: e.currentTarget.value })}
            />
            <input
              type="text"
              style={{ ...inputStyle, width: "85px" }}
              value={c().bgColor}
              onInput={(e) => props.update({ bgColor: e.currentTarget.value })}
            />
          </div>
        </div>

        {/* Background Opacity */}
        <div style={fieldRow}>
          <div style={labelStyle}>
            <span>Background Opacity ({c().bgOpacity}%)</span>
            <span style={subLabelStyle}>Transparency of the tooltip backdrop</span>
          </div>
          <input
            type="range"
            min="40"
            max="100"
            value={c().bgOpacity}
            onInput={(e) => props.update({ bgOpacity: Number(e.currentTarget.value) })}
          />
        </div>

        {/* Text Color */}
        <div style={fieldRow}>
          <div style={labelStyle}>
            <span>Translation Text Color</span>
            <span style={subLabelStyle}>Main translation text</span>
          </div>
          <div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
            <input
              type="color"
              style={{ cursor: "pointer", width: "32px", height: "32px", border: "none", "border-radius": "4px", background: "none" }}
              value={c().textColor}
              onInput={(e) => props.update({ textColor: e.currentTarget.value })}
            />
            <input
              type="text"
              style={{ ...inputStyle, width: "85px" }}
              value={c().textColor}
              onInput={(e) => props.update({ textColor: e.currentTarget.value })}
            />
          </div>
        </div>

        {/* Accent / Border Color */}
        <div style={fieldRow}>
          <div style={labelStyle}>
            <span>Accent & Badge Color</span>
            <span style={subLabelStyle}>Color for language tag badges and border highlights</span>
          </div>
          <div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
            <input
              type="color"
              style={{ cursor: "pointer", width: "32px", height: "32px", border: "none", "border-radius": "4px", background: "none" }}
              value={c().accentColor}
              onInput={(e) => props.update({ accentColor: e.currentTarget.value })}
            />
            <input
              type="text"
              style={{ ...inputStyle, width: "85px" }}
              value={c().accentColor}
              onInput={(e) => props.update({ accentColor: e.currentTarget.value })}
            />
          </div>
        </div>
      </div>

      {/* Geometry & Position */}
      <div style={sectionHeader}>Position & Dimensions</div>
      <div style={cardStyle}>
        {/* Clearance */}
        <div style={fieldRow}>
          <div style={labelStyle}>
            <span>Quote Clearance ({c().clearance}px)</span>
            <span style={subLabelStyle}>Height offset above the native Quote toolbar</span>
          </div>
          <input
            type="range"
            min="20"
            max="100"
            value={c().clearance}
            onInput={(e) => props.update({ clearance: Number(e.currentTarget.value) })}
          />
        </div>

        {/* Border Radius */}
        <div style={fieldRow}>
          <div style={labelStyle}>
            <span>Corner Radius ({c().borderRadius}px)</span>
            <span style={subLabelStyle}>Roundness of the popup corners</span>
          </div>
          <input
            type="range"
            min="0"
            max="24"
            value={c().borderRadius}
            onInput={(e) => props.update({ borderRadius: Number(e.currentTarget.value) })}
          />
        </div>

        {/* Font Size */}
        <div style={fieldRow}>
          <div style={labelStyle}>
            <span>Font Size ({c().fontSize}px)</span>
            <span style={subLabelStyle}>Size of the translation text</span>
          </div>
          <input
            type="range"
            min="10"
            max="18"
            step="0.5"
            value={c().fontSize}
            onInput={(e) => props.update({ fontSize: Number(e.currentTarget.value) })}
          />
        </div>

        {/* Max Width */}
        <div style={fieldRow}>
          <div style={labelStyle}>
            <span>Maximum Width ({c().maxWidth}px)</span>
            <span style={subLabelStyle}>Maximum width before text wraps</span>
          </div>
          <input
            type="range"
            min="300"
            max="800"
            step="20"
            value={c().maxWidth}
            onInput={(e) => props.update({ maxWidth: Number(e.currentTarget.value) })}
          />
        </div>

        {/* Max Height */}
        <div style={fieldRow}>
          <div style={labelStyle}>
            <span>Maximum Height ({c().maxHeight}px)</span>
            <span style={subLabelStyle}>Maximum height before scrollbar appears for multi-line lists</span>
          </div>
          <input
            type="range"
            min="200"
            max="700"
            step="20"
            value={c().maxHeight}
            onInput={(e) => props.update({ maxHeight: Number(e.currentTarget.value) })}
          />
        </div>
      </div>

      {/* Behavior */}
      <div style={sectionHeader}>Behavior</div>
      <div style={cardStyle}>
        {/* Debounce */}
        <div style={fieldRow}>
          <div style={labelStyle}>
            <span>Selection Delay ({c().debounceMs}ms)</span>
            <span style={subLabelStyle}>Delay after releasing mouse before requesting translation</span>
          </div>
          <input
            type="range"
            min="60"
            max="400"
            step="20"
            value={c().debounceMs}
            onInput={(e) => props.update({ debounceMs: Number(e.currentTarget.value) })}
          />
        </div>

        {/* Max Characters */}
        <div style={fieldRow}>
          <div style={labelStyle}>
            <span>Maximum Characters ({c().maxChars})</span>
            <span style={subLabelStyle}>Selections longer than this will be trimmed</span>
          </div>
          <input
            type="range"
            min="200"
            max="2500"
            step="50"
            value={c().maxChars}
            onInput={(e) => props.update({ maxChars: Number(e.currentTarget.value) })}
          />
        </div>
      </div>

      {/* Reset */}
      <div style={{ "margin-top": "24px", display: "flex", "justify-content": "flex-end" }}>
        <button
          type="button"
          style={{ ...buttonStyle, color: "#f87171" }}
          onClick={props.reset}
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  )
}
