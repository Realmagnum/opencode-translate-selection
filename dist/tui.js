// src/tui.tsx
import { memo as _$memo } from "@opentui/solid";
import { createTextNode as _$createTextNode } from "@opentui/solid";
import { effect as _$effect } from "@opentui/solid";
import { createComponent as _$createComponent } from "@opentui/solid";
import { use as _$use } from "@opentui/solid";
import { insertNode as _$insertNode } from "@opentui/solid";
import { insert as _$insert } from "@opentui/solid";
import { setProp as _$setProp } from "@opentui/solid";
import { createElement as _$createElement } from "@opentui/solid";
import { For, Show, createSignal, onMount } from "solid-js";
import { Plugin } from "@opencode/plugin/tui";

// src/clipboard.ts
import { exec, spawn } from "node:child_process";
async function readClipboard() {
  const platform = process.platform;
  if (platform === "darwin") {
    return new Promise((resolve) => {
      exec("pbpaste", { encoding: "utf8", timeout: 2e3 }, (error, stdout) => {
        if (error) {
          resolve("");
          return;
        }
        resolve(stdout || "");
      });
    });
  }
  if (platform === "win32") {
    return new Promise((resolve) => {
      exec("powershell.exe -NoProfile -Command Get-Clipboard", { encoding: "utf8", timeout: 3e3 }, (error, stdout) => {
        if (error) {
          resolve("");
          return;
        }
        resolve(stdout ? stdout.replace(/\r\n/g, "\n") : "");
      });
    });
  }
  return new Promise((resolve) => {
    exec("wl-paste 2>/dev/null || xclip -selection clipboard -o 2>/dev/null || xsel --clipboard --output 2>/dev/null", { encoding: "utf8", timeout: 2e3 }, (error, stdout) => {
      if (error) {
        resolve("");
        return;
      }
      resolve(stdout || "");
    });
  });
}
async function writeClipboard(text) {
  const platform = process.platform;
  if (platform === "darwin") {
    return new Promise((resolve) => {
      try {
        const child = spawn("pbcopy");
        child.stdin.write(text);
        child.stdin.end();
        child.on("close", (code) => resolve(code === 0));
        child.on("error", () => resolve(false));
      } catch {
        resolve(false);
      }
    });
  }
  if (platform === "win32") {
    return new Promise((resolve) => {
      try {
        const child = spawn("powershell.exe", ["-NoProfile", "-Command", "$input | Set-Clipboard"]);
        child.stdin.write(text);
        child.stdin.end();
        child.on("close", (code) => resolve(code === 0));
        child.on("error", () => resolve(false));
      } catch {
        resolve(false);
      }
    });
  }
  return new Promise((resolve) => {
    try {
      const child = spawn("sh", ["-c", "wl-copy 2>/dev/null || xclip -selection clipboard 2>/dev/null || xsel --clipboard --input 2>/dev/null"]);
      child.stdin.write(text);
      child.stdin.end();
      child.on("close", (code) => resolve(code === 0));
      child.on("error", () => resolve(false));
    } catch {
      resolve(false);
    }
  });
}

// src/translate.ts
import { get as httpsGet } from "node:https";

// src/detector.ts
function isComplexFormattedText(raw) {
  if (!raw) return false;
  const trimmed = raw.trim();
  if (trimmed.length < 40 && !trimmed.includes("\n") && !trimmed.includes("`") && !trimmed.includes("{") && !trimmed.includes("(")) {
    return false;
  }
  const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length >= 2) {
    const hasListMarkers = lines.some((l) => /^([•\-*+]|\d+[.)]|\d+-\d+)\s/.test(l));
    if (hasListMarkers) return true;
    const hasHeadings = lines.some((l) => /^#{1,6}\s/.test(l));
    if (hasHeadings) return true;
    const hasQuotes = lines.some((l) => /^>\s?/.test(l));
    if (hasQuotes) return true;
  }
  if (/`{1,3}[^`]+`{1,3}/.test(trimmed)) return true;
  if (/\b[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*\(/.test(trimmed)) return true;
  if (/\{[\s\S]*:[ \t]*[\s\S]*\}/.test(trimmed)) return true;
  if (lines.length >= 3) return true;
  return false;
}

// src/shield.ts
var SHIELD_RE = /(`{1,3}[^`]+`{1,3}|\b[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z0-9_.]+\([^)]*\)|\b(?:https?|ftp):\/\/[^\s/$.?#].[^\s]*)/g;
function shieldTokens(text) {
  const tokens = [];
  const shielded = text.replace(SHIELD_RE, (match) => {
    const index = tokens.length;
    tokens.push(match);
    return `\u27E6${index}\u27E7`;
  });
  return { shielded, tokens };
}
function unshieldTokens(text, tokens) {
  if (tokens.length === 0) return text;
  let out = text;
  tokens.forEach((token, index) => {
    const pattern = new RegExp(`\u27E6\\s*${index}\\s*\u27E7`, "g");
    out = out.replace(pattern, token);
  });
  return out;
}

// src/llm-engine.ts
var LANGUAGE_NAMES = {
  ru: "Russian",
  en: "English",
  de: "German",
  fr: "French",
  es: "Spanish",
  zh: "Chinese",
  ja: "Japanese",
  it: "Italian",
  pt: "Portuguese",
  ko: "Korean",
  ar: "Arabic",
  hi: "Hindi",
  tr: "Turkish",
  uk: "Ukrainian",
  pl: "Polish"
};
function targetLangName(code) {
  const norm = code.toLowerCase().trim().split("-")[0] ?? "";
  return LANGUAGE_NAMES[norm] ?? code.toUpperCase();
}
function buildLlmPrompt(text, targetLang) {
  const lang = targetLangName(targetLang);
  return `Translate the following text to ${lang}.
Strict requirements:
1. Preserve all structural formatting exactly: bullet lists (\u2022, -, *), numbered steps, indentations, line breaks, and Markdown.
2. DO NOT translate, change, or rename code, function calls, parameters, variable names, URLs, or technical identifiers (e.g. tools.opencode.models({ query: 'search' })).
3. Return ONLY the translated content. No explanations, no introductory text, no conversational phrases.

Text to translate:
${text}`;
}
function cleanLlmOutput(output, originalText) {
  let text = output.trim();
  if (!originalText.trim().startsWith("```") && text.startsWith("```") && text.endsWith("```")) {
    text = text.replace(/^```[a-zA-Z]*\r?\n?/, "").replace(/\r?\n?```$/, "").trim();
  }
  text = text.replace(/^(?:Here is the translation|Вот перевод|Translation|Перевод):\s*\r?\n?/i, "").trim();
  return text;
}
async function translateWithLlm(input, externalSignal) {
  const timeoutMs = input.timeoutMs ?? 3500;
  const timeoutController = new AbortController();
  const timer = setTimeout(() => timeoutController.abort(), timeoutMs);
  let combinedSignal;
  if (typeof AbortSignal.any === "function") {
    combinedSignal = AbortSignal.any([externalSignal, timeoutController.signal]);
  } else {
    combinedSignal = timeoutController.signal;
    externalSignal.addEventListener("abort", () => timeoutController.abort(), { once: true });
  }
  try {
    const prompt = buildLlmPrompt(input.text, input.targetLang);
    const result = await input.client.session.generate(
      { sessionID: input.sessionID, prompt },
      { signal: combinedSignal }
    );
    const raw = typeof result?.text === "string" ? result.text : result?.data?.text ?? "";
    if (!raw.trim()) throw new Error("LLM returned empty translation");
    return {
      text: cleanLlmOutput(raw, input.text),
      lang: input.targetLang
    };
  } finally {
    clearTimeout(timer);
  }
}

// src/translate.ts
function detectScriptLanguage(text) {
  if (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(text)) return "zh";
  if (/[\u3040-\u30ff]/.test(text)) return "ja";
  if (/[\uac00-\ud7af]/.test(text)) return "ko";
  if (/[а-яё]/i.test(text)) return "ru";
  return "en";
}
var ENDPOINT = "https://translate.googleapis.com/translate_a/single";
var CACHE_LIMIT = 500;
var cache = /* @__PURE__ */ new Map();
function remember(key, value) {
  cache.set(key, value);
  if (cache.size <= CACHE_LIMIT) return;
  const oldest = cache.keys().next();
  if (!oldest.done) cache.delete(oldest.value);
}
var USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)";
async function requestJson(url, signal) {
  if (signal.aborted) throw new Error("call aborted before the request");
  const headers = { accept: "application/json", "user-agent": USER_AGENT };
  const implementation = globalThis.fetch;
  if (typeof implementation === "function") {
    try {
      const response = await implementation(url, { signal, headers });
      if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
      return await response.json();
    } catch (error) {
      if (signal.aborted || error instanceof Error && error.message.startsWith("HTTP ")) throw error;
    }
  }
  return viaHttps(url, signal);
}
function viaHttps(url, signal) {
  return new Promise((resolve, reject) => {
    const request = httpsGet(url, { headers: { accept: "application/json", "user-agent": USER_AGENT } }, (response) => {
      const status = response.statusCode ?? 0;
      if (status < 200 || status >= 300) {
        response.resume();
        reject(new Error(`HTTP ${status}`));
        return;
      }
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => body += chunk);
      response.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          reject(new Error("response is not JSON"));
        }
      });
    });
    request.on("error", (error) => reject(error));
    signal.addEventListener("abort", () => request.destroy(new Error("call aborted")), { once: true });
  });
}
function unescapeHtml(text) {
  return text.replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}
