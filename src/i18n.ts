export type SupportedLocale = "en" | "ru" | "zh" | "de" | "es" | "fr" | "ja"

export type TranslationParams = Record<string, string | number | boolean>

export const I18N_EN = {
  // Core translation popup
  "translate.loading": "Translating…",
  "translate.failed": "Translation failed",
  "translate.truncated": "selection trimmed",
  "translate.copy": "click a line to copy",
  "translate.copied": "copied",
  "settings.title": "Translation",

  // Settings Header
  "settings.header.title": "Translation Tooltip Settings",
  "settings.header.desc": "Customize the inline translation popup appearance, target languages, positioning, and behavior.",

  // Preview
  "settings.preview.title": "Live Preview",
  "settings.preview.sampleTitle": "Key features:",
  "settings.preview.sampleBullet": "Search by model: ",
  "settings.preview.langTag": "EN",

  // Presets
  "settings.presets.title": "Theme Presets",
  "settings.preset.amber": "Amber Gold",
  "settings.preset.midnight": "Midnight OLED",
  "settings.preset.monokai": "Cyberpunk",
  "settings.preset.nordic": "Nordic Slate",
  "settings.preset.light": "Paper Light",

  // Translation Engine
  "settings.engine.title": "Translation Engine",
  "settings.engine.mode.label": "Engine Mode",
  "settings.engine.mode.auto": "Auto (Smart)",
  "settings.engine.mode.fast": "Fast MT",
  "settings.engine.mode.llm": "Session LLM",
  "settings.engine.mode.autoDesc": "Auto (Smart): Google MT for phrases, Session LLM for lists & code",
  "settings.engine.mode.fastDesc": "Fast MT Only: Always use Google / MyMemory (fastest, zero LLM usage)",
  "settings.engine.mode.llmDesc": "Session LLM Only: Always translate using active session's model",
  "settings.engine.timeout.label": "LLM Fallback Timeout ({{seconds}}s)",
  "settings.engine.timeout.desc": "Maximum wait time before falling back to Google Translate",

  // Languages
  "settings.languages.title": "Languages",
  "settings.languages.targets.label": "Target Languages",
  "settings.languages.targets.desc": "Comma-separated ISO language codes (e.g. ru, en, de, fr, es, zh)",
  "settings.languages.codesLink.text": "List of ISO 639-1 language codes",
  "settings.languages.codesLink.url": "https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes",

  // Colors & Style
  "settings.appearance.title": "Colors & Style",
  "settings.appearance.bgColor.label": "Background Color",
  "settings.appearance.bgColor.desc": "Base background tone",
  "settings.appearance.bgOpacity.label": "Background Opacity ({{opacity}}%)",
  "settings.appearance.bgOpacity.desc": "Transparency of the tooltip backdrop",
  "settings.appearance.textColor.label": "Translation Text Color",
  "settings.appearance.textColor.desc": "Main translation text",
  "settings.appearance.accentColor.label": "Accent & Badge Color",
  "settings.appearance.accentColor.desc": "Color for language tag badges and border highlights",

  // Position & Dimensions
  "settings.dimensions.title": "Position & Dimensions",
  "settings.dimensions.clearance.label": "Quote Clearance ({{clearance}}px)",
  "settings.dimensions.clearance.desc": "Height offset above the native Quote toolbar",
  "settings.dimensions.radius.label": "Corner Radius ({{radius}}px)",
  "settings.dimensions.radius.desc": "Roundness of the popup corners",
  "settings.dimensions.fontSize.label": "Font Size ({{size}}px)",
  "settings.dimensions.fontSize.desc": "Size of the translation text",
  "settings.dimensions.maxWidth.label": "Maximum Width ({{width}}px)",
  "settings.dimensions.maxWidth.desc": "Maximum width before text wraps",
  "settings.dimensions.maxHeight.label": "Maximum Height ({{height}}px)",
  "settings.dimensions.maxHeight.desc": "Maximum height before scrollbar appears for multi-line lists",

  // Behavior
  "settings.behavior.title": "Behavior",
  "settings.behavior.debounce.label": "Selection Delay ({{delay}}ms)",
  "settings.behavior.debounce.desc": "Delay after releasing mouse before requesting translation",
  "settings.behavior.maxChars.label": "Maximum Characters ({{chars}})",
  "settings.behavior.maxChars.desc": "Selections longer than this will be trimmed",

  // TUI Keybindings
  "settings.tui.title": "Terminal (TUI) Keybindings",
  "settings.tui.desc": "Customize hotkeys for OpenCode running in the terminal. If your terminal emulator (e.g. Ghostty, iTerm2, Alacritty) intercepts Alt+T or other system keys, you can specify any alternative key combinations here (e.g. alt+y, ctrl+t, alt+c).",
  "settings.tui.keyClipboard.label": "Translate Clipboard Hotkey",
  "settings.tui.keyClipboard.desc": "Default: alt+t (or custom, e.g. alt+y, ctrl+t)",
  "settings.tui.keyLastTurn.label": "Translate Last Assistant Turn Hotkey",
  "settings.tui.keyLastTurn.desc": "Default: alt+shift+t (e.g. alt+shift+y, ctrl+shift+t)",
  "settings.tui.keyPanel.label": "Toggle Side Panel Hotkey",
  "settings.tui.keyPanel.desc": "Default: alt+p (e.g. alt+o, ctrl+p)",

  // Reset
  "settings.reset": "Reset to Defaults",

  // TUI Commands
  "tui.command.clipboard": "Translate clipboard selection",
  "tui.command.last": "Translate last assistant message",
  "tui.command.panel": "Toggle translation side panel",
  "tui.command.config": "Translation settings",
}

