# Спецификация: Гибридный структурированный перевод с автовыбором LLM и MT (Smart Hybrid Translation)

> **Проект**: `opencode-translate-selection`  
> **Статус**: Реализовано (Implemented, v0.2.0)  
> **Версия документа**: 2.0 (Hybrid LLM + Multi-tier MT)  
> **Дата**: 2026-10-28  

---

## 1. Проблема и контекст

### 1.1. Проблема текущего MT-пайплайна
При выделении форматированного текста в таймлайне OpenCode Desktop (заголовки, буллеты, inline-код, параметры функций):
```markdown
Key Features:
• Model-specific search: Use tools.opencode.models({ query: 'search' }) to discover search-capable models
• Web integration: Direct web search and content fetching
• Specialized search: Academic, biomedical, developer-focused search variants
• Browser automation: For web-based search interfaces
• Multi-source research: Firecrawl's structured data collection for comprehensive search
```

Пользователь видит в тултипе нечитаемую «кашу» из одного сплошного абзаца:
> `RU Ключевые особенности: Поиск по конкретной модели: используйте Tools.opencode.models({ query: 'search' }) для обнаружения моделей с возможностью поиска. Веб-интеграция: прямой веб-поиск и получение контента. Специализированный поиск: академические, биомедицинские варианты поиска, ориентированные на разработчиков. Автоматизация браузера: для поисковых веб-интерфейсов. Исследования из нескольких источников: сбор структурированных данных Firecrawl для комплексного поиска.`

**Причины:**
1. Обычные MT-движки (Google Translate `gtx`, MyMemory) обучены на обычном связном тексте: они склеивают списки в один абзац и пытаются переводить код (`tools.opencode.models` капитализируется в `Tools.opencode...`, параметры искажаются).
2. Текущий код `src/popup.tsx:189` дополнительно схлопывает все пробелы и `\n` через `.replace(/\s+/g, " ")` перед отправкой.

### 1.2. Решение: Гибридный Smart Translation
* **Короткие фразы и одиночные слова (90% выделений)** не требуют LLM — их мгновенно переводит бесплатный Google Translate за 80–120 мс без расхода токенов и нагрузки на локальный инференс.
* **Сложные структурированные блоки** (списки, код, буллеты, сниппеты) автоматически передаются в **LLM текущей сессии** (локальная модель `llama-server/llama-swap` или облачная) через встроенный API OpenCode `session.generate()`. Запрос выполняется **ВНЕ сессии** — история сообщений не засоряется, контекстное окно не тратится.
* **Отказоустойчивость (Fail-safe Fallback)**: если локальная LLM занята, отвечает дольше 3.5 секунд или вернула ошибку, плагин мгновенно и прозрачно откатывается на экранированный MT-пайплайн (Google `gtx` → `dict-chrome-ex` → `MyMemory`).

---

## 2. Архитектура решения

```
                             Пользователь выделил текст
                                        │
                                        ▼
                          isComplexFormattedText(raw)?
                         ┌──────────────┴──────────────┐
                         ▼ [НЕТ]                       ▼ [ДА]
                  (Слова / фразы)              (Списки / код / буллеты)
                         │                             │
                         │                   Режим: Auto или LLM?
                         │                             │
                         │                     ┌───────┴───────┐
                         │                     ▼ [Да]          ▼ [Режим: Fast MT]
                         │             LLM Текущей Сессии      │
                         │             (session.generate)      │
                         │             Таймаут: 3.5 сек        │
                         │                     │               │
                         │           ┌─────────┴─────────┐     │
                         │           ▼ [Успех < 3.5s]    ▼     │
                         │       Форматированный         │     │
                         │       Markdown-перевод        │     │
                         │           │             [Таймаут / Ошибка]
                         │           │                   │     │
                         ▼           │                   ▼     ▼
                ┌────────────────────┼────────────────────────────┐
                │                    │   Multi-Tier MT Fallback   │
                │                    │   • DOM Token Shielding ⟦N⟧│
                │                    │   • Tier 1: Google gtx     │
                │                    │   • Tier 2: dict-chrome-ex │
                │                    │   • Tier 3: MyMemory       │
                └────────────────────┼────────────────────────────┘
                                     │                 │
                                     ▼                 ▼
                         ┌────────────────────────────────────────┐
                         │ SolidJS Structured Popup Renderer      │
                         │ • Буллеты •, нумерация 1., отступы     │
                         │ • Защищенный инлайн-код в <code>       │
                         │ • Markdown-копирование в буфер         │
                         └────────────────────────────────────────┘
```

---

## 3. Ключевые компоненты

### 3.1. Детектор структуры контента (`src/detector.ts`)
Быстрая синхронная проверка выделенного текста перед выбором бэкенда:

