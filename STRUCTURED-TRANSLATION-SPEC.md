# Спецификация: Сохранение структуры и форматирования при переводе (Structured Translation)

> **Проект**: `opencode-translate-selection`  
> **Статус**: План-спецификация к реализации (Draft / Approved for Development)  
> **Дата**: 2026-10-28  

---

## 1. Проблема и контекст

### 1.1. Текущее поведение (как на скриншоте)
При выделении форматированного текста в таймлайне (например, блока с заголовком, буллетами, inline-кодом и жирным шрифтом):
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

При этом:
1. **Потеряны списки и переносы строк**: все пункты слиплись в одну непрерывную строку.
2. **Испорчен код**: `tools.opencode.models` капитализировался в `Tools.opencode.models`, аргументы `{ query: 'search' }` могут быть переведены или искажены.
3. **Потеряна визуальная иерархия**: нет выделения терминов (bold), отступов и буллетов.
4. **Неудобное копирование**: при клике копируется плоский текст без Markdown-разметки.

---

## 2. Анализ причин (Root Cause Analysis)

В текущей кодовой базе потеря структуры происходит на 4 последовательных этапах:

1. **Захват выделения (`src/popup.tsx:189`)**:
   ```ts
   const raw = selection.toString().replace(/\s+/g, " ").trim()
   ```
   Метод `replace(/\s+/g, " ")` целенаправленно схлопывает все переводы строк (`\n`), табуляции и отступы в одиночные пробелы ещё до отправки.

2. **Отсутствие защиты кода (Token Shielding)**:
   Текст отправляется в Google Translate «как есть». Переводчик пытается переводить программные идентификаторы, ключи параметров и имена функций.

3. **Склейка чанков на бэкенде (`src/translate.ts:101-104`)**:
   Возвращаемые Google Translate массивы строк просто соединяются через `join("")` и зачищаются через `.trim()`.

4. **Плоский рендеринг (`src/popup.tsx:307-309`)**:
   Тултип отрисовывает результат в единственном элементе `<span style={textStyle}>` без поддержки списков, параграфов и блочной вёрстки.

---

## 3. Целевая архитектура решения

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. DOM Range Capture (Window Context)                                  │
│    selection.getRangeAt(0).cloneContents()                             │
│    └─► Обход DOM-фрагмента: <ul>, <ol>, <li>, <h3>, <pre>, <code>, <p> │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. AST Extraction & Token Shielding                                    │
│    • Формирование списка блоков: Headings, Bullets, Ordered, Code      │
│    • Замена code / identifiers на токены: tools.foo() -> ⟦0⟧           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 3. Batch / Per-Block Translation (IPC -> Main Process)                 │
│    • Перевод только человеческого текста блоков (без маркеров -/1.)     │
│    • Кэширование по блокам (block-level LRU cache)                     │
│    • Multi-tier fallback (gtx -> dict-chrome-ex -> mymemory)           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 4. Unshielding & Reassembly                                            │
│    • Восстановление токенов ⟦0⟧ -> исходный код                        │
│    • Сборка структурированного AST с переводом                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 5. SolidJS Structured Popup Renderer & Markdown Copy                   │
│    • Визуализация: отступы, маркеры буллетов, стилизованный код        │
│    • Клик для копирования: Markdown с сохранением списка и fence       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Модель данных (TypeScript Contracts)

### 4.1. Типы блоков и сегментов

```ts
/** Тип блока контента */
export type BlockKind =
  | "paragraph"
  | "heading"
  | "bullet"
  | "ordered"
  | "quote"
  | "code"

/** Инлайн-сегмент внутри текстового блока */
export type InlineSegment =
  | { kind: "text"; text: string }
  | { kind: "strong"; text: string }
  | { kind: "code"; text: string } // Защищен от перевода
  | { kind: "link"; href?: string; text: string }

/** Структурный блок */
export interface StructuredBlock {
  id: string
  kind: BlockKind
  /** Уровень заголовка (1-6) или вложенности списка (0+) */
  level?: number
  /** Исходный индекс для нумерованного списка ("1.", "2." и т.д.) */
  orderedIndex?: string
  /** Язык программирования для блоков кода */
  codeLang?: string
  /** Инлайн-содержимое для текстовых блоков */
  inlines: InlineSegment[]
  /** Текст для перевода с плейсхолдерами ⟦0⟧ для защищенных сегментов */
  translatableText: string
  /** Защищенные токены, вырезанные перед переводом */
  shieldedTokens: string[]
  /** Переведенный текст (заполняется после ответа) */
  translatedText?: string
}

/** Документ выделения */
export interface StructuredSelection {
  isStructured: boolean
  blocks: StructuredBlock[]
  rawText: string
}
```

