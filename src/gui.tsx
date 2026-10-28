import path from "node:path"
import os from "node:os"
import fs from "node:fs"
import { Plugin, SettingsPage, Slot, Store } from "@opencode/plugin/gui"
import type { Persisted } from "@opencode/plugin/gui"
import { Translate } from "./contract"
import { SelectionPopup } from "./popup"
import { translate } from "./translate"
import { DEFAULT_SETTINGS, SettingsSchema, type PluginSettings, type StoredSettings } from "./settings"
import { SettingsView } from "./settings-view"

function getTuiSettingsPath(): string {
  const home = os.homedir()
  const base = process.env.XDG_STATE_HOME || path.join(home, ".local", "state")
  return path.join(base, "opencode", "latest", "tui", "plugin.translate-selection.tui-settings.json")
}

function TranslationSurface(props: {
  store: Persisted<StoredSettings>
  client: ReturnType<any>
  system: any
  options: any
  t: (key: string) => string
  toast: any
  currentSessionId?: () => string | undefined
}) {
  const settings = (): PluginSettings => ({ ...DEFAULT_SETTINGS, ...props.store.value })

  return (
    <SelectionPopup
      settings={settings}
      labels={{
        loading: props.t("translate.loading"),
        failed: props.t("translate.failed"),
        truncated: props.t("translate.truncated"),
        copy: props.t("translate.copy"),
        copied: props.t("translate.copied"),
      }}
      translate={(input) => props.client.run(input)}
      copy={(text) => void props.system.copy(text)}
      currentSessionId={props.currentSessionId}
      debug={props.options.debug === true ? (message: string) => props.toast.show({ title: message }) : undefined}
    />
  )
}

function SettingsTab(props: { store: Persisted<StoredSettings>; client: ReturnType<any> }) {
  const settings = (): PluginSettings => ({ ...DEFAULT_SETTINGS, ...props.store.value })

  // Synchronize on mount if TUI settings exist
  props.client
    .getTuiSettings({})
    .then((res: any) => {
      if (res) {
        props.store.update((draft) => {
          if (res.keyClipboard && !draft.tuiKeyClipboard) draft.tuiKeyClipboard = res.keyClipboard
          if (res.keyLastTurn && !draft.tuiKeyLastTurn) draft.tuiKeyLastTurn = res.keyLastTurn
          if (res.keyPanel && !draft.tuiKeyPanel) draft.tuiKeyPanel = res.keyPanel
          return undefined
        })
      }
    })
    .catch(() => {})

  const update = (patch: Partial<PluginSettings>) => {
    props.store.update((draft) => {
      Object.assign(draft, patch)
      return undefined
    })

    // Sync TUI keybindings and target settings to TUI storage file
    if (
      patch.tuiKeyClipboard !== undefined ||
      patch.tuiKeyLastTurn !== undefined ||
      patch.tuiKeyPanel !== undefined ||
      patch.targets !== undefined ||
      patch.engineMode !== undefined
    ) {
      props.client
        .saveTuiSettings({
          keyClipboard: patch.tuiKeyClipboard ?? settings().tuiKeyClipboard,
          keyLastTurn: patch.tuiKeyLastTurn ?? settings().tuiKeyLastTurn,
          keyPanel: patch.tuiKeyPanel ?? settings().tuiKeyPanel,
          targets: patch.targets ?? settings().targets,
          engineMode: patch.engineMode ?? settings().engineMode,
        })
        .catch(() => {})
    }
  }

  const reset = () => {
    props.store.set(DEFAULT_SETTINGS)
    props.client
      .saveTuiSettings({
        keyClipboard: DEFAULT_SETTINGS.tuiKeyClipboard,
        keyLastTurn: DEFAULT_SETTINGS.tuiKeyLastTurn,
        keyPanel: DEFAULT_SETTINGS.tuiKeyPanel,
        targets: DEFAULT_SETTINGS.targets,
        engineMode: DEFAULT_SETTINGS.engineMode,
      })
      .catch(() => {})
  }

  return <SettingsView settings={settings} update={update} reset={reset} />
}

export default Plugin.define({
  stores: {
    settings: Store.global(SettingsSchema, DEFAULT_SETTINGS),
  },
  i18n: {
    en: {
      "translate.loading": "Translating…",
      "translate.failed": "Translation failed",
      "translate.truncated": "selection trimmed",
      "translate.copy": "click a line to copy",
      "translate.copied": "copied",
      "settings.title": "Translation",
    },
    ru: {
      "translate.loading": "Перевод…",
      "translate.failed": "Не удалось перевести",
      "translate.truncated": "выделение обрезано",
      "translate.copy": "клик по строке — копировать",
      "translate.copied": "скопировано",
      "settings.title": "Переводчик",
    },
  },
  setup(ctx) {
    const client = ctx.main(Translate)

    ctx.add(Slot, {
      at: "window.bottom",
      render: () => (
        <TranslationSurface
          store={ctx.stores.settings}
          client={client}
          system={ctx.system}
          options={ctx.options}
          t={(k) => ctx.t(k)}
          toast={ctx.toast}
          currentSessionId={() => ctx.sessions.current()?.id}
        />
      ),
    })

    ctx.add(SettingsPage, {
      id: "translate",
      icon: "globe",
      get title() {
        return ctx.t("settings.title")
      },
      render: () => <SettingsTab store={ctx.stores.settings} client={client} />,
    })
  },
  main(ctx) {
    ctx.log.write("info", "translate-selection main ready", { version: ctx.app.version })

    ctx.provide(Translate, {
      run: (input, caller) =>
        translate(input, caller.signal, {
          client: ctx.client,
          log: (level, message, data) =>
            data ? ctx.log.write(level, message, data) : ctx.log.write(level, message),
        }),

      getTuiSettings: async () => {
        try {
          const filePath = getTuiSettingsPath()
          if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, "utf-8")
            return JSON.parse(raw)
          }
        } catch {}
        return {}
      },

      saveTuiSettings: async (patch) => {
        try {
          const filePath = getTuiSettingsPath()
          const dir = path.dirname(filePath)
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
          }

          let current: Record<string, any> = {}
          if (fs.existsSync(filePath)) {
            try {
              current = JSON.parse(fs.readFileSync(filePath, "utf-8"))
            } catch {}
          }

          const merged = { ...current, ...patch }
          fs.writeFileSync(filePath, JSON.stringify(merged, null, 2), "utf-8")
          return { success: true }
        } catch {
          return { success: false }
        }
      },
    })
  },
})