```ts
export function isComplexFormattedText(raw: string): boolean {
  const trimmed = raw.trim()
  if (trimmed.length < 40 && !trimmed.includes("\n")) return false

  const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean)

  // 1. Наличие буллетов, номеров или дефисов в многострочном тексте
  if (lines.length >= 2) {
    const hasLists = lines.some((l) => /^([•\-*+]|\d+[.)]|\d+-\d+)\s/.test(l))
    const hasCodeFences = /`[^`]+`|```/.test(trimmed)
    const hasFunctionCalls = /\b[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*\(/.test(trimmed)
    if (hasLists || hasCodeFences || hasFunctionCalls) return true
  }

  // 2. Инлайн-код, идентификаторы параметров или JSON-фрагменты даже в коротком тексте
  if (/`{1,3}[^`]+`{1,3}/.test(trimmed)) return true
  if (/\{[\s\S]*:[ \t]*[\s\S]*\}/.test(trimmed)) return true // { query: 'search' }

  return false
}
```

### 3.2. Генерация через модель сессии вне истории (`src/llm-engine.ts`)
Использует штатный вызов SDK OpenCode:
`ctx.client.session.generate({ sessionID, prompt })` (HTTP `POST /api/session/{sessionID}/generate`).

**Преимущества метода:**
1. Не создает сообщений в базе данных `opencode.db`.
2. Не модифицирует контекст текущей беседы.
3. Использует ту модель, которую пользователь уже выбрал для текущего проекта/сессии (локальная `Mirai-S-27B`, `bonsai` на `llama-swap` или облачная).
4. Нативно понимает синтаксис языков программирования, Markdown-разметку и имена функций без искажений.

**Строгий контракт системного промпта:**
```text
Translate the following text to ${targetLanguageName}.
Strict rules:
1. Preserve all formatting, bullet markers, numbered steps, indentations, and line breaks exactly as in the original.
2. DO NOT translate, change, or rename code, function calls, parameters, variable names, or technical identifiers (e.g. `tools.opencode.models({ query: 'search' })`).
3. Return ONLY the translation. Never add introductory text, commentary, or extra wrapping markdown fences.

Text to translate:
${text}
```

**Таймаут и отмена (AbortController):**
Для запроса выделяется контролируемый слот времени (по умолчанию **3500 мс**). Если локальный сервер занят генерацией в основном окне или модель отвечает медленно, `AbortController` прерывает вызов, и плагин мгновенно переключается на MT-фоллбэк.

### 3.3. Резервный MT-пайплайн с экранированием кода (`src/shield.ts` + `src/translate.ts`)
Если LLM недоступна или отключена:
1. **Token Shielding**: Перед отправкой в Google Translate все участки инлайн-кода `` `code` ``, camelCase-идентификаторы и параметры заменяются на математические белые скобки `⟦0⟧`, `⟦1⟧` (`U+27E6`/`U+27E7`).
2. Google Translate переводит связный текст, оставляя маркеры `⟦0⟧` нетронутыми.
3. В ответе токены `⟦0⟧` разворачиваются обратно в исходный нетронутый код.
4. При сбое gtx срабатывают вторичные слои: `dict-chrome-ex` и `MyMemory API`.

### 3.4. Структурированный рендерер тултипа (`src/block-view.tsx` & `src/popup.tsx`)
Вместо одного плоского `<span>`:
* Буллеты рендерятся списком с аккуратными маркерами `•` и отступами.
* Нумерованные пункты сохраняют свой порядок (`1.`, `2.`...).
* Инлайн-код подсвечивается моноширинным шрифтом на подложке:
  `<code style={{ background: "rgba(255, 215, 94, 0.12)", "border-radius": "4px", padding: "1px 4px" }}>`.
* Включается вертикальный скролл (`max-height: 420px`) для длинных списков.
* Копирование по клику копирует форматированный Markdown.

---

## 4. Обновленная модель данных и контракты

### 4.1. Настройки плагина (`src/settings.ts`)

```ts
export type EngineMode = "auto" | "fast" | "llm"

export interface PluginSettings {
  // Движок и роутинг
  engineMode: EngineMode       // "auto" (по умолчанию), "fast", "llm"
  llmTimeoutMs: number         // Таймаут ожидания LLM до фоллбэка на MT (по умолчанию: 3500)
  
  // Языки
  targets: string              // "ru, en"
  dropSourceLang: boolean      // true
  
  // Геометрия и стиль
  clearance: number            // 52
  bgColor: string              // "#2b220a"
  bgOpacity: number            // 97
  textColor: string            // "#ffd75e"
  accentColor: string          // "#c9a83f"
  borderRadius: number         // 10
  fontSize: number             // 12.5
  maxWidth: number             // 560
  maxHeight: number            // 420 (новое: ограничение высоты для списков)
  
  // Поведение
  debounceMs: number           // 140
  maxChars: number             // 1500 (увеличено для поддержки списков)
}

export const DEFAULT_SETTINGS: PluginSettings = {
  engineMode: "auto",
  llmTimeoutMs: 3500,
  targets: "ru, en",
  dropSourceLang: true,
  clearance: 52,
  bgColor: "#2b220a",
  bgOpacity: 97,
  textColor: "#ffd75e",
  accentColor: "#c9a83f",
  borderRadius: 10,
  fontSize: 12.5,
  maxWidth: 560,
  maxHeight: 420,
  debounceMs: 140,
  maxChars: 1500,
}
```

### 4.2. IPC-контракт между Window и Main Process (`src/contract.ts`)

```ts
import { Schema } from "effect"