### 4.2. Обновленный IPC-контракт (`src/contract.ts`)

```ts
export interface TranslateBlockPayload {
  id: string
  text: string
}

export interface TranslateStructuredInput {
  blocks: TranslateBlockPayload[]
  targets: readonly string[]
}

export interface TranslateBlockResult {
  id: string
  lang: string
  text: string
  error?: string
}

export interface TranslateStructuredOutput {
  detected: string
  results: Record<string, TranslateBlockResult[]> // key: blockId
}
```

---

## 5. Детализация компонентов реализации

### 5.1. DOM-сегментатор (`src/dom-segmenter.ts`)
Вместо вызова `selection.toString()` плагин анализирует `range.cloneContents()`:
- Элементы `LI` внутри `UL` → блок `bullet` (глубина рассчитывается по вложенности `UL/OL`).
- Элементы `LI` внутри `OL` → блок `ordered` с сохранением номера (`1.`, `2.` или парсинг атрибута `value`).
- Элементы `H1`–`H6` → блок `heading` с полем `level`.
- Элементы `PRE`, `PRE > CODE` → блок `code` (не отправляется в переводчик, отображается исходным текстом).
- Элементы `BLOCKQUOTE` → блок `quote`.
- Инлайн-узлы `STRONG`, `B` → сегмент `strong`.
- Инлайн-узлы `CODE` (внутри параграфа или списка) → сегмент `code` (защищается токеном).
- Обычные текстовые ноды → сегмент `text`.

**Фоллбэк для плоского текста**:
Если в выделении нет богатого DOM (например, выделен текст в теге `<pre>` или обычном `<div>`), работает регулярный построчный парсер:
- `^(\s*)([-*+]|\d+[.)])\s+(.*)$` → списки
- `^(#{1,6})\s+(.*)$` → заголовки
- `^>\s+(.*)$` → цитаты
- `` `([^`]+)` `` → инлайн-код

### 5.2. Экранирование кода и терминов (Token Shielding, `src/shield.ts`)
Чтобы переводчик не ломал `tools.opencode.models({ query: 'search' })`:
1. Все сегменты с `kind: "code"`, а также URL и специфичные конструкции (например, camelCase-пути и `@mentions`) заменяются на маркеры вида `⟦0⟧`, `⟦1⟧` (символы Mathematical White Square Brackets `U+27E6`/`U+27E7`, которые Google Translate и другие MT-системы обычно оставляют нетронутыми).
2. После получения перевода токены заменяются обратно на исходные значения.
3. Проводится проверка: если в переводе потерялся токен (например, MT его удалил или исказил), срабатывает мягкий фоллбэк без потери данных.

### 5.3. Перевод и батчинг (`src/translate.ts`)
- **Батчинг**: Тексты блоков объединяются через специальный разделитель `\n\n` для минимизации HTTP-запросов (1 запрос на язык вместо N запросов).
- **Сверка**: Ответ разбивается по разделителю; если число блоков в ответе совпало с запросом — перевод распределяется по блокам.
- **Откат (Graceful Fallback)**: Если переводчик склеил блоки или исказил разделители, система прозрачно откатывается на параллельный перевод через `Promise.allSettled` по отдельным блокам.
- **Кэширование**: LRU-кэш индексируется не по всему гигантскому выделению, а по хэшу каждого блока (`targetLang + "\0" + blockHash`). Повторные выделения списков со схожими пунктами отдаются из кэша мгновенно.

### 5.4. Блочный рендеринг в тултипе (`src/popup.tsx`)
Вместо одного `<span>` создается компонент `<StructuredView>`:

```tsx
<div class="translate-blocks-container" style={{ "max-height": "420px", "overflow-y": "auto" }}>
  <For each={blocks()}>
    {(block) => (
      <Switch>
        <Match when={block.kind === "heading"}>
          <div style={{ "font-weight": "700", "font-size": "13.5px", "margin": "6px 0 3px", "color": "#ffd75e" }}>
            {renderInlines(block)}
          </div>
        </Match>

        <Match when={block.kind === "bullet"}>
          <div style={{ "display": "flex", "gap": "6px", "padding-left": `${(block.level || 0) * 12}px`, "margin": "2px 0" }}>
            <span style={{ "color": "#c9a83f", "user-select": "none" }}>•</span>
            <div style={{ "flex": "1" }}>{renderInlines(block)}</div>
          </div>
        </Match>

        <Match when={block.kind === "ordered"}>
          <div style={{ "display": "flex", "gap": "6px", "padding-left": `${(block.level || 0) * 12}px`, "margin": "2px 0" }}>
            <span style={{ "color": "#c9a83f", "min-width": "16px", "user-select": "none" }}>{block.orderedIndex || "1."}</span>
            <div style={{ "flex": "1" }}>{renderInlines(block)}</div>
          </div>
        </Match>

        <Match when={block.kind === "code"}>
          <pre style={{ "background": "rgba(0,0,0,0.3)", "padding": "4px 8px", "border-radius": "4px", "font-family": "ui-monospace, monospace", "font-size": "11.5px" }}>
            <code>{block.rawText}</code>
          </pre>
        </Match>

        <Match when={block.kind === "paragraph"}>
          <p style={{ "margin": "3px 0" }}>{renderInlines(block)}</p>
        </Match>
      </Switch>
    )}
  </For>
