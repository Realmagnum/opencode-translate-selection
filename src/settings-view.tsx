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
  rowStyle,
} from "./popup"
import { resolveTranslation, type TranslationParams } from "./i18n"

interface Props {
  settings: () => PluginSettings
  update(patch: Partial<PluginSettings>): void
  reset(): void
  t?: (key: string, params?: TranslationParams) => string
  locale?: () => string
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

  const t = (key: string, params?: TranslationParams): string => {
    if (props.t) {
      const val = props.t(key, params)
      if (val && val !== key) return val
    }
    return resolveTranslation(props.locale?.(), key, params)
  }

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
          {t("settings.header.title")}
        </h2>
        <p style={{ "font-size": "12.5px", color: "var(--text-subdued, #94a3b8)" }}>
          {t("settings.header.desc")}
        </p>
      </div>

      {/* Live Interactive Preview */}
      <div style={{ "margin-bottom": "24px" }}>
        <div style={{ "font-size": "12px", "font-weight": "600", "text-transform": "uppercase", "letter-spacing": "0.05em", color: "var(--text-subdued, #94a3b8)", "margin-bottom": "8px" }}>
          {t("settings.preview.title")}
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
                <span style={buildLangTagStyle(c())}>{t("settings.preview.langTag")}</span>
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
                <div style={{ "font-weight": "600", "margin-bottom": "3px" }}>{t("settings.preview.sampleTitle")}</div>
                <div style={{ display: "flex", gap: "6px", "align-items": "baseline", "padding-left": "2px" }}>
                  <span style={{ color: c().accentColor, "font-size": "11px", "user-select": "none" }}>•</span>
                  <span>
                    {t("settings.preview.sampleBullet")}
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
            <div style={buildMetaStyle(c())}>{t("translate.copy")}</div>
          </div>
        </div>
      </div>

