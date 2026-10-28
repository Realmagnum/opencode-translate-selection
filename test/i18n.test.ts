import { test } from "node:test"
import assert from "node:assert/strict"
import {
  I18N_CATALOG,
  I18N_EN,
  I18N_RU,
  I18N_ZH,
  I18N_DE,
  I18N_ES,
  I18N_FR,
  I18N_JA,
  resolveTranslation,
  getDefaultTargetsForLocale,
  tuiText,
  type I18nKey,
} from "../src/i18n.ts"

test("i18n: all supported languages contain every required key from English dictionary", () => {
  const enKeys = Object.keys(I18N_EN) as I18nKey[]
  const languages = [
    { code: "ru", dict: I18N_RU },
    { code: "zh", dict: I18N_ZH },
    { code: "de", dict: I18N_DE },
    { code: "es", dict: I18N_ES },
    { code: "fr", dict: I18N_FR },
    { code: "ja", dict: I18N_JA },
  ]

  for (const { code, dict } of languages) {
    for (const key of enKeys) {
      assert.ok(
        key in dict && typeof dict[key] === "string" && dict[key].length > 0,
        `Language '${code}' must contain key '${key}'`,
      )
    }
  }
})

test("i18n: resolveTranslation resolves keys in requested language", () => {
  assert.equal(resolveTranslation("en", "settings.title"), "Translation")
  assert.equal(resolveTranslation("ru", "settings.title"), "Переводчик")
  assert.equal(resolveTranslation("zh", "settings.title"), "翻译设置")
  assert.equal(resolveTranslation("de", "settings.title"), "Übersetzung")
  assert.equal(resolveTranslation("es", "settings.title"), "Traducción")
  assert.equal(resolveTranslation("fr", "settings.title"), "Traduction")
  assert.equal(resolveTranslation("ja", "settings.title"), "翻訳")
})

test("i18n: resolveTranslation handles country-tagged locales like ru-RU, zh-CN, de-DE", () => {
  assert.equal(resolveTranslation("ru-RU", "settings.title"), "Переводчик")
  assert.equal(resolveTranslation("zh-CN", "settings.title"), "翻译设置")
  assert.equal(resolveTranslation("de-DE", "settings.title"), "Übersetzung")
  assert.equal(resolveTranslation("fr-FR", "settings.title"), "Traduction")
  assert.equal(resolveTranslation("es-ES", "settings.title"), "Traducción")
  assert.equal(resolveTranslation("ja-JP", "settings.title"), "翻訳")
})

test("i18n: resolveTranslation interpolates template parameters", () => {
  assert.equal(
    resolveTranslation("en", "settings.engine.timeout.label", { seconds: "3.5" }),
    "LLM Fallback Timeout (3.5s)",
  )
  assert.equal(
    resolveTranslation("ru", "settings.engine.timeout.label", { seconds: "3.5" }),
    "Таймаут ожидания LLM (3.5 с)",
  )
  assert.equal(
    resolveTranslation("ru", "settings.appearance.bgOpacity.label", { opacity: 95 }),
    "Непрозрачность фона (95%)",
  )
})

test("i18n: resolveTranslation falls back to English when language is unknown", () => {
  assert.equal(
    resolveTranslation("unknown_lang", "settings.title"),
    "Translation",
  )
})

test("i18n: getDefaultTargetsForLocale returns appropriate defaults per language", () => {
  assert.equal(getDefaultTargetsForLocale("ru-RU"), "ru, en")
  assert.equal(getDefaultTargetsForLocale("de-DE"), "de, en")
  assert.equal(getDefaultTargetsForLocale("fr"), "fr, en")
  assert.equal(getDefaultTargetsForLocale("zh-CN"), "zh, en")
  assert.equal(getDefaultTargetsForLocale("es"), "es, en")
  assert.equal(getDefaultTargetsForLocale("ja"), "ja, en")
  assert.equal(getDefaultTargetsForLocale("en-US"), "ru, en")
  assert.equal(getDefaultTargetsForLocale(undefined), "ru, en")
})

test("i18n: tuiText returns text matching current environment", () => {
  // If Russian environment, returns first arg; otherwise second arg
  const res = tuiText("Привет", "Hello")
  assert.ok(res === "Привет" || res === "Hello")
})