</div>
```

Инлайн-код внутри списков рендерится как:
```tsx
<code style={{
  "background": "rgba(255, 215, 94, 0.12)",
  "padding": "1px 4px",
  "border-radius": "4px",
  "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
  "font-size": "0.92em"
}}>
  {segment.text}
</code>
```

### 5.5. Копирование в буфер обмена
При клике на перевод формируется валидный **Markdown**:
- Сохраняются маркеры `- ` и `1. `
- Сохраняются `**жирный**` и `` `код` ``
- Блоки кода оборачиваются в ` ``` `

---

## 6. Настройки в GUI (`/settings?tab=translate`)

На странице настроек плагина добавляются переключатели:
1. **Preserve formatting & lists** (по умолчанию: `true`) — распознавать списки, заголовки и абзацы.
2. **Protect code & identifiers** (по умолчанию: `true`) — защищать инлайн-код от искажения переводчиком.
3. **Max popup height** (слайдер 200px – 600px, по умолчанию `420px`) — ограничение высоты для многострочных списков с аккуратным скроллбаром.

---

## 7. Этапы реализации (Implementation Plan)

| Этап | Задача | Файлы | Результат |
|---|---|---|---|
| **Этап 1** | Модели данных и pure-парсеры | `src/types.ts`, `src/dom-segmenter.ts`, `src/text-segmenter.ts` | Извлечение блоков из `Range` и текстового буфера |
| **Этап 2** | Защита кода (Token Shielding) | `src/shield.ts`, `test/shield.test.ts` | Изоляция кодовых вставок токенами `⟦N⟧` и обратная подстановка |
| **Этап 3** | Бэкенд структурированного перевода | `src/contract.ts`, `src/translate.ts` | Пакетный перевод блоков, валидация демаркеров, кэш |
| **Этап 4** | SolidJS UI рендерер блоков | `src/popup.tsx`, `src/block-view.tsx` | Красивые буллеты, нумерация, отступы, monospace-код |
| **Этап 5** | Настройки и сборка Markdown | `src/settings.ts`, `src/settings-view.tsx` | Тогглы в GUI Settings, экспорт в буфер с Markdown |
| **Этап 6** | E2E верификация и тестирование | `test/*`, ручная проверка в OpenCode Desktop | Проверка 8 тест-кейсов из матрицы |

---

## 8. Матрица верификации (Test Cases)

1. **Кейс 1 (Скриншот пользователя)**: Заголовок `Key Features:` + 5 буллетов, внутри которых жирный заголовок и вызов `tools.opencode.models({ query: 'search' })`.  
   *Ожидание*: 1 заголовок, 5 буллетов с отступами, жирный текст переведен, код оставлен символьно точным.
2. **Кейс 2 (Вложенные списки)**: Список с 2 уровнями вложенности (`ul > li > ul > li`).  
   *Ожидание*: Корректный двойной отступ `24px` у дочерних пунктов.
3. **Кейс 3 (Нумерованный список)**: Список `1.`, `2.`, `3.`, выделенный начиная со 2-го пункта.  
   *Ожидание*: Сохранение нумерации `2.`, `3.`, а не сброс в `1.`.
4. **Кейс 4 (Инлайн-код и camelCase)**: Текст с `myVariableName`, `https://example.com`, `package.json`.  
   *Ожидание*: Технические сущности не переведены транслитом или искаженными словами.
5. **Кейс 5 (Чек-листы)**: Пункты вида `- [ ] todo` и `- [x] done`.  
   *Ожидание*: Сохранение маркеров чекбокса.
6. **Кейс 6 (Блок кода)**: Выделение захватывает кусок кода `if (x) { ... }`.  
   *Ожидание*: Отображение в `<pre><code>` без попытки перевода синтаксиса.
7. **Кейс 7 (Длинный список)**: Выделение из 15 пунктов.  
   *Ожидание*: Попап не выходит за границы экрана, включается внутренний скроллбар при достижении `max-height`.
8. **Кейс 8 (Копирование)**: Клик по тултипу.  
   *Ожидание*: В буфер попадает форматированный Markdown со всеми переносами строк и списками.