export type I18nKey = keyof typeof I18N_EN

export const I18N_RU: Record<I18nKey, string> = {
  // Core translation popup
  "translate.loading": "Перевод…",
  "translate.failed": "Не удалось перевести",
  "translate.truncated": "выделение обрезано",
  "translate.copy": "клик по строке — копировать",
  "translate.copied": "скопировано",
  "settings.title": "Переводчик",

  // Settings Header
  "settings.header.title": "Настройки всплывающего переводчика",
  "settings.header.desc": "Настройте внешний вид всплывающего окна перевода, целевые языки, позиционирование и поведение.",

  // Preview
  "settings.preview.title": "Интерактивный предпросмотр",
  "settings.preview.sampleTitle": "Ключевые особенности:",
  "settings.preview.sampleBullet": "Поиск по модели: ",
  "settings.preview.langTag": "RU",

  // Presets
  "settings.presets.title": "Готовые темы оформления",
  "settings.preset.amber": "Янтарное золото",
  "settings.preset.midnight": "Полночный OLED",
  "settings.preset.monokai": "Киберпанк",
  "settings.preset.nordic": "Северный сланец",
  "settings.preset.light": "Светлая бумага",

  // Translation Engine
  "settings.engine.title": "Движок перевода",
  "settings.engine.mode.label": "Режим движка",
  "settings.engine.mode.auto": "Авто (Умный)",
  "settings.engine.mode.fast": "Быстрый MT",
  "settings.engine.mode.llm": "LLM сессии",
  "settings.engine.mode.autoDesc": "Авто (Умный): Google MT для простых фраз, LLM активной сессии для списков и кода",
  "settings.engine.mode.fastDesc": "Только быстрый MT: всегда использовать Google / MyMemory (быстрее всего, 0 токенов LLM)",
  "settings.engine.mode.llmDesc": "Только LLM сессии: всегда переводить моделью текущей активной сессии",
  "settings.engine.timeout.label": "Таймаут ожидания LLM ({{seconds}} с)",
  "settings.engine.timeout.desc": "Максимальное время ожидания ответа LLM перед переключением на Google Translate",

  // Languages
  "settings.languages.title": "Языки",
  "settings.languages.targets.label": "Целевые языки",
  "settings.languages.targets.desc": "Коды языков ISO через запятую (например: ru, en, de, fr, es, zh)",
  "settings.languages.codesLink.text": "Список двухбуквенных кодов языков (ISO 639-1)",
  "settings.languages.codesLink.url": "https://ru.wikipedia.org/wiki/Список_кодов_ISO_639-1",

  // Colors & Style
  "settings.appearance.title": "Цвета и оформление",
  "settings.appearance.bgColor.label": "Цвет фона",
  "settings.appearance.bgColor.desc": "Основной тон фона всплывающего окна",
  "settings.appearance.bgOpacity.label": "Непрозрачность фона ({{opacity}}%)",
  "settings.appearance.bgOpacity.desc": "Степень прозрачности подложки всплывающего окна",
  "settings.appearance.textColor.label": "Цвет текста перевода",
  "settings.appearance.textColor.desc": "Цвет основного текста перевода",
  "settings.appearance.accentColor.label": "Цвет акцентов и бейджей",
  "settings.appearance.accentColor.desc": "Цвет меток языков и рамки всплывающего окна",

  // Position & Dimensions
  "settings.dimensions.title": "Положение и размеры",
  "settings.dimensions.clearance.label": "Отступ от панели цитирования ({{clearance}}px)",
  "settings.dimensions.clearance.desc": "Смещение окна перевода по высоте над встроенной панелью Quote",
  "settings.dimensions.radius.label": "Радиус скругления ({{radius}}px)",
  "settings.dimensions.radius.desc": "Степень скругления углов всплывающего окна",
  "settings.dimensions.fontSize.label": "Размер шрифта ({{size}}px)",
  "settings.dimensions.fontSize.desc": "Размер шрифта переведённого текста",
  "settings.dimensions.maxWidth.label": "Максимальная ширина ({{width}}px)",
  "settings.dimensions.maxWidth.desc": "Предельная ширина окна до переноса текста на новую строку",
  "settings.dimensions.maxHeight.label": "Максимальная высота ({{height}}px)",
  "settings.dimensions.maxHeight.desc": "Предельная высота окна до появления полосы прокрутки",

  // Behavior
  "settings.behavior.title": "Поведение",
  "settings.behavior.debounce.label": "Задержка после выделения ({{delay}} мс)",
  "settings.behavior.debounce.desc": "Пауза после отпускания кнопки мыши перед запросом перевода",
  "settings.behavior.maxChars.label": "Лимит символов ({{chars}})",
  "settings.behavior.maxChars.desc": "Текст длиннее этого значения будет аккуратно обрезан",

  // TUI Keybindings
  "settings.tui.title": "Горячие клавиши терминала (TUI)",
  "settings.tui.desc": "Настройте комбинации клавиш для терминальной версии OpenCode. Если ваш эмулятор терминала (например, Ghostty, iTerm2, Alacritty) перехватывает Alt+T или другие системные клавиши, укажите альтернативные комбинации (например: alt+y, ctrl+t, alt+c).",
  "settings.tui.keyClipboard.label": "Хоткей перевода буфера обмена",
  "settings.tui.keyClipboard.desc": "По умолчанию: alt+t (или альтернатива: alt+y, ctrl+t)",
  "settings.tui.keyLastTurn.label": "Хоткей перевода последнего ответа ассистента",
  "settings.tui.keyLastTurn.desc": "По умолчанию: alt+shift+t (например: alt+shift+y, ctrl+shift+t)",
  "settings.tui.keyPanel.label": "Хоткей боковой панели перевода",
  "settings.tui.keyPanel.desc": "По умолчанию: alt+p (например: alt+o, ctrl+p)",

  // Reset
  "settings.reset": "Сбросить к умолчаниям",

  // TUI Commands
  "tui.command.clipboard": "Перевести буфер обмена",
  "tui.command.last": "Перевести последний ответ ассистента",
  "tui.command.panel": "Открыть/закрыть боковую панель перевода",
  "tui.command.config": "Настройки перевода",
}

