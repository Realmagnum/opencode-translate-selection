import path from "node:path"
import os from "node:os"
import fs from "node:fs"
import { Plugin, SettingsPage, Slot, Store, Style } from "@opencode/plugin/gui"
import type { Persisted } from "@opencode/plugin/gui"
import { Translate } from "./contract"
import { SelectionPopup } from "./popup"
import { translate } from "./translate"
import { DEFAULT_SETTINGS, SettingsSchema, type PluginSettings, type StoredSettings } from "./settings"
import { SettingsView } from "./settings-view"
import { I18N_CATALOG, getDefaultTargetsForLocale, type TranslationParams } from "./i18n"
import { QUOTE_CONTRAST_CSS } from "./quote-contrast"

function getTuiSettingsPath(): string {
  const home = os.homedir()
  const base = process.env.XDG_STATE_HOME || path.join(home, ".local", "state")
  return path.join(base, "opencode", "latest", "tui", "plugin.translate-selection.tui-settings.json")
}

const PLUGIN_GUI_STYLES = `
/* Distinct highlight for plugin navigation item in Settings sidebar */
.settings-nav-groups [data-slot="tabs-v2-trigger-wrapper"][data-value="translate"] [data-slot="tabs-v2-trigger"] svg {
  color: #9d7cd8 !important;
}

/* Plugin settings gear button in Extensions -> Plugins list */
.plugin-settings-gear-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border-radius: 4px;
  background: transparent;
  border: none;
  color: var(--v2-text-text-muted, #8a8a8a);
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease;
  flex-shrink: 0;
}
.plugin-settings-gear-btn:hover {
  color: #b392f0 !important;
  background-color: var(--v2-background-bg-layer-02, rgba(255, 255, 255, 0.08));
}
.plugin-settings-gear-btn svg {
  width: 16px;
  height: 16px;
}
`

function setupExtensionSettingsGearInjection(pluginId: string, pageId: string) {
  if (typeof document === "undefined") return

  const GEAR_SVG = `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.62516 4.46094L5.05225 3.86719L3.86475 5.05469L4.4585 7.6276L2.0835 9.21094V10.7943L4.4585 12.3776L3.86475 14.9505L5.05225 16.138L7.62516 15.5443L9.2085 17.9193H10.7918L12.3752 15.5443L14.9481 16.138L16.1356 14.9505L15.5418 12.3776L17.9168 10.7943V9.21094L15.5418 7.6276L16.1356 5.05469L14.9481 3.86719L12.3752 4.46094L10.7918 2.08594H9.2085L7.62516 4.46094Z" stroke="currentColor"/><path d="M12.5002 10.0026C12.5002 11.3833 11.3809 12.5026 10.0002 12.5026C8.61945 12.5026 7.50016 11.3833 7.50016 10.0026C7.50016 8.62189 8.61945 7.5026 10.0002 7.5026C11.3809 7.5026 12.5002 8.62189 12.5002 10.0026Z" stroke="currentColor"/></svg>`

  function navigateToSettings() {
    const trigger = document.querySelector(
      `.settings-nav-groups [data-slot="tabs-v2-trigger-wrapper"][data-value="${pageId}"] button, .settings-nav-groups [data-slot="tabs-v2-trigger-wrapper"][data-value="${pageId}"] [data-slot="tabs-v2-trigger"]`
    ) as HTMLElement | null

    if (trigger) {
      trigger.click()
      return
    }

    const url = new URL(window.location.href)
    url.searchParams.set("tab", pageId)
    window.history.pushState({}, "", url.toString())
    window.dispatchEvent(new PopStateEvent("popstate"))
  }

  function injectGearButton() {
    const rows = document.querySelectorAll(".settings-extension-row")
    for (const row of Array.from(rows)) {
      const nameEl = row.querySelector(".settings-extension-name")
      if (!nameEl) continue

      const text = nameEl.textContent?.trim() || ""
      if (text.includes(pluginId)) {
        const actions = row.querySelector(".settings-servers-actions")
        if (actions && !actions.querySelector(`.${pageId}-settings-btn`)) {
          const btn = document.createElement("button")
          btn.type = "button"
          btn.className = `plugin-settings-gear-btn ${pageId}-settings-btn`
          btn.title = "Open settings"
          btn.setAttribute("aria-label", "Open settings")
          btn.innerHTML = GEAR_SVG

          btn.addEventListener("click", (e) => {
            e.preventDefault()
            e.stopPropagation()
            navigateToSettings()
          })

          actions.insertBefore(btn, actions.firstElementChild)
        }
      }
    }
  }

  injectGearButton()
  const observer = new MutationObserver(() => injectGearButton())
  observer.observe(document.body, { childList: true, subtree: true })
}

