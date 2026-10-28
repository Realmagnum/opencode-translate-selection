import { Plugin, SettingsPage, Slot, Store } from "@opencode/plugin/gui"
import type { Persisted } from "@opencode/plugin/gui"
import { Translate } from "./contract"
import { SelectionPopup } from "./popup"
import { translate } from "./translate"
import { DEFAULT_SETTINGS, SettingsSchema, type PluginSettings } from "./settings"
import { SettingsView } from "./settings-view"

function TranslationSurface(props: {
  store: Persisted<PluginSettings>
  client: ReturnType<any>
  system: any
  options: any
  t: (key: string) => string
  toast: any
}) {
  const settings = () => props.store.value ?? DEFAULT_SETTINGS

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
      debug={props.options.debug === true ? (message: string) => props.toast.show({ title: message }) : undefined}
    />
  )
}

function SettingsTab(props: { store: Persisted<PluginSettings> }) {
  const settings = () => props.store.value ?? DEFAULT_SETTINGS

  const update = (patch: Partial<PluginSettings>) => {
    props.store.update((draft) => {
      Object.assign(draft, patch)
      return undefined
    })
  }

  const reset = () => {
    props.store.set(DEFAULT_SETTINGS)
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
        />
      ),
    })

    ctx.add(SettingsPage, {
      id: "translate",
      icon: "globe",
      get title() {
        return ctx.t("settings.title")
      },
      render: () => <SettingsTab store={ctx.stores.settings} />,
    })
  },
  main(ctx) {
    ctx.log.write("info", "translate-selection main ready", { version: ctx.app.version })

    ctx.provide(Translate, {
      run: (input, caller) =>
        translate(input, caller.signal, (level, message, data) =>
          data ? ctx.log.write(level, message, data) : ctx.log.write(level, message),
        ),
    })
  },
})