export const I18N_ZH: Record<I18nKey, string> = {
  "translate.loading": "翻译中…",
  "translate.failed": "翻译失败",
  "translate.truncated": "已截断选中文本",
  "translate.copy": "点击某行进行复制",
  "translate.copied": "已复制",
  "settings.title": "翻译设置",

  "settings.header.title": "划词翻译弹窗设置",
  "settings.header.desc": "自定义浮动翻译弹窗的外观、目标语言、位置与交互行为。",

  "settings.preview.title": "实时预览",
  "settings.preview.sampleTitle": "核心特性：",
  "settings.preview.sampleBullet": "按模型搜索： ",
  "settings.preview.langTag": "ZH",

  "settings.presets.title": "预设主题",
  "settings.preset.amber": "琥珀金",
  "settings.preset.midnight": "午夜 OLED",
  "settings.preset.monokai": "赛博朋克",
  "settings.preset.nordic": "北欧板岩",
  "settings.preset.light": "浅色纸张",

  "settings.engine.title": "翻译引擎",
  "settings.engine.mode.label": "引擎模式",
  "settings.engine.mode.auto": "自动 (智能)",
  "settings.engine.mode.fast": "快速机器翻译",
  "settings.engine.mode.llm": "会话 LLM",
  "settings.engine.mode.autoDesc": "自动 (智能)：普通短语走 Google MT，列表和代码块调用会话模型",
  "settings.engine.mode.fastDesc": "仅快速机器翻译：始终使用 Google / MyMemory（最快，不消耗 LLM 额度）",
  "settings.engine.mode.llmDesc": "仅会话 LLM：始终使用当前活动会话的模型进行翻译",
  "settings.engine.timeout.label": "LLM 回退超时时间 ({{seconds}}秒)",
  "settings.engine.timeout.desc": "会话模型未响应时，回退到 Google 翻译的最大等待时间",

  "settings.languages.title": "语言",
  "settings.languages.targets.label": "目标语言",
  "settings.languages.targets.desc": "逗号分隔的 ISO 语言代码（例如：zh, en, ru, de, fr, es, ja）",
  "settings.languages.codesLink.text": "ISO 639-1 语言代码列表",
  "settings.languages.codesLink.url": "https://zh.wikipedia.org/wiki/ISO_639-1代码列表",

  "settings.appearance.title": "色彩与样式",
  "settings.appearance.bgColor.label": "背景颜色",
  "settings.appearance.bgColor.desc": "弹窗的基础背景色调",
  "settings.appearance.bgOpacity.label": "背景不透明度 ({{opacity}}%)",
  "settings.appearance.bgOpacity.desc": "弹窗背景的透明度",
  "settings.appearance.textColor.label": "译文文本颜色",
  "settings.appearance.textColor.desc": "主要译文的文字颜色",
  "settings.appearance.accentColor.label": "强调与徽章颜色",
  "settings.appearance.accentColor.desc": "语言标签徽章和边框高亮的颜色",

  "settings.dimensions.title": "位置与尺寸",
  "settings.dimensions.clearance.label": "引用栏安全边距 ({{clearance}}px)",
  "settings.dimensions.clearance.desc": "浮动翻译弹窗在原生 Quote 工具栏上方的垂直偏移距离",
  "settings.dimensions.radius.label": "圆角半径 ({{radius}}px)",
  "settings.dimensions.radius.desc": "弹窗边角的圆润程度",
  "settings.dimensions.fontSize.label": "字体大小 ({{size}}px)",
  "settings.dimensions.fontSize.desc": "翻译文本的字体大小",
  "settings.dimensions.maxWidth.label": "最大宽度 ({{width}}px)",
  "settings.dimensions.maxWidth.desc": "文本自动换行前的最大弹窗宽度",
  "settings.dimensions.maxHeight.label": "最大高度 ({{height}}px)",
  "settings.dimensions.maxHeight.desc": "长列表和长文本出现滚动条前的最大高度",

  "settings.behavior.title": "交互与行为",
  "settings.behavior.debounce.label": "取词延迟 ({{delay}}毫秒)",
  "settings.behavior.debounce.desc": "松开鼠标后触发翻译请求的等待时间",
  "settings.behavior.maxChars.label": "最大字符数限制 ({{chars}})",
  "settings.behavior.maxChars.desc": "超过该长度的选中文本将被自动截断",

  "settings.tui.title": "终端 (TUI) 快捷键设置",
  "settings.tui.desc": "自定义在终端中运行 OpenCode 时的快捷键。若终端模拟器（如 Ghostty、iTerm2、Alacritty）拦截了 Alt+T 或其他系统快捷键，可在此指定替代组合（例如 alt+y、ctrl+t、alt+c）。",
  "settings.tui.keyClipboard.label": "翻译剪贴板快捷键",
  "settings.tui.keyClipboard.desc": "默认：alt+t（或自定义，如 alt+y, ctrl+t）",
  "settings.tui.keyLastTurn.label": "翻译助手最近一条回复快捷键",
  "settings.tui.keyLastTurn.desc": "默认：alt+shift+t（例如 alt+shift+y, ctrl+shift+t）",
  "settings.tui.keyPanel.label": "切换翻译侧边栏快捷键",
  "settings.tui.keyPanel.desc": "默认：alt+p（例如 alt+o, ctrl+p）",

  "settings.reset": "恢复默认设置",

  "tui.command.clipboard": "翻译剪贴板内容",
  "tui.command.last": "翻译最后一条助手消息",
  "tui.command.panel": "切换翻译侧边栏",
  "tui.command.config": "翻译设置",
}