      {/* Quick Theme Presets */}
      <div style={sectionHeader}>{t("settings.presets.title")}</div>
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
              {t(`settings.preset.${preset.id}`)}
            </button>
          )}
        </For>
      </div>

      {/* Translation Engine */}
      <div style={sectionHeader}>{t("settings.engine.title")}</div>
      <div style={cardStyle}>
        <div style={fieldRow}>
          <div style={labelStyle}>
            <span>{t("settings.engine.mode.label")}</span>
            <span style={subLabelStyle}>
              {c().engineMode === "auto" && t("settings.engine.mode.autoDesc")}
              {c().engineMode === "fast" && t("settings.engine.mode.fastDesc")}
              {c().engineMode === "llm" && t("settings.engine.mode.llmDesc")}
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
              {t("settings.engine.mode.auto")}
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
              {t("settings.engine.mode.fast")}
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
              {t("settings.engine.mode.llm")}
            </button>
          </div>
        </div>

        <Show when={c().engineMode !== "fast"}>
          <div style={fieldRow}>
            <div style={labelStyle}>
              <span>{t("settings.engine.timeout.label", { seconds: (c().llmTimeoutMs / 1000).toFixed(1) })}</span>
              <span style={subLabelStyle}>{t("settings.engine.timeout.desc")}</span>
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
      <div style={sectionHeader}>{t("settings.languages.title")}</div>
      <div style={cardStyle}>
        <div style={fieldRow}>
          <div style={labelStyle}>
            <span>{t("settings.languages.targets.label")}</span>
            <span style={subLabelStyle}>{t("settings.languages.targets.desc")}</span>
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
      <div style={sectionHeader}>{t("settings.appearance.title")}</div>
      <div style={cardStyle}>
        {/* Background Color */}
        <div style={fieldRow}>
          <div style={labelStyle}>
            <span>{t("settings.appearance.bgColor.label")}</span>
            <span style={subLabelStyle}>{t("settings.appearance.bgColor.desc")}</span>
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
            <span>{t("settings.appearance.bgOpacity.label", { opacity: c().bgOpacity })}</span>
            <span style={subLabelStyle}>{t("settings.appearance.bgOpacity.desc")}</span>
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
            <span>{t("settings.appearance.textColor.label")}</span>
            <span style={subLabelStyle}>{t("settings.appearance.textColor.desc")}</span>
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
            <span>{t("settings.appearance.accentColor.label")}</span>
            <span style={subLabelStyle}>{t("settings.appearance.accentColor.desc")}</span>
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
      <div style={sectionHeader}>{t("settings.dimensions.title")}</div>
      <div style={cardStyle}>
        {/* Clearance */}
        <div style={fieldRow}>
          <div style={labelStyle}>
            <span>{t("settings.dimensions.clearance.label", { clearance: c().clearance })}</span>
            <span style={subLabelStyle}>{t("settings.dimensions.clearance.desc")}</span>
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
            <span>{t("settings.dimensions.radius.label", { radius: c().borderRadius })}</span>
            <span style={subLabelStyle}>{t("settings.dimensions.radius.desc")}</span>
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
            <span>{t("settings.dimensions.fontSize.label", { size: c().fontSize })}</span>
            <span style={subLabelStyle}>{t("settings.dimensions.fontSize.desc")}</span>
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
            <span>{t("settings.dimensions.maxWidth.label", { width: c().maxWidth })}</span>
            <span style={subLabelStyle}>{t("settings.dimensions.maxWidth.desc")}</span>
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
            <span>{t("settings.dimensions.maxHeight.label", { height: c().maxHeight })}</span>
            <span style={subLabelStyle}>{t("settings.dimensions.maxHeight.desc")}</span>
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
      <div style={sectionHeader}>{t("settings.behavior.title")}</div>
      <div style={cardStyle}>
        {/* Debounce */}
        <div style={fieldRow}>
          <div style={labelStyle}>
            <span>{t("settings.behavior.debounce.label", { delay: c().debounceMs })}</span>
            <span style={subLabelStyle}>{t("settings.behavior.debounce.desc")}</span>
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
            <span>{t("settings.behavior.maxChars.label", { chars: c().maxChars })}</span>
            <span style={subLabelStyle}>{t("settings.behavior.maxChars.desc")}</span>
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

      {/* Terminal (TUI) Keybindings */}
      <div style={sectionHeader}>{t("settings.tui.title")}</div>
      <div style={cardStyle}>
        <div style={{ "font-size": "12px", color: "var(--text-subdued, #94a3b8)", "line-height": "1.4" }}>
          {t("settings.tui.desc")}
        </div>

        {/* Key: Clipboard */}
        <div style={fieldRow}>
          <div style={labelStyle}>
            <span>{t("settings.tui.keyClipboard.label")}</span>
            <span style={subLabelStyle}>{t("settings.tui.keyClipboard.desc")}</span>
          </div>
          <input
            type="text"
            style={{ ...inputStyle, width: "140px", "font-family": "ui-monospace, monospace" }}
            value={c().tuiKeyClipboard || "alt+t"}
            onInput={(e) => props.update({ tuiKeyClipboard: e.currentTarget.value.trim().toLowerCase() })}
          />
        </div>

        {/* Key: Last Turn */}
        <div style={fieldRow}>
          <div style={labelStyle}>
            <span>{t("settings.tui.keyLastTurn.label")}</span>
            <span style={subLabelStyle}>{t("settings.tui.keyLastTurn.desc")}</span>
          </div>
          <input
            type="text"
            style={{ ...inputStyle, width: "140px", "font-family": "ui-monospace, monospace" }}
            value={c().tuiKeyLastTurn || "alt+shift+t"}
            onInput={(e) => props.update({ tuiKeyLastTurn: e.currentTarget.value.trim().toLowerCase() })}
          />
        </div>

        {/* Key: Side Panel */}
        <div style={fieldRow}>
          <div style={labelStyle}>
            <span>{t("settings.tui.keyPanel.label")}</span>
            <span style={subLabelStyle}>{t("settings.tui.keyPanel.desc")}</span>
          </div>
          <input
            type="text"
            style={{ ...inputStyle, width: "140px", "font-family": "ui-monospace, monospace" }}
            value={c().tuiKeyPanel || "alt+p"}
            onInput={(e) => props.update({ tuiKeyPanel: e.currentTarget.value.trim().toLowerCase() })}
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
          {t("settings.reset")}
        </button>
      </div>
    </div>
  )
}
