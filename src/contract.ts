import { Schema } from "effect"
import { Ipc } from "@opencode/plugin/gui"

/**
 * One Ipc method: the window hands over the selected text, main does the HTTP.
 *
 * Translation runs in the Electron main process for two reasons: the renderer's CSP
 * may not allow `connect-src` to a translator host, and a request from main has no
 * CORS preflight at all.
 */
export const Translate = Ipc.define({
  id: "translate-selection.translate",
  methods: {
    run: {
      input: Schema.Struct({
        text: Schema.String,
        targets: Schema.Array(Schema.String),
      }),
      output: Schema.Struct({
        detected: Schema.String,
        results: Schema.Array(
          Schema.Struct({
            lang: Schema.String,
            text: Schema.String,
            error: Schema.optional(Schema.String),
          }),
        ),
      }),
    },
  },
})

export type TranslateInput = typeof Translate.spec.methods.run.input.Type
export type TranslateOutput = typeof Translate.spec.methods.run.output.Type