export const I18N_DE: Record<I18nKey, string> = {
  "translate.loading": "Wird übersetzt…",
  "translate.failed": "Übersetzung fehlgeschlagen",
  "translate.truncated": "Auswahl gekürzt",
  "translate.copy": "Zeile zum Kopieren anklicken",
  "translate.copied": "kopiert",
  "settings.title": "Übersetzung",

  "settings.header.title": "Einstellungen für Übersetzungs-Tooltip",
  "settings.header.desc": "Passen Sie das Erscheinungsbild des Übersetzungs-Popups, Zielsprachen, Positionierung und Verhalten an.",

  "settings.preview.title": "Live-Vorschau",
  "settings.preview.sampleTitle": "Wichtigste Funktionen:",
  "settings.preview.sampleBullet": "Nach Modell suchen: ",
  "settings.preview.langTag": "DE",

  "settings.presets.title": "Farbthemen-Voreinstellungen",
  "settings.preset.amber": "Bernsteingold",
  "settings.preset.midnight": "Mitternacht OLED",
  "settings.preset.monokai": "Cyberpunk",
  "settings.preset.nordic": "Nordischer Schiefer",
  "settings.preset.light": "Helles Papier",

  "settings.engine.title": "Übersetzungs-Engine",
  "settings.engine.mode.label": "Engine-Modus",
  "settings.engine.mode.auto": "Auto (Smart)",
  "settings.engine.mode.fast": "Schnelles MT",
  "settings.engine.mode.llm": "Sitzungs-LLM",
  "settings.engine.mode.autoDesc": "Auto (Smart): Google MT für Phrasen, Sitzungs-LLM für Listen & Code",
  "settings.engine.mode.fastDesc": "Nur schnelles MT: Immer Google / MyMemory verwenden (am schnellsten, null LLM-Verbrauch)",
  "settings.engine.mode.llmDesc": "Nur Sitzungs-LLM: Immer mit dem Modell der aktiven Sitzung übersetzen",
  "settings.engine.timeout.label": "LLM-Fallback-Zeitlimit ({{seconds}}s)",
  "settings.engine.timeout.desc": "Maximale Wartezeit, bevor auf Google Translate zurückgegriffen wird",

  "settings.languages.title": "Sprachen",
  "settings.languages.targets.label": "Zielsprachen",
  "settings.languages.targets.desc": "Kommagetrennte ISO-Sprachcodes (z. B. de, en, ru, fr, es, zh)",
  "settings.languages.codesLink.text": "Liste der ISO-639-1-Sprachcodes",
  "settings.languages.codesLink.url": "https://de.wikipedia.org/wiki/Liste_der_ISO-639-1-Codes",

  "settings.appearance.title": "Farben & Stil",
  "settings.appearance.bgColor.label": "Hintergrundfarbe",
  "settings.appearance.bgColor.desc": "Grundton des Hintergrunds",
  "settings.appearance.bgOpacity.label": "Hintergrund-Deckkraft ({{opacity}}%)",
  "settings.appearance.bgOpacity.desc": "Transparenz des Tooltip-Hintergrunds",
  "settings.appearance.textColor.label": "Textfarbe der Übersetzung",
  "settings.appearance.textColor.desc": "Haupttext der Übersetzung",
  "settings.appearance.accentColor.label": "Akzent- & Badge-Farbe",
  "settings.appearance.accentColor.desc": "Farbe für Sprach-Badges und Rahmen-Highlights",

  "settings.dimensions.title": "Position & Abmessungen",
  "settings.dimensions.clearance.label": "Abstand zur Zitatleiste ({{clearance}}px)",
  "settings.dimensions.clearance.desc": "Höhenversatz über der nativen Zitat-Symbolleiste",
  "settings.dimensions.radius.label": "Eckenradius ({{radius}}px)",
  "settings.dimensions.radius.desc": "Rundung der Popup-Ecken",
  "settings.dimensions.fontSize.label": "Schriftgröße ({{size}}px)",
  "settings.dimensions.fontSize.desc": "Größe des übersetzten Textes",
  "settings.dimensions.maxWidth.label": "Maximale Breite ({{width}}px)",
  "settings.dimensions.maxWidth.desc": "Maximale Breite vor dem Textumbruch",
  "settings.dimensions.maxHeight.label": "Maximale Höhe ({{height}}px)",
  "settings.dimensions.maxHeight.desc": "Maximale Höhe, bevor bei langen Listen eine Bildlaufleiste erscheint",

  "settings.behavior.title": "Verhalten",
  "settings.behavior.debounce.label": "Auswahlverzögerung ({{delay}}ms)",
  "settings.behavior.debounce.desc": "Verzögerung nach dem Loslassen der Maus vor der Übersetzungsanfrage",
  "settings.behavior.maxChars.label": "Maximale Zeichenanzahl ({{chars}})",
  "settings.behavior.maxChars.desc": "Längere Auswahlen werden gekürzt",

  "settings.tui.title": "Terminal (TUI) Tastenbelegungen",
  "settings.tui.desc": "Passen Sie die Tastenkombinationen für OpenCode im Terminal an. Wenn Ihr Terminal-Emulator (z. B. Ghostty, iTerm2, Alacritty) Alt+T oder andere Systemtasten abfängt, können Sie hier alternative Kombinationen festlegen (z. B. alt+y, ctrl+t, alt+c).",
  "settings.tui.keyClipboard.label": "Hotkey für Zwischenablage übersetzen",
  "settings.tui.keyClipboard.desc": "Standard: alt+t (oder z. B. alt+y, ctrl+t)",
  "settings.tui.keyLastTurn.label": "Hotkey für letzte Assistenten-Antwort übersetzen",
  "settings.tui.keyLastTurn.desc": "Standard: alt+shift+t (z. B. alt+shift+y, ctrl+shift+t)",
  "settings.tui.keyPanel.label": "Hotkey für Übersetzungspanel ein-/ausblenden",
  "settings.tui.keyPanel.desc": "Standard: alt+p (z. B. alt+o, ctrl+p)",

  "settings.reset": "Auf Standardwerte zurücksetzen",

  "tui.command.clipboard": "Zwischenablage übersetzen",
  "tui.command.last": "Letzte Assistenten-Nachricht übersetzen",
  "tui.command.panel": "Übersetzungs-Seitenleiste umschalten",
  "tui.command.config": "Übersetzungseinstellungen",
}

