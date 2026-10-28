import { Schema } from "effect"

export const SettingsSchema = Schema.Struct({
  targets: Schema.String,
  clearance: Schema.Number,
  bgColor: Schema.String,
  bgOpacity: Schema.Number,
  textColor: Schema.String,
  accentColor: Schema.String,
  borderRadius: Schema.Number,
  fontSize: Schema.Number,
  maxWidth: Schema.Number,
  debounceMs: Schema.Number,
  maxChars: Schema.Number,
  dropSourceLang: Schema.Boolean,
})

export type PluginSettings = typeof SettingsSchema.Type

export const DEFAULT_SETTINGS: PluginSettings = {
  targets: "ru, en",
  clearance: 52,
  bgColor: "#2b220a",
  bgOpacity: 97,
  textColor: "#ffd75e",
  accentColor: "#c9a83f",
  borderRadius: 10,
  fontSize: 12.5,
  maxWidth: 560,
  debounceMs: 140,
  maxChars: 600,
  dropSourceLang: true,
}

export interface Preset {
  id: string
  name: string
  bgColor: string
  bgOpacity: number
  textColor: string
  accentColor: string
}

export const PRESETS: Preset[] = [
  {
    id: "amber",
    name: "Amber Gold",
    bgColor: "#2b220a",
    bgOpacity: 97,
    textColor: "#ffd75e",
    accentColor: "#c9a83f",
  },
  {
    id: "midnight",
    name: "Midnight OLED",
    bgColor: "#090d16",
    bgOpacity: 98,
    textColor: "#6ee7b7",
    accentColor: "#38bdf8",
  },
  {
    id: "monokai",
    name: "Cyberpunk",
    bgColor: "#1a1a1a",
    bgOpacity: 97,
    textColor: "#facc15",
    accentColor: "#a3e635",
  },
  {
    id: "nordic",
    name: "Nordic Slate",
    bgColor: "#242933",
    bgOpacity: 97,
    textColor: "#eceff4",
    accentColor: "#88c0d0",
  },
  {
    id: "light",
    name: "Paper Light",
    bgColor: "#f8fafc",
    bgOpacity: 98,
    textColor: "#0f172a",
    accentColor: "#3b82f6",
  },
]