async function fetchGoogle(text, to, clientName, signal) {
  const url = `${ENDPOINT}?client=${encodeURIComponent(clientName)}&sl=auto&tl=${encodeURIComponent(to)}&dt=t&q=${encodeURIComponent(text)}`;
  const body = await requestJson(url, signal);
  const chunks = Array.isArray(body) ? body[0] : void 0;
  if (!Array.isArray(chunks)) throw new Error("unexpected response shape");
  const translated = chunks.map((chunk) => Array.isArray(chunk) && typeof chunk[0] === "string" ? chunk[0] : "").join("").trim();
  if (!translated) throw new Error("empty translation");
  const detected = Array.isArray(body) && typeof body[2] === "string" ? body[2] : "";
  return { text: translated, detected, engineUsed: clientName };
}
async function fetchMyMemory(text, to, signal) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=autodetect|${encodeURIComponent(to)}`;
  const body = await requestJson(url, signal);
  const translated = body?.responseData?.translatedText;
  if (typeof translated !== "string" || !translated.trim()) {
    throw new Error(body?.responseDetails || "MyMemory returned empty result");
  }
  const detected = typeof body?.matches?.[0]?.["source-language"] === "string" ? body.matches[0]["source-language"] : detectScriptLanguage(text);
  return { text: unescapeHtml(translated.trim()), detected, engineUsed: "mymemory" };
}
async function translateWithFallback(text, to, signal, log) {
  const key = `mt\0${to}\0${text}`;
  const hit = cache.get(key);
  if (hit !== void 0) return hit;
  try {
    const entry = await fetchGoogle(text, to, "gtx", signal);
    remember(key, entry);
    return entry;
  } catch (errGtx) {
    log?.("warn", "Google gtx failed, trying dict-chrome-ex", { to, error: describe(errGtx) });
  }
  try {
    const entry = await fetchGoogle(text, to, "dict-chrome-ex", signal);
    remember(key, entry);
    return entry;
  } catch (errDict) {
    log?.("warn", "Google dict-chrome-ex failed, trying MyMemory fallback", { to, error: describe(errDict) });
  }
  try {
    const entry = await fetchMyMemory(text, to, signal);
    remember(key, entry);
    return entry;
  } catch (errMyMemory) {
    log?.("error", "All translation backends failed", { to, error: describe(errMyMemory) });
    throw new Error(`All backends failed: ${describe(errMyMemory)}`);
  }
}
function describe(reason) {
  if (reason instanceof Error) return `${reason.name}: ${reason.message}`;
  return String(reason);
}
async function translate(input, signal, options) {
  const log = options?.log;
  const client = options?.client;
  const text = input.text.replace(/\r/g, "").trim();
  const targets = [...new Set(input.targets.map((lang) => lang.trim()).filter(Boolean))];
  if (!text) return { detected: "", results: [] };
  const mode = input.engineMode ?? "auto";
  const isComplex = isComplexFormattedText(text);
  const shouldTryLlm = (mode === "llm" || mode === "auto" && isComplex) && !!input.sessionID && !!client;
  log?.("info", "translate request", {
    chars: text.length,
    targets,
    mode,
    isComplex,
    shouldTryLlm,
    hasSession: !!input.sessionID
  });
  if (shouldTryLlm) {
    try {
      const dropSource = input.dropSourceLang !== false;
      const detectedSource = detectScriptLanguage(text);
      const activeTargets = dropSource ? targets.filter((t) => t.toLowerCase().split("-")[0] !== detectedSource) : targets;
      const targetsToTranslate = activeTargets.length > 0 ? activeTargets : targets;
      const llmSettled = await Promise.allSettled(
        targetsToTranslate.map(async (target) => {
          const cacheKey = `llm\0${target}\0${text}`;
          const cached = cache.get(cacheKey);
          if (cached) return cached;
          const res = await translateWithLlm(
            {
              text,
              targetLang: target,
              sessionID: input.sessionID,
              client,
              timeoutMs: input.llmTimeoutMs ?? 3500
            },
            signal
          );
          const entry = { text: res.text, detected: detectedSource, engineUsed: "llm" };
          remember(cacheKey, entry);
          return entry;
        })
      );
      const fulfilled = llmSettled.filter(
        (r) => r.status === "fulfilled"
      );
      if (fulfilled.length > 0) {
        const results2 = llmSettled.map((r, index) => {
          const lang = targetsToTranslate[index] ?? "";
          if (r.status === "fulfilled") {
            return { lang, text: r.value.text, engineUsed: "llm" };
          }
          return { lang, text: "", error: describe(r.reason) };
        });
        return { detected: detectedSource, results: results2 };
      }
      const firstError = llmSettled.find((r) => r.status === "rejected");
      throw firstError?.reason ?? new Error("LLM failed");
    } catch (llmError) {
      log?.("warn", "LLM translation failed or timed out, falling back to MT pipeline", {
        error: describe(llmError)
      });
      if (mode === "llm") {
        return {
          detected: "",
          results: targets.map((lang) => ({ lang, text: "", error: describe(llmError) }))
        };
      }
    }
  }
  const { shielded, tokens } = shieldTokens(text);
  const settled = await Promise.allSettled(
    targets.map((lang) => translateWithFallback(shielded, lang, signal, log))
  );
  const failures = settled.filter((result) => result.status === "rejected");
  if (failures.length > 0) {
    log?.("warn", "translate request partial failure", {
      targets,
      errors: failures.map((result) => result.status === "rejected" ? describe(result.reason) : ""),
      aborted: signal.aborted
    });
  }
  const detected = settled.map((result) => result.status === "fulfilled" ? result.value.detected : "").find(Boolean) ?? "";
  const results = settled.map((result, index) => {
    const lang = targets[index] ?? "";
    if (result.status === "fulfilled") {
      const unshielded = unshieldTokens(result.value.text, tokens);
      return { lang, text: unshielded, engineUsed: result.value.engineUsed };
    }
    return { lang, text: "", error: describe(result.reason) };
  });
  const source = detected.toLowerCase().split("-")[0];
  const useful = source ? results.filter((result) => result.lang.toLowerCase().split("-")[0] !== source || result.error) : results;
  return { detected, results: useful.length > 0 ? useful : results };
}

// src/tui-extract.ts
function extractAssistantText(message) {
  if (!Array.isArray(message.content)) return "";
  const texts = [];
  for (const part of message.content) {
    if (typeof part?.text === "string" && part?.type === "text") {
      texts.push(part.text);
    }
  }
  return texts.join("\n\n").trim();
}
async function getLastAssistantText(context, sessionID) {
  try {
    await context.data.session.message.sync(sessionID);
  } catch {
  }
  const messages = context.data.session.message.list(sessionID) ?? [];
  const assistantMessages = messages.filter(
    (m) => m?.type === "assistant"
  );
  if (assistantMessages.length === 0) return void 0;
  for (let i = assistantMessages.length - 1; i >= 0; i--) {
    const text = extractAssistantText(assistantMessages[i]);
    if (text) return text;
  }
  return void 0;
}
function formatTransOutputMarkdown(output, originalText) {
  const parts = [];
  for (const res of output.results) {
    const badge = res.engineUsed === "llm" ? " [LLM]" : "";
    if (res.error) {
      parts.push(`**[${res.lang.toUpperCase()}]**${badge} (Error: ${res.error})`);
    } else {
      parts.push(`**[${res.lang.toUpperCase()}]**${badge}