export const I18N_ES: Record<I18nKey, string> = {
  "translate.loading": "Traduciendo…",
  "translate.failed": "Error en la traducción",
  "translate.truncated": "selección recortada",
  "translate.copy": "haz clic en una línea para copiar",
  "translate.copied": "copiado",
  "settings.title": "Traducción",

  "settings.header.title": "Ajustes de la ventana emergente de traducción",
  "settings.header.desc": "Personaliza la apariencia de la ventana emergente de traducción, idiomas de destino, posición y comportamiento.",

  "settings.preview.title": "Vista previa en vivo",
  "settings.preview.sampleTitle": "Características clave:",
  "settings.preview.sampleBullet": "Buscar por modelo: ",
  "settings.preview.langTag": "ES",

  "settings.presets.title": "Temas preestablecidos",
  "settings.preset.amber": "Oro ámbar",
  "settings.preset.midnight": "OLED Medianoche",
  "settings.preset.monokai": "Ciberpunk",
  "settings.preset.nordic": "Pizarra nórdica",
  "settings.preset.light": "Papel claro",

  "settings.engine.title": "Motor de traducción",
  "settings.engine.mode.label": "Modo de motor",
  "settings.engine.mode.auto": "Auto (Inteligente)",
  "settings.engine.mode.fast": "MT rápido",
  "settings.engine.mode.llm": "LLM de sesión",
  "settings.engine.mode.autoDesc": "Auto (Inteligente): Google MT para frases, LLM de sesión para listas y código",
  "settings.engine.mode.fastDesc": "Solo MT rápido: usar siempre Google / MyMemory (más rápido, cero tokens LLM)",
  "settings.engine.mode.llmDesc": "Solo LLM de sesión: traducir siempre con el modelo de la sesión activa",
  "settings.engine.timeout.label": "Tiempo límite de espera de LLM ({{seconds}}s)",
  "settings.engine.timeout.desc": "Tiempo máximo de espera antes de recurrir a Google Translate",

  "settings.languages.title": "Idiomas",
  "settings.languages.targets.label": "Idiomas de destino",
  "settings.languages.targets.desc": "Códigos de idioma ISO separados por comas (p. ej. es, en, ru, fr, de, zh)",
  "settings.languages.codesLink.text": "Lista de códigos de idioma (ISO 639-1)",
  "settings.languages.codesLink.url": "https://es.wikipedia.org/wiki/ISO_639-1",

  "settings.appearance.title": "Colores y estilo",
  "settings.appearance.bgColor.label": "Color de fondo",
  "settings.appearance.bgColor.desc": "Tono de fondo base",
  "settings.appearance.bgOpacity.label": "Opacidad del fondo ({{opacity}}%)",
  "settings.appearance.bgOpacity.desc": "Transparencia del fondo emergente",
  "settings.appearance.textColor.label": "Color del texto de traducción",
  "settings.appearance.textColor.desc": "Texto principal de la traducción",
  "settings.appearance.accentColor.label": "Color de resaltado y etiquetas",
  "settings.appearance.accentColor.desc": "Color para etiquetas de idioma y resaltes de borde",

  "settings.dimensions.title": "Posición y dimensiones",
  "settings.dimensions.clearance.label": "Espacio sobre barra de citas ({{clearance}}px)",
  "settings.dimensions.clearance.desc": "Desplazamiento vertical sobre la barra de herramientas de citas nativa",
  "settings.dimensions.radius.label": "Radio de esquinas ({{radius}}px)",
  "settings.dimensions.radius.desc": "Redondez de las esquinas del cuadro emergente",
  "settings.dimensions.fontSize.label": "Tamaño de fuente ({{size}}px)",
  "settings.dimensions.fontSize.desc": "Tamaño del texto de la traducción",
  "settings.dimensions.maxWidth.label": "Ancho máximo ({{width}}px)",
  "settings.dimensions.maxWidth.desc": "Ancho máximo antes del ajuste de línea",
  "settings.dimensions.maxHeight.label": "Altura máxima ({{height}}px)",
  "settings.dimensions.maxHeight.desc": "Altura máxima antes de que aparezca la barra de desplazamiento",

  "settings.behavior.title": "Comportamiento",
  "settings.behavior.debounce.label": "Retardo tras selección ({{delay}}ms)",
  "settings.behavior.debounce.desc": "Pausa tras soltar el ratón antes de solicitar la traducción",
  "settings.behavior.maxChars.label": "Límite máximo de caracteres ({{chars}})",
  "settings.behavior.maxChars.desc": "Las selecciones más largas serán recortadas",

  "settings.tui.title": "Atajos de teclado en terminal (TUI)",
  "settings.tui.desc": "Personaliza los atajos de teclado para OpenCode en terminal. Si tu emulador de terminal (p. ej. Ghostty, iTerm2, Alacritty) intercepta Alt+T u otras teclas, puedes especificar combinaciones alternativas aquí (p. ej. alt+y, ctrl+t, alt+c).",
  "settings.tui.keyClipboard.label": "Atajo para traducir portapapeles",
  "settings.tui.keyClipboard.desc": "Predeterminado: alt+t (o personalizado, p. ej. alt+y, ctrl+t)",
  "settings.tui.keyLastTurn.label": "Atajo para traducir última respuesta del asistente",
  "settings.tui.keyLastTurn.desc": "Predeterminado: alt+shift+t (p. ej. alt+shift+y, ctrl+shift+t)",
  "settings.tui.keyPanel.label": "Atajo para alternar panel lateral de traducción",
  "settings.tui.keyPanel.desc": "Predeterminado: alt+p (p. ej. alt+o, ctrl+p)",

  "settings.reset": "Restablecer valores predeterminados",

  "tui.command.clipboard": "Traducir selección del portapapeles",
  "tui.command.last": "Traducir último mensaje del asistente",
  "tui.command.panel": "Alternar panel lateral de traducción",
  "tui.command.config": "Ajustes de traducción",
}