function TranslationSurface(props: {
  store: Persisted<StoredSettings>
  client: ReturnType<any>
  system: any
  options: any
  t: (key: string, params?: TranslationParams) => string
  toast: any
  currentSessionId?: () => string | undefined
}) {
  const settings = (): PluginSettings => ({ ...DEFAULT_SETTINGS, ...props.store.value })

  return (
    <>
      <style id="opencode-quote-contrast">{QUOTE_CONTRAST_CSS}</style>
      <SelectionPopup
        settings={settings}
      labels={{
        get loading() {
          return props.t("translate.loading")
        },
        get failed() {
          return props.t("translate.failed")
        },
        get truncated() {
          return props.t("translate.truncated")
        },
        get copy() {
          return props.t("translate.copy")
        },
        get copied() {
          return props.t("translate.copied")
        },
      }}
      translate={(input) => props.client.run(input)}
      copy={(text) => void props.system.copy(text)}
      currentSessionId={props.currentSessionId}
      debug={props.options.debug === true ? (message: string) => props.toast.show({ title: message }) : undefined}
    />
  </>
  )
}

function SettingsTab(props: {
  store: Persisted<StoredSettings>
  client: ReturnType<any>
  system: any
  t: (key: string, params?: TranslationParams) => string
  locale?: () => string
}) {
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
    const defaultTargets = getDefaultTargetsForLocale(props.locale?.())
    const defaults: PluginSettings = { ...DEFAULT_SETTINGS, targets: defaultTargets }
    props.store.set(defaults)
    props.client
      .saveTuiSettings({
        keyClipboard: defaults.tuiKeyClipboard,
        keyLastTurn: defaults.tuiKeyLastTurn,
        keyPanel: defaults.tuiKeyPanel,
        targets: defaults.targets,
        engineMode: defaults.engineMode,
      })
      .catch(() => {})
  }

  return (
    <SettingsView
      settings={settings}
      update={update}
      reset={reset}
      t={props.t}
      locale={props.locale}
      openExternal={(url) => {
        if (props.system?.openExternal) {
          props.system.openExternal(url)
        } else {
          window.open(url, "_blank", "noopener,noreferrer")
        }
      }}
    />
  )
}

export default Plugin.define({
  stores: {
    settings: Store.global(SettingsSchema, DEFAULT_SETTINGS),
  },
  i18n: I18N_CATALOG,
  setup(ctx) {
    const client = ctx.main(Translate)

    ctx.add(Style, PLUGIN_GUI_STYLES)

    ctx.add(Slot, {
      at: "window.bottom",
      render: () => (
        <TranslationSurface
          store={ctx.stores.settings}
          client={client}
          system={ctx.system}
          options={ctx.options}
          t={(k, p) => ctx.t(k, p)}
          toast={ctx.toast}
          currentSessionId={() => ctx.sessions.current()?.id}
        />
      ),
    })

    ctx.add(SettingsPage, () => ({
      id: "translate",
      icon: "globe" as const,
      title: ctx.t("settings.title"),
      render: () => (
        <SettingsTab
          store={ctx.stores.settings}
          client={client}
          system={ctx.system}
          t={(k, p) => ctx.t(k, p)}
          locale={() => ctx.locale.locale()}
        />
      ),
    }))

    setupExtensionSettingsGearInjection("translate-selection", "translate")
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
