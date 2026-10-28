import { Schema } from "effect"
import { Ipc } from "@opencode/plugin/gui"

/**
 * One Ipc method: the window hands over the selected text, main does the translation
 * either via the current session's LLM or through the multi-tier MT pipeline.
 */
export const Translate = Ipc.define({
  id: "translate-selection.translate",
  methods: {
    run: {
      input: Schema.Struct({
        text: Schema.String,
        targets: Schema.Array(Schema.String),
        sessionID: Schema.optional(Schema.String),
        engineMode: Schema.optional(
          Schema.Union([Schema.Literal("auto"), Schema.Literal("fast"), Schema.Literal("llm")]),
        ),
        llmTimeoutMs: Schema.optional(Schema.Number),
      }),
      output: Schema.Struct({
        detected: Schema.String,
        results: Schema.Array(
          Schema.Struct({
            lang: Schema.String,
            text: Schema.String,
            engineUsed: Schema.optional(Schema.String),
            error: Schema.optional(Schema.String),
          }),
        ),
      }),
    },
  },
})

export type TranslateInput = typeof Translate.spec.methods.run.input.Type
export type TranslateOutput = typeof Translate.spec.methods.run.output.Type
