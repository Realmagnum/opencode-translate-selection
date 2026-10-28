import { Plugin, Slot, usePlugin } from "@opencode/plugin/gui"
import { Translate } from "./contract"
import { SelectionPopup } from "./popup"
import { translate } from "./translate"

const DEFAULT_TARGETS = ["ru", "en"]

function TranslationSurface() {
  const ctx = usePlugin()
  const client = ctx.main(Translate)

  const targets = () => {
    const value = ctx.options.targets
    if (!Array.isArray(value) || value.length === 0) return DEFAULT_TARGETS

    return value.filter((lang): lang is string => typeof lang === "string" && lang.trim().length > 0)
  }

  return (
    <SelectionPopup
      targets={targets()}
      labels={{
        loading: ctx.t("translate.loading"),
        failed: ctx.t("translate.failed"),
        truncated: ctx.t("translate.truncated"),
        copy: ctx.t("translate.copy"),
        copied: ctx.t("translate.copied"),
      }}
      translate={(input) => client.run(input)}
      copy={(text) => void ctx.system.copy(text)}
      debug={ctx.options.debug === true ? (message) => ctx.toast.show({ title: message }) : undefined}
    />
  )
}

export default Plugin.define({
  i18n: {
    en: {
      "translate.loading": "Translating…",
      "translate.failed": "Translation failed",
      "translate.truncated": "selection trimmed to 600 characters",
      "translate.copy": "click a line to copy",
      "translate.copied": "copied",
    },
    ru: {
      "translate.loading": "Перевод…",
      "translate.failed": "Не удалось перевести",
      "translate.truncated": "выделение обрезано до 600 символов",
      "translate.copy": "клик по строке — копировать",
      "translate.copied": "скопировано",
    },
  },
  setup(ctx) {
    ctx.add(Slot, { at: "window.bottom", render: () => <TranslationSurface /> })
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