export interface TranslateRequest {
  text: string
  targets: readonly string[]
  sessionID?: string
  engineMode?: "auto" | "fast" | "llm"
  llmTimeoutMs?: number
}

export interface TranslateItem {
  lang: string
  text: string
  engineUsed: "llm" | "gtx" | "dict-chrome-ex" | "mymemory"
  error?: string
}

export interface TranslateResponse {
  detected: string
  results: TranslateItem[]
}
```

---

## 5. Графический интерфейс настроек (`/settings?tab=translate`)

В существующую страницу настроек добавляется новый раздел:

```
┌────────────────────────────────────────────────────────────────────────┐
│ Translation Engine                                                     │
├────────────────────────────────────────────────────────────────────────┤
│ Engine Mode                                       [ Auto (Smart) ▼ ]   │
│ • Auto: Fast MT for phrases, Session LLM for structured lists & code.   │
│ • Fast MT: Always use Google/MyMemory (fastest, no LLM usage).         │
│ • Session LLM: Always translate via current active session model.      │
│                                                                        │
│ LLM Fallback Timeout (3.5s)                   [───────●──────────]     │
│ Fallback to Google MT if the model does not respond within this window.│
│                                                                        │
│ Max Popup Height (420px)                      [───────────●──────]     │
│ Prevents large multi-line lists from overflowing the display.          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Пошаговый план реализации (Action Plan)

| Этап | Задача | Файлы | Результат |
|---|---|---|---|
| **Этап 1** | Детектор структуры контента | `src/detector.ts`, тесты | Быстрое разделение простых фраз и списков/кода |
| **Этап 2** | LLM-адаптер вне сессии | `src/llm-engine.ts` | Вызов `ctx.client.session.generate()` с промптом и таймаутом |
| **Этап 3** | Token Shielding для MT-фоллбэка | `src/shield.ts` | Изоляция инлайн-кода токенами `⟦N⟧` для Google Translate |
| **Этап 4** | Гибридный роутер переводов | `src/translate.ts`, `src/contract.ts` | Связка: Проверка → LLM → Fallback MT → Кэш |
| **Этап 5** | Блочный SolidJS UI рендерер | `src/popup.tsx`, `src/block-view.tsx` | Буллеты, monospace-код, отступы и Markdown-копирование |
| **Этап 6** | Обновление настроек в GUI | `src/settings.ts`, `src/settings-view.tsx` | Переключатель Engine Mode, слайдер таймаута, maxHeight |
| **Этап 7** | Тестирование и E2E верификация | `test/*`, OpenCode Desktop | Прогон тестовой матрицы из 8 кейсов |

---

## 7. Матрица верификации (Test Matrix)

1. **Кейс 1: Короткое слово / фраза (Fast Path)**
   * Выделение: `"Model-specific search"`
   * Маршрут: `isComplexFormattedText() === false` → Google Translate.
   * Ожидание: Ответ за <150 мс, статус `engineUsed: "gtx"`, LLM не вызывается.
2. **Кейс 2: Списочная структура с кодом (LLM Path — кейс пользователя)**
   * Выделение: Блок со скриншота (заголовок + 5 буллетов с `tools.opencode.models({ query: 'search' })`).
   * Маршрут: `isComplexFormattedText() === true` → `session.generate()`.
   * Ожидание: Буллеты сохранены построчно, `tools.opencode.models` остался без искажений регистра, `query: 'search'` не переведен.
3. **Кейс 3: Отсутствие загрязнения сессии (No Context Pollution)**
   * Действие: Выполнение 5 переводов через LLM.
   * Ожидание: В сессии не появилось ни одного сообщения (`message.list` пуст), контекстное окно не изменилось.
4. **Кейс 4: Автоматический фоллбэк при таймауте LLM**
   * Условие: Симуляция задержки LLM > 3500 мс (или локальный инференс перегружен).
   * Ожидание: Срабатывание `AbortController`, мгновенный бесшовный перевод через экранированный Google Translate (`engineUsed: "gtx"`), тултип не зависает.
5. **Кейс 5: Работа при отсутствии активной сессии**
   * Условие: Выделение текста в боковой панели или системном меню без открытой сессии (`sessionID === undefined`).
   * Ожидание: Автоматическое переключение на Google Translate.
6. **Кейс 6: Копирование Markdown**
   * Действие: Клик по тултипу со структурированным переводом.
   * Ожидание: В буфер обмена копируется валидный многострочный Markdown с `- ` и бэктиками кода.
7. **Кейс 7: Скроллинг длинных списков**
   * Выделение: Список из 15 пунктов.
   * Ожидание: Тултип не выходит за пределы экрана, активируется внутренний скроллбар при достижении `maxHeight: 420px`.
8. **Кейс 8: Офлайн-устойчивость**
   * Условие: Сеть отключена, но работает локальный `llama-server`.
   * Ожидание: Списки и форматированный текст успешно переводятся локальной моделью без обращения к интернету.
