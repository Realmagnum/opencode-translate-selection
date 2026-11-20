import { createEffect, onCleanup } from "solid-js"
import path from "node:path"
import os from "node:os"
import fs from "node:fs"
import { Plugin, SettingsPage, Slot, Store, Style } from "@opencode/plugin/gui"
import { createMutationGate } from "opencode-plugin-dom"
import type { Persisted, SetupContext } from "@opencode/plugin/gui"
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

/* The switch sits beside the sidebar title controls, styled as a ghost button
   like the Session Timestamps clock. */
.translate-header-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex: none;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--v2-icon-icon-muted, light-dark(#5f5f5f, #8a8a8a));
  cursor: pointer;
  app-region: no-drag;
  -webkit-app-region: no-drag;
  transition: color 120ms ease, background-color 120ms ease, opacity 120ms ease;
}
.translate-header-toggle svg { width: 16px; height: 16px; pointer-events: none; }
.translate-header-toggle:hover,
.translate-header-toggle:focus-visible {
  background: var(--v2-overlay-simple-overlay-hover, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.06)));
  color: var(--v2-text-text-base, light-dark(#1f1f1f, #eeeeee));
}
.translate-header-toggle[data-on="true"] { color: var(--v2-text-text-base, light-dark(#1f1f1f, #eeeeee)); }
.translate-header-toggle[data-on="false"] { color: var(--v2-text-text-faint, light-dark(#6b6b6b, #8a8a8a)); opacity: 0.65; }
`


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

const GLOBE_SVG = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10" cy="10" r="6.6"/><path d="M3.6 10h12.8M10 3.4c1.9 1.8 2.9 4 2.9 6.6s-1 4.8-2.9 6.6c-1.9-1.8-2.9-4-2.9-6.6s1-4.8 2.9-6.6Z"/></svg>`

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

    // The sidebar header has no plugin slot, so the enable switch is this
    // plugin's own button beside the Session Timestamps clock. Nothing the host
    // owns is moved: relocating its TitlebarItem made the host rebuild it under
    // the pointer, and the two fought at the pass rate. The gate wakes only for
    // a batch that can move the button, at most once per interval.
    function setupHeaderSwitch() {
      if (typeof document === "undefined") return

      const HEADER_ANCHOR =
        '[data-ocst-kind="context-toggle"], [data-ocst-kind="toggle"], button[aria-controls="vertical-tabs-sidebar"]'
      let button: HTMLButtonElement | undefined
      let lastToggle = 0

      const enabled = () => ctx.stores.settings.value.enabled ?? true

      const toggleEnabled = () => {
        const now = Date.now()

        if (now - lastToggle < 300) return
        lastToggle = now

        const current = enabled()

        ctx.stores.settings.update((draft) => {
          draft.enabled = !current
          return undefined
        })
        console.info("[translate-selection] enabled", !current)
      }

      const ensure = () => {
        if (button) return button

        button = document.createElement("button")
        button.type = "button"
        button.dataset.translateHeaderToggle = ""
        button.className = "translate-header-toggle"
        button.innerHTML = GLOBE_SVG
        button.addEventListener("click", (event) => {
          event.preventDefault()
          event.stopPropagation()
          toggleEnabled()
        })

        return button
      }

      /** Where the button goes while the header is on screen. */
      const header = () => {
        const ring = document.querySelector<HTMLElement>('[data-ocst-kind="context-toggle"]')
        const clock = document.querySelector<HTMLElement>('[data-ocst-kind="toggle"]')
        const anchor = ring ?? clock

        if (anchor?.parentElement) return { container: anchor.parentElement as HTMLElement, after: anchor }

        const toggle = Array.from(
          document.querySelectorAll<HTMLElement>('button[aria-controls="vertical-tabs-sidebar"]'),
        ).find((element) => !element.closest('[data-slot="collapsed-sidebar-toggle"]'))
        const wrapper = toggle?.parentElement

        if (wrapper?.parentElement) return { container: wrapper.parentElement, before: wrapper }

        return undefined
      }

      const paint = (element: HTMLButtonElement) => {
        const on = enabled()
        const label = ctx.t(on ? "toggle.disable" : "toggle.enable")

        element.dataset.on = on ? "true" : "false"
        element.setAttribute("aria-pressed", on ? "true" : "false")
        element.setAttribute("aria-label", label)

        if (element.title !== label) element.title = label
      }

      /**
       * True when `element` sits before `other` among the same parent's children.
       * A sibling walk, not `compareDocumentPosition`: the header is a handful of
       * children, and the check stays easy to test with a fake DOM.
       */
      const elementPrecedes = (element: Element, other: Element) => {
        if (element === other || element.parentElement !== other.parentElement) return false

        for (let node = element.nextElementSibling; node; node = node.nextElementSibling) {
          if (node === other) return true
        }

        return false
      }

      const place = () => {
        const element = ensure()

        paint(element)

        const slot = header()

        if (!slot) {
          element.remove()

          return
        }

        if (slot.after) {
          // "Somewhere after the anchor" rather than "immediately after it": another
          // plugin may insert its own control in between, and demanding the exact
          // sibling made the two re-insert themselves at the pass rate.
          if (!elementPrecedes(slot.after, element)) slot.after.after(element)
        } else if (element.parentElement !== slot.container || element.nextSibling !== slot.before) {
          slot.container.insertBefore(element, slot.before ?? null)
        }
      }

      // Runs for every batch, so it does no lookup of its own: only a change inside
      // the header, or to the button itself, can move it.
      const relevant = (records: readonly MutationRecord[]) => {
        for (const record of records) {
          if (record.type !== "childList") continue

          const target = record.target

          if (!(target instanceof Element)) continue
          if (target === document.body) return true
          if (target.closest(HEADER_ANCHOR)) return true
          if (button && (target === button || button.contains(target))) return true

          for (const added of record.addedNodes) {
            if (added === button) return true
            if (added instanceof Element && added.querySelector(HEADER_ANCHOR)) return true
          }

          for (const removed of record.removedNodes) {
            if (removed === button) return true
            if (removed instanceof Element && removed.querySelector(HEADER_ANCHOR)) return true
          }
        }

        return false
      }

      const gate = createMutationGate({ run: place, relevant, interval: 250 })

      // The switch follows the setting and the locale, repainting on its own
      // rather than waiting for a DOM batch.
      createEffect(() => {
        ctx.stores.settings.value.enabled
        ctx.locale.locale()
        gate.schedule()
      })

      place()

      onCleanup(() => {
        gate.stop()
        button?.remove()
      })
    }

    setupHeaderSwitch()
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

