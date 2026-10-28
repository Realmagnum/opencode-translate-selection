/**
 * Server half. It carries the plugin's id ("translate-selection") and nothing else:
 * selection translation lives in the GUI half's main process, which is where the
 * HTTP request can run without the renderer's CSP or CORS.
 */
import { Plugin } from "@opencode/plugin"

export default Plugin.define({
  id: "translate-selection",
  setup() {},
})