export const I18N_FR: Record<I18nKey, string> = {
  "translate.loading": "Traduction en cours…",
  "translate.failed": "Échec de la traduction",
  "translate.truncated": "sélection raccourcie",
  "translate.copy": "cliquer sur une ligne pour copier",
  "translate.copied": "copié",
  "settings.title": "Traduction",

  "settings.header.title": "Paramètres de l'infobulle de traduction",
  "settings.header.desc": "Personnalisez l'apparence du popup de traduction, les langues cibles, le positionnement et le comportement.",

  "settings.preview.title": "Aperçu en direct",
  "settings.preview.sampleTitle": "Fonctionnalités clés :",
  "settings.preview.sampleBullet": "Recherche par modèle : ",
  "settings.preview.langTag": "FR",

  "settings.presets.title": "Thèmes prédéfinis",
  "settings.preset.amber": "Or ambré",
  "settings.preset.midnight": "Minuit OLED",
  "settings.preset.monokai": "Cyberpunk",
  "settings.preset.nordic": "Ardoise nordique",
  "settings.preset.light": "Papier clair",

  "settings.engine.title": "Moteur de traduction",
  "settings.engine.mode.label": "Mode moteur",
  "settings.engine.mode.auto": "Auto (Intelligent)",
  "settings.engine.mode.fast": "MT rapide",
  "settings.engine.mode.llm": "LLM de session",
  "settings.engine.mode.autoDesc": "Auto (Intelligent) : Google MT pour les phrases, LLM de session pour les listes et le code",
  "settings.engine.mode.fastDesc": "MT rapide uniquement : toujours utiliser Google / MyMemory (le plus rapide, zéro jeton LLM)",
  "settings.engine.mode.llmDesc": "LLM de session uniquement : toujours traduire avec le modèle de la session active",
  "settings.engine.timeout.label": "Délai d'attente de repli LLM ({{seconds}}s)",
  "settings.engine.timeout.desc": "Temps d'attente maximal avant de basculer sur Google Traduction",

  "settings.languages.title": "Langues",
  "settings.languages.targets.label": "Langues cibles",
  "settings.languages.targets.desc": "Codes de langue ISO séparés par des virgules (ex. fr, en, ru, es, de, zh)",
  "settings.languages.codesLink.text": "Liste des codes de langue (ISO 639-1)",
  "settings.languages.codesLink.url": "https://fr.wikipedia.org/wiki/Liste_des_codes_ISO_639-1",

  "settings.appearance.title": "Couleurs et style",
  "settings.appearance.bgColor.label": "Couleur d'arrière-plan",
  "settings.appearance.bgColor.desc": "Teinte de fond de base",
  "settings.appearance.bgOpacity.label": "Opacité de l'arrière-plan ({{opacity}}%)",
  "settings.appearance.bgOpacity.desc": "Transparence de l'arrière-plan de l'infobulle",
  "settings.appearance.textColor.label": "Couleur du texte traduit",
  "settings.appearance.textColor.desc": "Texte principal de la traduction",
  "settings.appearance.accentColor.label": "Couleur d'accentuation et de badge",
  "settings.appearance.accentColor.desc": "Couleur des badges de langue et reflets de bordure",

  "settings.dimensions.title": "Position et dimensions",
  "settings.dimensions.clearance.label": "Dégagement de la barre de citation ({{clearance}}px)",
  "settings.dimensions.clearance.desc": "Décalage vertical au-dessus de la barre d'outils de citation native",
  "settings.dimensions.radius.label": "Rayon des coins ({{radius}}px)",
  "settings.dimensions.radius.desc": "Arrondi des coins du popup",
  "settings.dimensions.fontSize.label": "Taille de police ({{size}}px)",
  "settings.dimensions.fontSize.desc": "Taille du texte de traduction",
  "settings.dimensions.maxWidth.label": "Largeur maximale ({{width}}px)",
  "settings.dimensions.maxWidth.desc": "Largeur maximale avant retour à la ligne du texte",
  "settings.dimensions.maxHeight.label": "Hauteur maximale ({{height}}px)",
  "settings.dimensions.maxHeight.desc": "Hauteur maximale avant l'apparition de la barre de défilement",

  "settings.behavior.title": "Comportement",
  "settings.behavior.debounce.label": "Délai de sélection ({{delay}}ms)",
  "settings.behavior.debounce.desc": "Délai après avoir relâché la souris avant de demander la traduction",
  "settings.behavior.maxChars.label": "Nombre maximal de caractères ({{chars}})",
  "settings.behavior.maxChars.desc": "Les sélections plus longues seront raccourcies",

  "settings.tui.title": "Raccourcis clavier du terminal (TUI)",
  "settings.tui.desc": "Personnalisez les raccourcis pour OpenCode dans le terminal. Si votre émulateur de terminal (ex. Ghostty, iTerm2, Alacritty) intercepte Alt+T ou d'autres touches système, vous pouvez définir d'autres combinaisons ici (ex. alt+y, ctrl+t, alt+c).",
  "settings.tui.keyClipboard.label": "Raccourci Traduire le presse-papiers",
  "settings.tui.keyClipboard.desc": "Par défaut : alt+t (ou personnalisé, ex. alt+y, ctrl+t)",
  "settings.tui.keyLastTurn.label": "Raccourci Traduire la dernière réponse de l'assistant",
  "settings.tui.keyLastTurn.desc": "Par défaut : alt+shift+t (ex. alt+shift+y, ctrl+shift+t)",
  "settings.tui.keyPanel.label": "Raccourci pour basculer le panneau latéral",
  "settings.tui.keyPanel.desc": "Par défaut : alt+p (ex. alt+o, ctrl+p)",

  "settings.reset": "Rétablir les paramètres par défaut",

  "tui.command.clipboard": "Traduire la sélection du presse-papiers",
  "tui.command.last": "Traduire le dernier message de l'assistant",
  "tui.command.panel": "Basculer le panneau latéral de traduction",
  "tui.command.config": "Paramètres de traduction",
}