${res.text}`);
    }
  }
  return parts.join("\n\n---\n\n");
}
function formatKey(key) {
  if (!key) return "";
  return key.split("+").map((part) => {
    const p = part.trim().toLowerCase();
    if (p === "alt") return "Alt";
    if (p === "ctrl") return "Ctrl";
    if (p === "shift") return "Shift";
    if (p === "cmd" || p === "super") return "Cmd";
    return p.toUpperCase();
  }).join("+");
}

// src/i18n.ts
function getSystemLocale() {
  try {
    const env = (process.env.LC_ALL || process.env.LC_MESSAGES || process.env.LANG || process.env.LANGUAGE || "").toLowerCase();
    if (env) {
      const match = env.split(".")[0]?.replace("_", "-");
      if (match) return match;
    }
    return Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
  } catch {
    return "en";
  }
}
function isRussianLocale() {
  const loc = getSystemLocale();
  return loc.startsWith("ru") || loc.startsWith("uk") || loc.startsWith("be");
}
function tuiText(ru, en) {
  return isRussianLocale() ? ru : en;
}

// src/tui.tsx
var PANEL_NAME = "translate.panel";
var DEFAULT_TUI_SETTINGS = {
  targets: "ru, en",
  engineMode: "auto",
  llmTimeoutMs: 3500,
  dropSourceLang: true,
  keyClipboard: "alt+t",
  keyLastTurn: "alt+shift+t",
  keyPanel: "alt+p"
};
function TranslationModal(props) {
  const theme = () => props.context.theme;
  let scrollRef;
  const [copied, setCopied] = createSignal(false);
  const detected = (props.output.detected || "auto").toUpperCase();
  const targetLangs = props.output.results.map((r) => r.lang.toUpperCase()).join(", ");
  const handleCopy = () => {
    props.onCopy();
    setCopied(true);
  };
  props.context.keymap.layer(() => ({
    mode: "modal",
    commands: [{
      id: "translate.modal.copy",
      title: tuiText("\u041A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C", "Copy"),
      bind: "y",
      run: () => {
        handleCopy();
      }
    }, {
      id: "translate.modal.copy_and_close",
      title: tuiText("\u041A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0438 \u0437\u0430\u043A\u0440\u044B\u0442\u044C", "Copy and close"),
      bind: "return",
      run: () => {
        handleCopy();
        props.onClose();
      }
    }, {
      id: "translate.modal.panel",
      title: tuiText("\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0432 \u0431\u043E\u043A\u043E\u0432\u043E\u0439 \u043F\u0430\u043D\u0435\u043B\u0438", "Open in side panel"),
      bind: "p",
      run: () => {
        props.onOpenPanel();
      }
    }, {
      id: "translate.modal.close",
      title: tuiText("\u0417\u0430\u043A\u0440\u044B\u0442\u044C", "Close"),
      bind: "escape",
      run: () => {
        props.onClose();
      }
    }, {
      id: "translate.modal.close_q",
      title: tuiText("\u0417\u0430\u043A\u0440\u044B\u0442\u044C", "Close"),
      bind: "q",
      run: () => {
        props.onClose();
      }
    }, {
      id: "translate.modal.down",
      title: tuiText("\u0412\u043D\u0438\u0437", "Down"),
      bind: "down,j",
      run: () => {
        scrollRef?.scrollBy(2);
      }
    }, {
      id: "translate.modal.up",
      title: tuiText("\u0412\u0432\u0435\u0440\u0445", "Up"),
      bind: "up,k",
      run: () => {
        scrollRef?.scrollBy(-2);
      }
    }, {
      id: "translate.modal.pagedown",
      title: tuiText("\u0421\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u0432\u043D\u0438\u0437", "Page down"),
      bind: "pagedown,space",
      run: () => {
        scrollRef?.scrollBy(6);
      }
    }, {
      id: "translate.modal.pageup",
      title: tuiText("\u0421\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u0432\u0432\u0435\u0440\u0445", "Page up"),
      bind: "pageup",
      run: () => {
        scrollRef?.scrollBy(-6);
      }
    }]
  }));
  const termHeight = props.context.renderer?.terminalHeight || 30;
  const modalHeight = Math.max(10, Math.min(24, Math.floor(termHeight * 0.75)));
  return (() => {
    var _el$ = _$createElement("box"), _el$2 = _$createElement("box"), _el$3 = _$createElement("box"), _el$4 = _$createElement("text"), _el$5 = _$createElement("text"), _el$6 = _$createElement("text"), _el$7 = _$createElement("box"), _el$8 = _$createElement("scrollbox"), _el$9 = _$createElement("box"), _el$0 = _$createElement("box"), _el$1 = _$createElement("box"), _el$10 = _$createElement("text"), _el$11 = _$createElement("text"), _el$12 = _$createElement("text"), _el$13 = _$createElement("text"), _el$14 = _$createElement("text");
    _$insertNode(_el$, _el$2);
    _$insertNode(_el$, _el$7);
    _$insertNode(_el$, _el$0);
    _$setProp(_el$, "flexDirection", "column");
    _$setProp(_el$, "width", "100%");
    _$setProp(_el$, "height", modalHeight);
    _$setProp(_el$, "paddingLeft", 2);
    _$setProp(_el$, "paddingRight", 2);
    _$setProp(_el$, "paddingBottom", 1);
    _$insertNode(_el$2, _el$3);
    _$insertNode(_el$2, _el$6);
    _$setProp(_el$2, "flexDirection", "row");
    _$setProp(_el$2, "justifyContent", "space-between");
    _$setProp(_el$2, "alignItems", "center");
    _$setProp(_el$2, "paddingBottom", 1);
    _$setProp(_el$2, "border", ["bottom"]);
    _$insertNode(_el$3, _el$4);
    _$insertNode(_el$3, _el$5);
    _$setProp(_el$3, "flexDirection", "row");
    _$setProp(_el$3, "gap", 1);
    _$setProp(_el$3, "alignItems", "center");
    _$setProp(_el$4, "fg", "#ffd75e");
    _$insert(_el$4, () => tuiText("\u{1F310} \u041F\u0415\u0420\u0415\u0412\u041E\u0414", "\u{1F310} TRANSLATION"));
    _$setProp(_el$5, "fg", "#38bdf8");
    _$insert(_el$5, `[${detected} \u2192 ${targetLangs}]`);
    _$insert(_el$6, () => tuiText("[Esc / q] \u0417\u0430\u043A\u0440\u044B\u0442\u044C", "[Esc / q] Close"));
    _$insertNode(_el$7, _el$8);
    _$setProp(_el$7, "flexGrow", 1);
    _$setProp(_el$7, "minHeight", 0);
    _$setProp(_el$7, "paddingTop", 1);
    _$setProp(_el$7, "paddingBottom", 1);
    _$insertNode(_el$8, _el$9);
    _$use((el) => {
      scrollRef = el;
    }, _el$8);
    _$setProp(_el$8, "focused", true);
    _$setProp(_el$8, "width", "100%");
    _$setProp(_el$8, "height", "100%");
    _$setProp(_el$9, "flexDirection", "column");
    _$setProp(_el$9, "gap", 1);
    _$insert(_el$9, _$createComponent(For, {
      get each() {
        return props.output.results;
      },
      children: (res) => (() => {
        var _el$16 = _$createElement("box"), _el$17 = _$createElement("box"), _el$18 = _$createElement("text"), _el$22 = _$createElement("text");
        _$insertNode(_el$16, _el$17);
        _$insertNode(_el$16, _el$22);
        _$setProp(_el$16, "flexDirection", "column");
        _$setProp(_el$16, "gap", 0);
        _$setProp(_el$16, "paddingBottom", 1);
        _$insertNode(_el$17, _el$18);
        _$setProp(_el$17, "flexDirection", "row");
        _$setProp(_el$17, "gap", 1);
        _$setProp(_el$17, "alignItems", "center");
        _$setProp(_el$18, "fg", "#38bdf8");
        _$insert(_el$18, () => `[${res.lang.toUpperCase()}]`);
        _$insert(_el$17, _$createComponent(Show, {
          get when() {
            return res.engineUsed === "llm";
          },
          get children() {
            var _el$19 = _$createElement("text");
            _$insertNode(_el$19, _$createTextNode(`\u2022 LLM`));
            _$setProp(_el$19, "fg", "#a3e635");
            return _el$19;
          }
        }), null);
        _$insert(_el$17, _$createComponent(Show, {
          get when() {
            return res.error;
          },
          get children() {
            var _el$21 = _$createElement("text");
            _$setProp(_el$21, "fg", "#ef4444");
            _$insert(_el$21, () => `(${tuiText("\u041E\u0448\u0438\u0431\u043A\u0430", "Error")}: ${res.error})`);
            return _el$21;
          }
        }), null);
        _$setProp(_el$22, "wrapMode", "word");
        _$insert(_el$22, () => res.text || tuiText("(\u043F\u0443\u0441\u0442\u043E\u0439 \u043F\u0435\u0440\u0435\u0432\u043E\u0434)", "(empty translation)"));
        _$effect((_$p) => _$setProp(_el$22, "fg", theme().text?.default ?? "#f8fafc", _$p));
        return _el$16;
      })()
    }));
    _$insertNode(_el$0, _el$1);
    _$setProp(_el$0, "flexDirection", "row");
    _$setProp(_el$0, "justifyContent", "space-between");
    _$setProp(_el$0, "alignItems", "center");
    _$setProp(_el$0, "paddingTop", 1);
    _$setProp(_el$0, "border", ["top"]);
    _$insertNode(_el$1, _el$10);
    _$insertNode(_el$1, _el$11);
    _$insertNode(_el$1, _el$12);
    _$insertNode(_el$1, _el$13);
    _$insertNode(_el$1, _el$14);
    _$setProp(_el$1, "flexDirection", "row");
    _$setProp(_el$1, "flexWrap", "wrap");
    _$setProp(_el$1, "columnGap", 1);
    _$insert(_el$10, () => tuiText("[y] \u041A\u043E\u043F\u0438\u044F", "[y] Copy"));
    _$insert(_el$11, () => tuiText("[Enter] \u041A\u043E\u043F\u0438\u044F+\u0417\u0430\u043A\u0440\u044B\u0442\u044C", "[Enter] Copy+Close"));
    _$insert(_el$12, () => tuiText("[p] \u0412 \u043F\u0430\u043D\u0435\u043B\u044C", "[p] Panel"));
    _$insert(_el$13, () => tuiText("[\u2191/\u2193] \u0421\u043A\u0440\u043E\u043B\u043B", "[\u2191/\u2193] Scroll"));
    _$insert(_el$14, () => tuiText("[q] \u0417\u0430\u043A\u0440\u044B\u0442\u044C", "[q] Close"));
    _$insert(_el$0, _$createComponent(Show, {
      get when() {
        return copied();
      },
      get children() {
        var _el$15 = _$createElement("text");
        _$setProp(_el$15, "fg", "#10b981");
        _$insert(_el$15, () => tuiText("\u2713 \u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u043E!", "\u2713 Copied!"));
        return _el$15;
      }
    }), null);
    _$effect((_p$) => {
      var _v$ = theme().border?.base ?? "#334155", _v$2 = theme().text?.subdued ?? "#94a3b8", _v$3 = theme().border?.base ?? "#334155", _v$4 = theme().text?.subdued ?? "#94a3b8", _v$5 = theme().text?.subdued ?? "#94a3b8", _v$6 = theme().text?.subdued ?? "#94a3b8", _v$7 = theme().text?.subdued ?? "#94a3b8", _v$8 = theme().text?.subdued ?? "#94a3b8";
      _v$ !== _p$.e && (_p$.e = _$setProp(_el$2, "borderColor", _v$, _p$.e));
      _v$2 !== _p$.t && (_p$.t = _$setProp(_el$6, "fg", _v$2, _p$.t));
      _v$3 !== _p$.a && (_p$.a = _$setProp(_el$0, "borderColor", _v$3, _p$.a));
      _v$4 !== _p$.o && (_p$.o = _$setProp(_el$10, "fg", _v$4, _p$.o));
      _v$5 !== _p$.i && (_p$.i = _$setProp(_el$11, "fg", _v$5, _p$.i));
      _v$6 !== _p$.n && (_p$.n = _$setProp(_el$12, "fg", _v$6, _p$.n));
      _v$7 !== _p$.s && (_p$.s = _$setProp(_el$13, "fg", _v$7, _p$.s));
      _v$8 !== _p$.h && (_p$.h = _$setProp(_el$14, "fg", _v$8, _p$.h));
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0,
      i: void 0,
      n: void 0,
      s: void 0,
      h: void 0
    });
    return _el$;
  })();
}
function TranslationPanel(props) {
  const panel = props.panel;
  const ctx = props.context;
  const theme = () => ctx.theme;
  let scrollRef;
  onMount(() => {
    props.panel.focus();
  });
  ctx.keymap.layer(() => ({
    commands: [{
      id: "translate.panel.clipboard",
      title: tuiText("\u041F\u0435\u0440\u0435\u0432\u0435\u0441\u0442\u0438 \u0431\u0443\u0444\u0435\u0440 \u043E\u0431\u043C\u0435\u043D\u0430", "Translate clipboard"),
      bind: "t",
      run: () => props.onTranslateClipboard()
    }, {
      id: "translate.panel.last",
      title: tuiText("\u041F\u0435\u0440\u0435\u0432\u0435\u0441\u0442\u0438 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439 \u043E\u0442\u0432\u0435\u0442", "Translate last response"),
      bind: "l",
      run: () => props.onTranslateLast()
    }, {
      id: "translate.panel.copy",
      title: tuiText("\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u043F\u0435\u0440\u0435\u0432\u043E\u0434", "Copy translation"),
      bind: "y",
      run: () => props.onCopyTranslation()
    }, {
      id: "translate.panel.mode",
      title: tuiText("\u041F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0440\u0435\u0436\u0438\u043C \u0434\u0432\u0438\u0436\u043A\u0430", "Cycle engine mode"),
      bind: "m",
      run: () => props.onCycleEngineMode()
    }, {
      id: "translate.panel.fullscreen",
      title: tuiText("\u041F\u043E\u043B\u043D\u043E\u044D\u043A\u0440\u0430\u043D\u043D\u044B\u0439 \u0440\u0435\u0436\u0438\u043C", "Fullscreen mode"),
      bind: "f",
      run: () => {
        if (panel.width < 108) {
          ctx.ui.toast.show({
            title: tuiText("\u0420\u0430\u0437\u043C\u0435\u0440 \u043E\u043A\u043D\u0430", "Window size"),
            message: tuiText("\u0422\u0435\u0440\u043C\u0438\u043D\u0430\u043B \u0443\u0437\u043A\u0438\u0439 (< 108 \u043A\u043E\u043B\u043E\u043D\u043E\u043A), \u043F\u0430\u043D\u0435\u043B\u044C \u0443\u0436\u0435 \u0437\u0430\u043D\u0438\u043C\u0430\u0435\u0442 \u0432\u0441\u0451 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E\u0435 \u043C\u0435\u0441\u0442\u043E", "Terminal is narrow (< 108 columns), panel already occupies full space"),
            variant: "info",
            duration: 2500
          });
          return;
        }
        panel.toggleFullscreen();
        const isFull = panel.presentation === "fullscreen";
        ctx.ui.toast.show({
          message: isFull ? tuiText("\u041E\u0431\u044B\u0447\u043D\u044B\u0439 \u0432\u0438\u0434 \u043F\u0430\u043D\u0435\u043B\u0438", "Standard panel view") : tuiText("\u041F\u0430\u043D\u0435\u043B\u044C \u043D\u0430 \u043F\u043E\u043B\u043D\u044B\u0439 \u044D\u043A\u0440\u0430\u043D", "Fullscreen panel"),
          duration: 1500
        });
      }
    }, {
      id: "translate.panel.scroll_down",
      title: tuiText("\u0412\u043D\u0438\u0437", "Down"),
      bind: "down,j",
      run: () => {
        scrollRef?.scrollBy(2);
      }
    }, {
      id: "translate.panel.scroll_up",
      title: tuiText("\u0412\u0432\u0435\u0440\u0445", "Up"),
      bind: "up,k",
      run: () => {
        scrollRef?.scrollBy(-2);
      }
    }, {
      id: "translate.panel.page_down",
      title: tuiText("\u0421\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u0432\u043D\u0438\u0437", "Page down"),
      bind: "pagedown,space",
      run: () => {
        scrollRef?.scrollBy(6);
      }
    }, {
      id: "translate.panel.page_up",
      title: tuiText("\u0421\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u0432\u0432\u0435\u0440\u0445", "Page up"),
      bind: "pageup",
      run: () => {
        scrollRef?.scrollBy(-6);
      }
    }, {
      id: "translate.panel.close",
      title: tuiText("\u0417\u0430\u043A\u0440\u044B\u0442\u044C \u043F\u0430\u043D\u0435\u043B\u044C", "Close panel"),
      bind: "escape",
      run: panel.close
    }, {
      id: "translate.panel.close_q",
      title: tuiText("\u0417\u0430\u043A\u0440\u044B\u0442\u044C \u043F\u0430\u043D\u0435\u043B\u044C", "Close panel"),
      bind: "q",
      run: panel.close
    }]
  }));
  const formattedOutput = () => {
    if (!props.latest.output) return "";
    return formatTransOutputMarkdown(props.latest.output, props.latest.originalText);
  };
  const modeBadge = () => props.settings().engineMode.toUpperCase();
  const targetsBadge = () => props.settings().targets;
  return (() => {
    var _el$23 = _$createElement("box"), _el$24 = _$createElement("box"), _el$25 = _$createElement("box"), _el$26 = _$createElement("box"), _el$27 = _$createElement("text"), _el$29 = _$createElement("text"), _el$31 = _$createElement("box"), _el$32 = _$createElement("text"), _el$37 = _$createElement("box"), _el$38 = _$createElement("scrollbox"), _el$41 = _$createElement("box"), _el$42 = _$createElement("box"), _el$43 = _$createElement("text"), _el$44 = _$createElement("text"), _el$45 = _$createElement("text"), _el$46 = _$createElement("text"), _el$47 = _$createElement("text"), _el$48 = _$createElement("text");
    _$insertNode(_el$23, _el$24);
    _$insertNode(_el$23, _el$37);
    _$insertNode(_el$23, _el$41);
    _$setProp(_el$23, "flexDirection", "column");
    _$setProp(_el$23, "padding", 1);
    _$setProp(_el$23, "width", "100%");
    _$setProp(_el$23, "height", "100%");
    _$setProp(_el$23, "onMouseUp", () => props.panel.focus());
    _$insertNode(_el$24, _el$25);
    _$insertNode(_el$24, _el$31);
    _$setProp(_el$24, "flexDirection", "column");
    _$setProp(_el$24, "paddingBottom", 1);
    _$setProp(_el$24, "border", ["bottom"]);
    _$setProp(_el$24, "gap", 0);
    _$insertNode(_el$25, _el$26);
    _$setProp(_el$25, "flexDirection", "row");
    _$setProp(_el$25, "justifyContent", "space-between");
    _$setProp(_el$25, "alignItems", "center");
    _$insertNode(_el$26, _el$27);
    _$insertNode(_el$26, _el$29);
    _$setProp(_el$26, "flexDirection", "row");
    _$setProp(_el$26, "gap", 1);
    _$setProp(_el$26, "alignItems", "center");
    _$insertNode(_el$27, _$createTextNode(`\u{1F310}`));
    _$setProp(_el$27, "fg", "#ffd75e");
    _$setProp(_el$29, "fg", "#ffd75e");
    _$insert(_el$29, () => tuiText("\u041F\u0415\u0420\u0415\u0412\u041E\u0414", "TRANSLATION"));
    _$insert(_el$25, _$createComponent(Show, {
      get when() {
        return props.panel.focused;
      },
      get fallback() {
        return (() => {
          var _el$51 = _$createElement("text");
          _$setProp(_el$51, "fg", "#f59e0b");
          _$insert(_el$51, () => tuiText("(\u0444\u043E\u043A\u0443\u0441)", "(focus)"));
          return _el$51;
        })();
      },
      get children() {
        var _el$30 = _$createElement("text");
        _$setProp(_el$30, "fg", "#10b981");
        _$insert(_el$30, () => tuiText("[\u0444\u043E\u043A\u0443\u0441]", "[focus]"));
        return _el$30;
      }
    }), null);
    _$insertNode(_el$31, _el$32);
    _$setProp(_el$31, "flexDirection", "row");
    _$setProp(_el$31, "gap", 1);
    _$setProp(_el$31, "paddingTop", 0);
    _$setProp(_el$31, "alignItems", "center");
    _$setProp(_el$32, "fg", "#38bdf8");
    _$insert(_el$32, () => `[${modeBadge()} | ${targetsBadge()}]`);
    _$insert(_el$23, _$createComponent(Show, {
      get when() {
        return props.latest.status === "translating";
      },
      get children() {
        var _el$33 = _$createElement("box"), _el$34 = _$createElement("text");
        _$insertNode(_el$33, _el$34);
        _$setProp(_el$33, "paddingTop", 1);
        _$setProp(_el$34, "fg", "#facc15");
        _$insert(_el$34, () => tuiText("\u23F3 \u041F\u0435\u0440\u0435\u0432\u043E\u0434 \u0432 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u0435...", "\u23F3 Translating..."));
        return _el$33;
      }
    }), _el$37);
    _$insert(_el$23, _$createComponent(Show, {
      get when() {
        return props.latest.status === "error";
      },
      get children() {
        var _el$35 = _$createElement("box"), _el$36 = _$createElement("text");
        _$insertNode(_el$35, _el$36);
        _$setProp(_el$35, "paddingTop", 1);
        _$setProp(_el$36, "fg", "#ef4444");
        _$insert(_el$36, () => `\u274C ${tuiText("\u041E\u0448\u0438\u0431\u043A\u0430", "Error")}: ${props.latest.errorMessage || tuiText("\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u0430\u044F \u043E\u0448\u0438\u0431\u043A\u0430", "Unknown error")}`);
        return _el$35;
      }
    }), _el$37);
    _$insertNode(_el$37, _el$38);
    _$setProp(_el$37, "flexGrow", 1);
    _$setProp(_el$37, "minHeight", 0);
    _$setProp(_el$37, "paddingTop", 1);
    _$setProp(_el$37, "paddingBottom", 1);
    _$use((el) => {
      scrollRef = el;
    }, _el$38);
    _$setProp(_el$38, "focused", true);
    _$setProp(_el$38, "width", "100%");
    _$setProp(_el$38, "height", "100%");
    _$insert(_el$38, _$createComponent(Show, {
      get when() {
        return _$memo(() => !!props.latest.output)() && props.latest.output.results.length > 0;
      },
      get fallback() {
        return (() => {
          var _el$52 = _$createElement("box"), _el$53 = _$createElement("text"), _el$54 = _$createElement("text");
          _$insertNode(_el$52, _el$53);
          _$insertNode(_el$52, _el$54);
          _$setProp(_el$52, "flexDirection", "column");
          _$setProp(_el$52, "gap", 1);
          _$insert(_el$53, () => tuiText("\u041F\u0435\u0440\u0435\u0432\u043E\u0434 \u043F\u043E\u043A\u0430 \u043D\u0435 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D.", "No translation performed yet."));
          _$insert(_el$54, () => tuiText("\u041D\u0430\u0436\u043C\u0438\u0442\u0435 [t] \u0434\u043B\u044F \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430 \u0431\u0443\u0444\u0435\u0440\u0430 \u0438\u043B\u0438 [l] \u0434\u043B\u044F \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430 \u043E\u0442\u0432\u0435\u0442\u0430 \u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442\u0430.", "Press [t] to translate clipboard or [l] to translate assistant reply."));
          _$effect((_p$) => {
            var _v$15 = theme().text?.subdued ?? "#94a3b8", _v$16 = theme().text?.subdued ?? "#94a3b8";
            _v$15 !== _p$.e && (_p$.e = _$setProp(_el$53, "fg", _v$15, _p$.e));
            _v$16 !== _p$.t && (_p$.t = _$setProp(_el$54, "fg", _v$16, _p$.t));
            return _p$;
          }, {
            e: void 0,
            t: void 0
          });
          return _el$52;
        })();
      },
      get children() {
        var _el$39 = _$createElement("box");
        _$setProp(_el$39, "flexDirection", "column");
        _$setProp(_el$39, "gap", 1);
        _$insert(_el$39, _$createComponent(Show, {
          get when() {
            return props.latest.source;
          },
          get children() {
            var _el$40 = _$createElement("text");
            _$setProp(_el$40, "fg", "#64748b");
            _$insert(_el$40, () => `${tuiText("\u0418\u0441\u0442\u043E\u0447\u043D\u0438\u043A", "Source")}: ${props.latest.source}`);
            return _el$40;
          }
        }), null);
        _$insert(_el$39, _$createComponent(For, {
          get each() {
            return props.latest.output.results;
          },
          children: (res) => (() => {
            var _el$55 = _$createElement("box"), _el$56 = _$createElement("box"), _el$57 = _$createElement("text"), _el$61 = _$createElement("text");
            _$insertNode(_el$55, _el$56);
            _$insertNode(_el$55, _el$61);
            _$setProp(_el$55, "flexDirection", "column");
            _$setProp(_el$55, "gap", 0);
            _$setProp(_el$55, "paddingBottom", 1);
            _$insertNode(_el$56, _el$57);
            _$setProp(_el$56, "flexDirection", "row");
            _$setProp(_el$56, "gap", 1);
            _$setProp(_el$56, "alignItems", "center");
            _$setProp(_el$57, "fg", "#38bdf8");
            _$insert(_el$57, () => `[${res.lang.toUpperCase()}]`);
            _$insert(_el$56, _$createComponent(Show, {
              get when() {
                return res.engineUsed === "llm";
              },
              get children() {
                var _el$58 = _$createElement("text");
                _$insertNode(_el$58, _$createTextNode(`\u2022 LLM`));
                _$setProp(_el$58, "fg", "#a3e635");
                return _el$58;
              }
            }), null);
            _$insert(_el$56, _$createComponent(Show, {
              get when() {
                return res.error;
              },
              get children() {
                var _el$60 = _$createElement("text");
                _$setProp(_el$60, "fg", "#ef4444");
                _$insert(_el$60, () => `(${tuiText("\u041E\u0448\u0438\u0431\u043A\u0430", "Error")}: ${res.error})`);
                return _el$60;
              }
            }), null);
            _$setProp(_el$61, "wrapMode", "word");
            _$insert(_el$61, () => res.text || tuiText("(\u043F\u0443\u0441\u0442\u043E\u0439 \u043F\u0435\u0440\u0435\u0432\u043E\u0434)", "(empty translation)"));
            _$effect((_$p) => _$setProp(_el$61, "fg", theme().text?.default ?? "#f8fafc", _$p));
            return _el$55;
          })()
        }), null);
        return _el$39;
      }
    }));
    _$insertNode(_el$41, _el$42);
    _$setProp(_el$41, "flexDirection", "column");
    _$setProp(_el$41, "paddingTop", 1);
    _$setProp(_el$41, "border", ["top"]);
    _$setProp(_el$41, "gap", 0);
    _$insertNode(_el$42, _el$43);
    _$insertNode(_el$42, _el$44);
    _$insertNode(_el$42, _el$45);
    _$insertNode(_el$42, _el$46);
    _$insertNode(_el$42, _el$47);
    _$insertNode(_el$42, _el$48);
    _$setProp(_el$42, "flexDirection", "row");
    _$setProp(_el$42, "flexWrap", "wrap");
    _$setProp(_el$42, "columnGap", 1);
    _$setProp(_el$42, "rowGap", 0);
    _$insert(_el$43, () => tuiText("[t] \u0411\u0443\u0444\u0435\u0440", "[t] Clip"));
    _$insert(_el$44, () => tuiText("[l] \u041E\u0442\u0432\u0435\u0442", "[l] Turn"));
    _$insert(_el$45, () => tuiText("[y] \u041A\u043E\u043F\u0438\u044F", "[y] Copy"));
    _$insert(_el$46, () => tuiText("[m] \u0420\u0435\u0436\u0438\u043C", "[m] Mode"));
    _$insert(_el$47, () => tuiText("[f] \u042D\u043A\u0440\u0430\u043D", "[f] Full"));
    _$insert(_el$48, () => tuiText("[q] \u0412\u044B\u0445\u043E\u0434", "[q] Quit"));
    _$insert(_el$41, _$createComponent(Show, {
      get when() {
        return props.latest.lastCopied;
      },
      get children() {
        var _el$49 = _$createElement("box"), _el$50 = _$createElement("text");
        _$insertNode(_el$49, _el$50);
        _$setProp(_el$49, "paddingTop", 0);
        _$setProp(_el$50, "fg", "#10b981");
        _$insert(_el$50, () => tuiText("\u2713 \u041F\u0435\u0440\u0435\u0432\u043E\u0434 \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D \u0432 \u0431\u0443\u0444\u0435\u0440!", "\u2713 Translation copied to clipboard!"));
        return _el$49;
      }
    }), null);
    _$effect((_p$) => {
      var _v$9 = theme().border?.base ?? "#334155", _v$0 = theme().border?.base ?? "#334155", _v$1 = theme().text?.subdued ?? "#94a3b8", _v$10 = theme().text?.subdued ?? "#94a3b8", _v$11 = theme().text?.subdued ?? "#94a3b8", _v$12 = theme().text?.subdued ?? "#94a3b8", _v$13 = theme().text?.subdued ?? "#94a3b8", _v$14 = theme().text?.subdued ?? "#94a3b8";
      _v$9 !== _p$.e && (_p$.e = _$setProp(_el$24, "borderColor", _v$9, _p$.e));
      _v$0 !== _p$.t && (_p$.t = _$setProp(_el$41, "borderColor", _v$0, _p$.t));
      _v$1 !== _p$.a && (_p$.a = _$setProp(_el$43, "fg", _v$1, _p$.a));
      _v$10 !== _p$.o && (_p$.o = _$setProp(_el$44, "fg", _v$10, _p$.o));
      _v$11 !== _p$.i && (_p$.i = _$setProp(_el$45, "fg", _v$11, _p$.i));
      _v$12 !== _p$.n && (_p$.n = _$setProp(_el$46, "fg", _v$12, _p$.n));
      _v$13 !== _p$.s && (_p$.s = _$setProp(_el$47, "fg", _v$13, _p$.s));
      _v$14 !== _p$.h && (_p$.h = _$setProp(_el$48, "fg", _v$14, _p$.h));
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0,
      i: void 0,
      n: void 0,
      s: void 0,
      h: void 0
    });
    return _el$23;
  })();
}
var tui_default = Plugin.define({
  id: "translate-selection",
  setup(context) {
    const [settings, updateSettings] = context.storage.store("tui-settings", {
      initial: DEFAULT_TUI_SETTINGS
    });
    const [latest, updateLatest] = context.storage.memory("tui-latest-trans", {
      initial: {
        originalText: "",
        source: "",
        output: null,
        status: "idle"
      }
    });
    const getTargetsList = () => {
      return (settings.targets || "ru, en").split(",").map((s) => s.trim()).filter(Boolean);
    };
    async function performTranslation(text, sourceDesc, sessionID) {
      const clean = text.trim();
      if (!clean) return null;
      updateLatest((draft) => {
        draft.originalText = clean;
        draft.source = sourceDesc;
        draft.status = "translating";
        draft.errorMessage = void 0;
        draft.lastCopied = false;
      });
      const abortController = new AbortController();
      try {
        const output = await translate({
          text: clean,
          targets: getTargetsList(),
          sessionID,
          engineMode: settings.engineMode,
          llmTimeoutMs: settings.llmTimeoutMs,
          dropSourceLang: settings.dropSourceLang
        }, abortController.signal, {
          client: context.client
        });
        updateLatest((draft) => {
          draft.output = output;
          draft.status = "done";
        });
        return output;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        updateLatest((draft) => {
          draft.status = "error";
          draft.errorMessage = message;
        });
        throw err;
      }
    }
    async function copyToClipboard(text) {
      let osc52Ok = false;
      try {
        osc52Ok = context.renderer?.copyToClipboardOSC52?.(text) === true;
      } catch {
        osc52Ok = false;
      }
      const sysOk = await writeClipboard(text);
      return osc52Ok || sysOk;
    }
    function showTranslationModal(output, originalText) {
      const markdown = formatTransOutputMarkdown(output, originalText);
      context.ui.dialog.set({
        size: "large",
        centered: true
      });
      context.ui.dialog.show(() => _$createComponent(TranslationModal, {
        context,
        output,
        originalText,
        onClose: () => context.ui.dialog.clear(),
        onCopy: async () => {
          await copyToClipboard(markdown);
          context.ui.toast.show({
            message: tuiText("\u2713 \u041F\u0435\u0440\u0435\u0432\u043E\u0434 \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D \u0432 \u0431\u0443\u0444\u0435\u0440", "\u2713 Translation copied to clipboard"),
            variant: "success"
          });
        },
        onOpenPanel: () => {
          context.ui.dialog.clear();
          context.ui.panel.open(PANEL_NAME);
        }
      }));
    }
    async function handleTranslateClipboard(inputArg) {
      const currentRoute = context.ui.router.current();
      const sessionID = currentRoute.type === "session" ? currentRoute.sessionID : void 0;
      const isPanelOpen = context.ui.panel.current()?.name === PANEL_NAME;
      let textToTranslate = inputArg?.trim();
      if (!textToTranslate) {
        textToTranslate = (await readClipboard()).trim();
      }
      if (!textToTranslate) {
        if (isPanelOpen) {
          const keyName = formatKey(settings.keyClipboard || "alt+t");
          context.ui.toast.show({
            title: tuiText("\u041F\u0435\u0440\u0435\u0432\u043E\u0434", "Translation"),
            message: tuiText(`\u0411\u0443\u0444\u0435\u0440 \u043E\u0431\u043C\u0435\u043D\u0430 \u043F\u0443\u0441\u0442. \u0421\u043A\u043E\u043F\u0438\u0440\u0443\u0439\u0442\u0435 \u0442\u0435\u043A\u0441\u0442 \u043F\u0435\u0440\u0435\u0434 \u043D\u0430\u0436\u0430\u0442\u0438\u0435\u043C ${keyName}.`, `Clipboard is empty. Copy text before pressing ${keyName}.`),
            variant: "warning"
          });
          return;
        }
        const prompted = await context.ui.dialog.prompt({
          title: tuiText("\u{1F310} \u041F\u0435\u0440\u0435\u0432\u043E\u0434 \u0442\u0435\u043A\u0441\u0442\u0430", "\u{1F310} Text Translation"),
          placeholder: tuiText("\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0438\u043B\u0438 \u0432\u0441\u0442\u0430\u0432\u044C\u0442\u0435 \u0442\u0435\u043A\u0441\u0442 \u0434\u043B\u044F \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430...", "Enter or paste text to translate...")
        });
        if (!prompted?.trim()) return;
        textToTranslate = prompted.trim();
      }
      if (isPanelOpen) {
        context.ui.toast.show({
          message: tuiText("\u041F\u0435\u0440\u0435\u0432\u043E\u0434...", "Translating..."),
          duration: 1500
        });
      } else {
        context.ui.toast.show({
          message: tuiText("\u041F\u0435\u0440\u0435\u0432\u043E\u0434...", "Translating..."),
          duration: 2e3
        });
      }
      try {
        const output = await performTranslation(textToTranslate, tuiText("\u0411\u0443\u0444\u0435\u0440 \u043E\u0431\u043C\u0435\u043D\u0430", "Clipboard"), sessionID);
        if (!output) return;
        if (isPanelOpen) {
          context.ui.toast.show({
            message: tuiText("\u2713 \u041F\u0435\u0440\u0435\u0432\u043E\u0434 \u043E\u0431\u043D\u043E\u0432\u043B\u0451\u043D \u0432 \u043F\u0430\u043D\u0435\u043B\u0438", "\u2713 Translation updated in panel"),
            duration: 1500,
            variant: "success"
          });
          return;
        }
        showTranslationModal(output, textToTranslate);
      } catch (err) {
        context.ui.toast.show({
          title: tuiText("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430", "Translation error"),
          message: err?.message || tuiText("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u0435\u0440\u0435\u0432\u0435\u0441\u0442\u0438", "Translation failed"),
          variant: "error"
        });
      }
    }
    async function handleTranslateLastTurn() {
      const currentRoute = context.ui.router.current();
      if (currentRoute.type !== "session") {
        context.ui.toast.show({
          title: tuiText("\u041F\u0435\u0440\u0435\u0432\u043E\u0434", "Translation"),
          message: tuiText("\u041E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 \u0441\u0435\u0441\u0441\u0438\u044E \u0434\u043B\u044F \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430 \u043E\u0442\u0432\u0435\u0442\u0430 \u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442\u0430", "Open a session to translate assistant reply"),
          variant: "warning"
        });
        return;
      }
      const sessionID = currentRoute.sessionID;
      const isPanelOpen = context.ui.panel.current()?.name === PANEL_NAME;
      context.ui.toast.show({
        message: tuiText("\u041F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0435 \u043E\u0442\u0432\u0435\u0442\u0430 \u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442\u0430...", "Fetching assistant message..."),
        duration: 1500
      });
      const text = await getLastAssistantText(context, sessionID);
      if (!text) {
        context.ui.toast.show({
          title: tuiText("\u041F\u0435\u0440\u0435\u0432\u043E\u0434", "Translation"),
          message: tuiText("\u0412 \u0442\u0435\u043A\u0443\u0449\u0435\u0439 \u0441\u0435\u0441\u0441\u0438\u0438 \u043D\u0435\u0442 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439 \u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442\u0430", "No assistant messages in current session"),
          variant: "warning"
        });
        return;
      }
      context.ui.toast.show({
        message: tuiText("\u041F\u0435\u0440\u0435\u0432\u043E\u0434...", "Translating..."),
        duration: 2e3
      });
      try {
        const output = await performTranslation(text, tuiText("\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439 \u043E\u0442\u0432\u0435\u0442 \u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442\u0430", "Last assistant message"), sessionID);
        if (!output) return;
        if (isPanelOpen) {
          context.ui.toast.show({
            message: tuiText("\u2713 \u041F\u0435\u0440\u0435\u0432\u043E\u0434 \u043E\u0431\u043D\u043E\u0432\u043B\u0451\u043D \u0432 \u043F\u0430\u043D\u0435\u043B\u0438", "\u2713 Translation updated in panel"),
            duration: 1500,
            variant: "success"
          });
          return;
        }
        showTranslationModal(output, text);
      } catch (err) {
        context.ui.toast.show({
          title: tuiText("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430", "Translation error"),
          message: err?.message || tuiText("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u0435\u0440\u0435\u0432\u0435\u0441\u0442\u0438", "Translation failed"),
          variant: "error"
        });
      }
    }
    async function handleCycleEngineMode() {
      const modes = ["auto", "fast", "llm"];
      const currentIndex = modes.indexOf(settings.engineMode);
      const nextMode = modes[(currentIndex + 1) % modes.length] ?? "auto";
      await updateSettings((draft) => {
        draft.engineMode = nextMode;
      });
      const desc = nextMode === "auto" ? tuiText("AUTO (Google MT \u0434\u043B\u044F \u043F\u0440\u043E\u0441\u0442\u044B\u0445 \u0444\u0440\u0430\u0437, LLM \u0434\u043B\u044F \u043A\u043E\u0434\u0430 \u0438 \u0441\u043F\u0438\u0441\u043A\u043E\u0432)", "AUTO (Google MT for simple phrases, LLM for code & lists)") : nextMode === "fast" ? tuiText("FAST (\u0422\u043E\u043B\u044C\u043A\u043E Google Translate / MyMemory, 0 \u0442\u043E\u043A\u0435\u043D\u043E\u0432)", "FAST (Google Translate / MyMemory only, 0 tokens)") : tuiText("LLM (\u041F\u0435\u0440\u0435\u0432\u043E\u0434 \u043C\u043E\u0434\u0435\u043B\u044C\u044E \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0439 \u0441\u0435\u0441\u0441\u0438\u0438)", "LLM (Translate using active session model)");
      context.ui.toast.show({
        title: tuiText("\u0420\u0435\u0436\u0438\u043C \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430", "Translation mode"),
        message: desc,
        variant: "info",
        duration: 3e3
      });
    }
    async function handleCopyTranslation() {
      if (!latest.output) {
        context.ui.toast.show({
          message: tuiText("\u041D\u0435\u0442 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430 \u0434\u043B\u044F \u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F", "No translation to copy"),
          variant: "warning"
        });
        return;
      }
      const markdown = formatTransOutputMarkdown(latest.output, latest.originalText);
      const ok = await copyToClipboard(markdown);
      if (ok) {
        updateLatest((draft) => {
          draft.lastCopied = true;
        });
        context.ui.toast.show({
          message: tuiText("\u2713 \u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u043E \u0432 \u0431\u0443\u0444\u0435\u0440 \u043E\u0431\u043C\u0435\u043D\u0430", "\u2713 Copied to clipboard"),
          variant: "success"
        });
      }
    }
    async function handleConfig() {
      const clipKey = formatKey(settings.keyClipboard || "alt+t");
      const lastKey = formatKey(settings.keyLastTurn || "alt+shift+t");
      const panelKey = formatKey(settings.keyPanel || "alt+p");
      const picked = await context.ui.dialog.select({
        title: tuiText("\u2699\uFE0F \u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430 (TUI)", "\u2699\uFE0F Translation Settings (TUI)"),
        options: [{
          title: `${tuiText("\u042F\u0437\u044B\u043A\u0438 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430", "Target Languages")}: [${settings.targets}]`,
          value: "languages",
          description: tuiText("\u041A\u043E\u0434\u044B \u044F\u0437\u044B\u043A\u043E\u0432 \u0447\u0435\u0440\u0435\u0437 \u0437\u0430\u043F\u044F\u0442\u0443\u044E (\u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440, ru, en \u0438\u043B\u0438 \u043F\u0440\u043E\u0441\u0442\u043E ru)", "Comma-separated language codes (e.g. ru, en or just ru)")
        }, {
          title: `${tuiText("\u0420\u0435\u0436\u0438\u043C \u0434\u0432\u0438\u0436\u043A\u0430", "Engine Mode")}: [${settings.engineMode.toUpperCase()}]`,
          value: "engine",
          description: "Auto (Smart Hybrid) / Fast MT (Google) / Session LLM"
        }, {
          title: `${tuiText("\u0413\u043E\u0440\u044F\u0447\u0438\u0435 \u043A\u043B\u0430\u0432\u0438\u0448\u0438", "Keybindings")}: [${clipKey}, ${lastKey}, ${panelKey}]`,
          value: "hotkeys",
          description: tuiText("\u041D\u0430\u0441\u0442\u0440\u043E\u0438\u0442\u044C \u043A\u043E\u043C\u0431\u0438\u043D\u0430\u0446\u0438\u0438 \u043A\u043B\u0430\u0432\u0438\u0448 (\u0434\u043B\u044F Ghostty, iTerm2 \u0438 \u0434\u0440\u0443\u0433\u0438\u0445 \u044D\u043C\u0443\u043B\u044F\u0442\u043E\u0440\u043E\u0432)", "Customize key combinations (for Ghostty, iTerm2, and other emulators)")
        }, {
          title: tuiText("\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u043A \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044F\u043C", "Reset to Defaults"),
          value: "reset",
          description: tuiText("\u0412\u0435\u0440\u043D\u0443\u0442\u044C \u0446\u0435\u043B\u0435\u0432\u044B\u0435 \u044F\u0437\u044B\u043A\u0438, \u0440\u0435\u0436\u0438\u043C \u0438 \u0445\u043E\u0442\u043A\u0435\u0438 \u043A \u0441\u0442\u0430\u043D\u0434\u0430\u0440\u0442\u043D\u044B\u043C", "Reset target languages, mode, and keybindings to default")
        }]
      });
      if (picked === "languages") {
        const input = await context.ui.dialog.prompt({
          title: tuiText("\u0426\u0435\u043B\u0435\u0432\u044B\u0435 \u044F\u0437\u044B\u043A\u0438", "Target Languages"),
          description: tuiText("\u0412\u0432\u0435\u0434\u0438\u0442\u0435 ISO-\u043A\u043E\u0434\u044B \u044F\u0437\u044B\u043A\u043E\u0432 \u0447\u0435\u0440\u0435\u0437 \u0437\u0430\u043F\u044F\u0442\u0443\u044E (\u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: ru, en, de, zh). \u0421\u043F\u0438\u0441\u043E\u043A \u043A\u043E\u0434\u043E\u0432 ISO 639-1: https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes", "Enter comma-separated ISO language codes (e.g.: ru, en, de, zh). ISO 639-1 code list: https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes"),
          value: settings.targets
        });
        if (input && input.trim()) {
          await updateSettings((draft) => {
            draft.targets = input.trim();
          });
          context.ui.toast.show({
            message: `${tuiText("\u0426\u0435\u043B\u0435\u0432\u044B\u0435 \u044F\u0437\u044B\u043A\u0438", "Target Languages")}: ${input.trim()}`,
            variant: "success"
          });
        }
      } else if (picked === "engine") {
        const mode = await context.ui.dialog.select({
          title: tuiText("\u0420\u0435\u0436\u0438\u043C \u0434\u0432\u0438\u0436\u043A\u0430", "Engine Mode"),
          current: settings.engineMode,
          options: [{
            title: "Auto (Smart Hybrid)",
            value: "auto",
            description: tuiText("Google MT \u0434\u043B\u044F \u043F\u0440\u043E\u0441\u0442\u044B\u0445 \u0444\u0440\u0430\u0437, Session LLM \u0434\u043B\u044F \u0441\u043F\u0438\u0441\u043A\u043E\u0432 \u0438 \u043A\u043E\u0434\u0430", "Google MT for simple phrases, Session LLM for lists and code")
          }, {
            title: "Fast MT Only",
            value: "fast",
            description: tuiText("Google Translate / MyMemory \u0441 \u043D\u0443\u043B\u0435\u0432\u044B\u043C \u0440\u0430\u0441\u0445\u043E\u0434\u043E\u043C \u0442\u043E\u043A\u0435\u043D\u043E\u0432", "Google Translate / MyMemory with zero token usage")
          }, {
            title: "Session LLM Only",
            value: "llm",
            description: tuiText("\u0412\u0441\u0435\u0433\u0434\u0430 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0438\u0442\u044C \u043C\u043E\u0434\u0435\u043B\u044C\u044E \u0442\u0435\u043A\u0443\u0449\u0435\u0439 \u0441\u0435\u0441\u0441\u0438\u0438", "Always translate using active session model")
          }]
        });
        if (mode) {
          await updateSettings((draft) => {
            draft.engineMode = mode;
          });
          context.ui.toast.show({
            message: `${tuiText("\u0420\u0435\u0436\u0438\u043C", "Mode")}: ${mode.toUpperCase()}`,
            variant: "success"
          });
        }
      } else if (picked === "hotkeys") {
        const keyAction = await context.ui.dialog.select({
          title: tuiText("\u2328\uFE0F \u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430 \u0433\u043E\u0440\u044F\u0447\u0438\u0445 \u043A\u043B\u0430\u0432\u0438\u0448 TUI", "\u2328\uFE0F TUI Keybindings Settings"),
          options: [{
            title: `${tuiText("\u041F\u0435\u0440\u0435\u0432\u043E\u0434 \u0431\u0443\u0444\u0435\u0440\u0430", "Translate clipboard")}: [${formatKey(settings.keyClipboard || "alt+t")}]`,
            value: "clipboard",
            description: tuiText("\u041A\u043E\u043C\u0431\u0438\u043D\u0430\u0446\u0438\u044F \u0434\u043B\u044F \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430 \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u043D\u043E\u0433\u043E/\u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u043E\u0433\u043E \u0442\u0435\u043A\u0441\u0442\u0430 (\u043F\u043E \u0443\u043C\u043E\u043B\u0447.: alt+t)", "Key combination to translate selected/copied text (default: alt+t)")
          }, {
            title: `${tuiText("\u041F\u0435\u0440\u0435\u0432\u043E\u0434 \u043E\u0442\u0432\u0435\u0442\u0430 \u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442\u0430", "Translate assistant reply")}: [${formatKey(settings.keyLastTurn || "alt+shift+t")}]`,
            value: "last",
            description: tuiText("\u041A\u043E\u043C\u0431\u0438\u043D\u0430\u0446\u0438\u044F \u0434\u043B\u044F \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0435\u0433\u043E \u043E\u0442\u0432\u0435\u0442\u0430 \u043C\u043E\u0434\u0435\u043B\u0438 (\u043F\u043E \u0443\u043C\u043E\u043B\u0447.: alt+shift+t)", "Key combination to translate last model response (default: alt+shift+t)")
          }, {
            title: `${tuiText("\u0411\u043E\u043A\u043E\u0432\u0430\u044F \u043F\u0430\u043D\u0435\u043B\u044C", "Side panel")}: [${formatKey(settings.keyPanel || "alt+p")}]`,
            value: "panel",
            description: tuiText("\u041A\u043E\u043C\u0431\u0438\u043D\u0430\u0446\u0438\u044F \u0434\u043B\u044F \u043E\u0442\u043A\u0440\u044B\u0442\u0438\u044F/\u0437\u0430\u043A\u0440\u044B\u0442\u0438\u044F \u0431\u043E\u043A\u043E\u0432\u043E\u0439 \u043F\u0430\u043D\u0435\u043B\u0438 (\u043F\u043E \u0443\u043C\u043E\u043B\u0447.: alt+p)", "Key combination to open/close side panel (default: alt+p)")
          }, {
            title: tuiText("\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0445\u043E\u0442\u043A\u0435\u0438 \u043A \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044F\u043C", "Reset hotkeys to defaults"),
            value: "reset_keys",
            description: tuiText("\u0412\u0435\u0440\u043D\u0443\u0442\u044C alt+t, alt+shift+t, alt+p", "Reset to alt+t, alt+shift+t, alt+p")
          }]
        });
        if (keyAction === "clipboard") {
          const val = await context.ui.dialog.prompt({
            title: tuiText("\u0425\u043E\u0442\u043A\u0435\u0439: \u041F\u0435\u0440\u0435\u0432\u043E\u0434 \u0431\u0443\u0444\u0435\u0440\u0430 \u043E\u0431\u043C\u0435\u043D\u0430", "Hotkey: Translate Clipboard"),
            description: tuiText("\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043A\u043E\u043C\u0431\u0438\u043D\u0430\u0446\u0438\u044E \u043A\u043B\u0430\u0432\u0438\u0448 (\u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: alt+t, alt+y, ctrl+t, alt+c):", "Enter key combination (e.g.: alt+t, alt+y, ctrl+t, alt+c):"),
            value: settings.keyClipboard || "alt+t"
          });
          if (val && val.trim()) {
            const cleanKey = val.trim().toLowerCase();
            await updateSettings((draft) => {
              draft.keyClipboard = cleanKey;
            });
            context.ui.toast.show({
              message: `${tuiText("\u0425\u043E\u0442\u043A\u0435\u0439 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430 \u0431\u0443\u0444\u0435\u0440\u0430", "Clipboard hotkey")}: ${formatKey(cleanKey)}`,
              variant: "success"
            });
          }
        } else if (keyAction === "last") {
          const val = await context.ui.dialog.prompt({
            title: tuiText("\u0425\u043E\u0442\u043A\u0435\u0439: \u041F\u0435\u0440\u0435\u0432\u043E\u0434 \u043E\u0442\u0432\u0435\u0442\u0430 \u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442\u0430", "Hotkey: Translate Assistant Reply"),
            description: tuiText("\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043A\u043E\u043C\u0431\u0438\u043D\u0430\u0446\u0438\u044E \u043A\u043B\u0430\u0432\u0438\u0448 (\u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: alt+shift+t, alt+shift+y, ctrl+shift+t):", "Enter key combination (e.g.: alt+shift+t, alt+shift+y, ctrl+shift+t):"),
            value: settings.keyLastTurn || "alt+shift+t"
          });
          if (val && val.trim()) {
            const cleanKey = val.trim().toLowerCase();
            await updateSettings((draft) => {
              draft.keyLastTurn = cleanKey;
            });
            context.ui.toast.show({
              message: `${tuiText("\u0425\u043E\u0442\u043A\u0435\u0439 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0435\u0433\u043E \u043E\u0442\u0432\u0435\u0442\u0430", "Last reply hotkey")}: ${formatKey(cleanKey)}`,
              variant: "success"
            });
          }
        } else if (keyAction === "panel") {
          const val = await context.ui.dialog.prompt({
            title: tuiText("\u0425\u043E\u0442\u043A\u0435\u0439: \u0411\u043E\u043A\u043E\u0432\u0430\u044F \u043F\u0430\u043D\u0435\u043B\u044C \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430", "Hotkey: Translation Side Panel"),
            description: tuiText("\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043A\u043E\u043C\u0431\u0438\u043D\u0430\u0446\u0438\u044E \u043A\u043B\u0430\u0432\u0438\u0448 (\u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: alt+p, alt+o, ctrl+p):", "Enter key combination (e.g.: alt+p, alt+o, ctrl+p):"),
            value: settings.keyPanel || "alt+p"
          });
          if (val && val.trim()) {
            const cleanKey = val.trim().toLowerCase();
            await updateSettings((draft) => {
              draft.keyPanel = cleanKey;
            });
            context.ui.toast.show({
              message: `${tuiText("\u0425\u043E\u0442\u043A\u0435\u0439 \u0431\u043E\u043A\u043E\u0432\u043E\u0439 \u043F\u0430\u043D\u0435\u043B\u0438", "Side panel hotkey")}: ${formatKey(cleanKey)}`,
              variant: "success"
            });
          }
        } else if (keyAction === "reset_keys") {
          await updateSettings((draft) => {
            draft.keyClipboard = "alt+t";
            draft.keyLastTurn = "alt+shift+t";
            draft.keyPanel = "alt+p";
          });
          context.ui.toast.show({
            message: tuiText("\u0425\u043E\u0442\u043A\u0435\u0438 \u0441\u0431\u0440\u043E\u0448\u0435\u043D\u044B \u043A Alt+T, Alt+Shift+T, Alt+P", "Hotkeys reset to Alt+T, Alt+Shift+T, Alt+P"),
            variant: "info"
          });
        }
      } else if (picked === "reset") {
        await updateSettings((draft) => {
          Object.assign(draft, DEFAULT_TUI_SETTINGS);
        });
        context.ui.toast.show({
          message: tuiText("\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0441\u0431\u0440\u043E\u0448\u0435\u043D\u044B", "Settings reset to defaults"),
          variant: "info"
        });
      }
    }
    context.ui.slot({
      append: "app",
      render: () => {
        context.keymap.layer(() => ({
          mode: "global",
          priority: 20,
          commands: [{
            id: "translate.clipboard",
            title: tuiText("\u041F\u0435\u0440\u0435\u0432\u0435\u0441\u0442\u0438 \u0431\u0443\u0444\u0435\u0440 \u043E\u0431\u043C\u0435\u043D\u0430", "Translate clipboard selection"),
            group: tuiText("\u041F\u0435\u0440\u0435\u0432\u043E\u0434", "Translation"),
            bind: settings.keyClipboard || "alt+t",
            palette: true,
            slash: {
              name: "translate",
              aliases: ["tr"],
              arguments: true
            },
            suggested: true,
            run: async (input) => {
              await handleTranslateClipboard(input);
            }
          }, {
            id: "translate.last",
            title: tuiText("\u041F\u0435\u0440\u0435\u0432\u0435\u0441\u0442\u0438 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439 \u043E\u0442\u0432\u0435\u0442 \u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442\u0430", "Translate last assistant message"),
            group: tuiText("\u041F\u0435\u0440\u0435\u0432\u043E\u0434", "Translation"),
            bind: settings.keyLastTurn || "alt+shift+t",
            palette: true,
            slash: {
              name: "translate-last",
              aliases: ["trl"]
            },
            run: async () => {
              await handleTranslateLastTurn();
            }
          }, {
            id: "translate.panel",
            title: tuiText("\u041E\u0442\u043A\u0440\u044B\u0442\u044C/\u0437\u0430\u043A\u0440\u044B\u0442\u044C \u0431\u043E\u043A\u043E\u0432\u0443\u044E \u043F\u0430\u043D\u0435\u043B\u044C \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430", "Toggle translation side panel"),
            group: tuiText("\u041F\u0435\u0440\u0435\u0432\u043E\u0434", "Translation"),
            bind: settings.keyPanel || "alt+p",
            palette: true,
            slash: {
              name: "translate-panel",
              aliases: ["trp"]
            },
            run: () => {
              const current = context.ui.panel.current();
              if (current?.name === PANEL_NAME) {
                context.ui.panel.close();
              } else {
                if (!context.ui.panel.open(PANEL_NAME)) {
                  context.ui.toast.show({
                    message: tuiText("\u041E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 \u0441\u0435\u0441\u0441\u0438\u044E \u0434\u043B\u044F \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0430 \u0431\u043E\u043A\u043E\u0432\u043E\u0439 \u043F\u0430\u043D\u0435\u043B\u0438", "Open a session first to view side panel"),
                    variant: "warning"
                  });
                }
              }
            }
          }, {
            id: "translate.config",
            title: tuiText("\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430 (TUI)", "Translation settings (TUI)"),
            group: tuiText("\u041F\u0435\u0440\u0435\u0432\u043E\u0434", "Translation"),
            palette: true,
            slash: {
              name: "translate-config"
            },
            run: async () => {
              await handleConfig();
            }
          }]
        }));
        return null;
      }
    });
    context.ui.slot({
      append: "session.panel",
      render: (panel) => _$createComponent(Show, {
        get when() {
          return panel.name === PANEL_NAME;
        },
        get children() {
          return _$createComponent(TranslationPanel, {
            panel,
            context,
            settings: () => settings,
            latest,
            onTranslateClipboard: handleTranslateClipboard,
            onTranslateLast: handleTranslateLastTurn,
            onCycleEngineMode: handleCycleEngineMode,
            onCopyTranslation: handleCopyTranslation
          });
        }
      })
    });
  }
});
export {
  DEFAULT_TUI_SETTINGS,
  tui_default as default,
  formatKey,
  getSystemLocale,
  isRussianLocale,
  tuiText
};