export const I18N_JA: Record<I18nKey, string> = {
  "translate.loading": "翻訳中…",
  "translate.failed": "翻訳に失敗しました",
  "translate.truncated": "選択範囲をトリミングしました",
  "translate.copy": "行をクリックしてコピー",
  "translate.copied": "コピーしました",
  "settings.title": "翻訳",

  "settings.header.title": "ポップアップ翻訳の設定",
  "settings.header.desc": "ポップアップ翻訳の外観、対象言語、表示位置、動作をカスタマイズします。",

  "settings.preview.title": "ライブプレビュー",
  "settings.preview.sampleTitle": "主な機能：",
  "settings.preview.sampleBullet": "モデルで検索： ",
  "settings.preview.langTag": "JA",

  "settings.presets.title": "プリセットテーマ",
  "settings.preset.amber": "アンバーゴールド",
  "settings.preset.midnight": "ミッドナイト OLED",
  "settings.preset.monokai": "サイバーパンク",
  "settings.preset.nordic": "ノルディックスレート",
  "settings.preset.light": "ペーパーライト",

  "settings.engine.title": "翻訳エンジン",
  "settings.engine.mode.label": "エンジンモード",
  "settings.engine.mode.auto": "自動 (スマート)",
  "settings.engine.mode.fast": "高速MT",
  "settings.engine.mode.llm": "セッションLLM",
  "settings.engine.mode.autoDesc": "自動 (スマート): フレーズには Google MT、リストやコードにはセッションLLMを使用",
  "settings.engine.mode.fastDesc": "高速MTのみ: 常に Google / MyMemory を使用（最速、LLMトークン消費ゼロ）",
  "settings.engine.mode.llmDesc": "セッションLLMのみ: 常にアクティブセッションのモデルで翻訳",
  "settings.engine.timeout.label": "LLMフォールバックタイムアウト ({{seconds}}秒)",
  "settings.engine.timeout.desc": "Google 翻訳にフォールバックするまでの最大待機時間",

  "settings.languages.title": "言語",
  "settings.languages.targets.label": "翻訳先言語",
  "settings.languages.targets.desc": "カンマ区切りの ISO 言語コード（例：ja, en, ru, zh, de, fr, es）",
  "settings.languages.codesLink.text": "ISO 639-1 言語コード一覧",
  "settings.languages.codesLink.url": "https://ja.wikipedia.org/wiki/ISO_639-1コード一覧",

  "settings.appearance.title": "カラーとスタイル",
  "settings.appearance.bgColor.label": "背景色",
  "settings.appearance.bgColor.desc": "ベースの背景トーン",
  "settings.appearance.bgOpacity.label": "背景の不透明度 ({{opacity}}%)",
  "settings.appearance.bgOpacity.desc": "ポップアップ背景の透明度",
  "settings.appearance.textColor.label": "翻訳テキストの色",
  "settings.appearance.textColor.desc": "メイン翻訳テキスト",
  "settings.appearance.accentColor.label": "アクセント＆バッジの色",
  "settings.appearance.accentColor.desc": "言語タグバッジおよび枠線のハイライト色",

  "settings.dimensions.title": "位置とサイズ",
  "settings.dimensions.clearance.label": "引用ツールバーからの余白 ({{clearance}}px)",
  "settings.dimensions.clearance.desc": "ネイティブの引用ツールバー上部からの垂直オフセット",
  "settings.dimensions.radius.label": "角丸半径 ({{radius}}px)",
  "settings.dimensions.radius.desc": "ポップアップの角の丸み",
  "settings.dimensions.fontSize.label": "フォントサイズ ({{size}}px)",
  "settings.dimensions.fontSize.desc": "翻訳テキストのフォントサイズ",
  "settings.dimensions.maxWidth.label": "最大幅 ({{width}}px)",
  "settings.dimensions.maxWidth.desc": "テキストが折り返されるまでの最大幅",
  "settings.dimensions.maxHeight.label": "最大高さ ({{height}}px)",
  "settings.dimensions.maxHeight.desc": "複数行やリストでスクロールバーが表示されるまでの最大高さ",

  "settings.behavior.title": "動作設定",
  "settings.behavior.debounce.label": "選択後の遅延 ({{delay}}ms)",
  "settings.behavior.debounce.desc": "マウスを離してから翻訳をリクエストするまでの待機時間",
  "settings.behavior.maxChars.label": "最大文字数制限 ({{chars}})",
  "settings.behavior.maxChars.desc": "これより長い選択テキストはトリミングされます",

  "settings.tui.title": "ターミナル (TUI) ショートカットキー",
  "settings.tui.desc": "ターミナルで動作する OpenCode のホットキーをカスタマイズします。Ghostty、iTerm2、Alacritty などの端末エミュレータが Alt+T などを横取りする場合は、代替キー（例：alt+y, ctrl+t, alt+c）を指定できます。",
  "settings.tui.keyClipboard.label": "クリップボード翻訳のショートカット",
  "settings.tui.keyClipboard.desc": "デフォルト: alt+t（または alt+y, ctrl+t など）",
  "settings.tui.keyLastTurn.label": "最後のアシスタント返答を翻訳するショートカット",
  "settings.tui.keyLastTurn.desc": "デフォルト: alt+shift+t（例：alt+shift+y, ctrl+shift+t）",
  "settings.tui.keyPanel.label": "翻訳サイドパネル表示切替ショートカット",
  "settings.tui.keyPanel.desc": "デフォルト: alt+p（例：alt+o, ctrl+p）",

  "settings.reset": "デフォルトに戻す",

  "tui.command.clipboard": "クリップボードの選択項目を翻訳",
  "tui.command.last": "最後のアシスタントメッセージを翻訳",
  "tui.command.panel": "翻訳サイドパネルの切り替え",
  "tui.command.config": "翻訳設定",
}

export interface PluginCatalog {
  readonly en: Record<I18nKey, string>
  readonly [locale: string]: Record<I18nKey, string>
}

export const I18N_CATALOG: PluginCatalog = {
  en: I18N_EN,
  "en-US": I18N_EN,
  "en-GB": I18N_EN,
  ru: I18N_RU,
  "ru-RU": I18N_RU,
  zh: I18N_ZH,
  "zh-CN": I18N_ZH,
  "zh-Hans": I18N_ZH,
  zht: I18N_ZH,
  "zh-TW": I18N_ZH,
  "zh-Hant": I18N_ZH,
  de: I18N_DE,
  "de-DE": I18N_DE,
  es: I18N_ES,
  "es-ES": I18N_ES,
  fr: I18N_FR,
  "fr-FR": I18N_FR,
  ja: I18N_JA,
  "ja-JP": I18N_JA,
}

export function resolveTranslation(
  locale: string | undefined,
  key: string,
  params?: TranslationParams,
): string {
  const norm = (locale || "").toLowerCase().replace("_", "-")
  const lang = norm.split("-")[0] || "en"

  const dict =
    I18N_CATALOG[norm] ||
    I18N_CATALOG[lang] ||
    I18N_EN

  const template = dict[key as I18nKey] ?? I18N_EN[key as I18nKey] ?? key

  if (!params) return template

  return template.replace(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g, (_, p) => {
    return params[p] !== undefined ? String(params[p]) : `{{${p}}}`
  })
}

export function getDefaultTargetsForLocale(locale?: string): string {
  if (!locale) return "ru, en"
  const lang = locale.toLowerCase().split(/[-_]/)[0]
  switch (lang) {
    case "ru":
    case "uk":
    case "be":
    case "kk":
      return "ru, en"
    case "zh":
      return "zh, en"
    case "de":
      return "de, en"
    case "es":
      return "es, en"
    case "fr":
      return "fr, en"
    case "ja":
      return "ja, en"
    case "it":
      return "it, en"
    case "pt":
      return "pt, en"
    case "ko":
      return "ko, en"
    case "tr":
      return "tr, en"
    default:
      return "ru, en"
  }
}

export function getSystemLocale(): string {
  try {
    const env = (
      process.env.LC_ALL ||
      process.env.LC_MESSAGES ||
      process.env.LANG ||
      process.env.LANGUAGE ||
      ""
    ).toLowerCase()
    if (env) {
      const match = env.split(".")[0]?.replace("_", "-")
      if (match) return match
    }
    return Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase()
  } catch {
    return "en"
  }
}

export function isRussianLocale(): boolean {
  const loc = getSystemLocale()
  return loc.startsWith("ru") || loc.startsWith("uk") || loc.startsWith("be")
}

export function tuiText(ru: string, en: string): string {
  return isRussianLocale() ? ru : en
}
