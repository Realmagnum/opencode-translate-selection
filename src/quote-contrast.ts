/**
 * Injected contrast enhancement styles for OpenCode native Quote toolbars.
 * Variant 2: Accent Glow / Blue Focus.
 */
export const QUOTE_CONTRAST_CSS = `
/* OpenCode Quote Toolbar Contrast Enhancement — Variant 2: Accent Glow */
[data-component="timeline-quote"],
[data-component="terminal-quote"] {
  background-color: #202228 !important;
  border: 1px solid rgba(96, 165, 250, 0.5) !important;
  box-shadow: 0 8px 26px -4px rgba(0, 0, 0, 0.75), 0 0 14px rgba(59, 130, 246, 0.28) !important;
  backdrop-filter: blur(12px) !important;
  border-radius: 8px !important;
  transition: transform 0.1s ease, box-shadow 0.15s ease, border-color 0.15s ease !important;
}

[data-color-scheme="dark"] [data-component="timeline-quote"],
[data-color-scheme="dark"] [data-component="terminal-quote"] {
  background-color: #202228 !important;
  border: 1px solid rgba(96, 165, 250, 0.5) !important;
  box-shadow: 0 8px 26px -4px rgba(0, 0, 0, 0.75), 0 0 14px rgba(59, 130, 246, 0.28) !important;
}

[data-color-scheme="light"] [data-component="timeline-quote"],
[data-color-scheme="light"] [data-component="terminal-quote"] {
  background-color: #ffffff !important;
  border: 1px solid rgba(59, 130, 246, 0.45) !important;
  box-shadow: 0 8px 24px -4px rgba(59, 130, 246, 0.2), 0 0 10px rgba(59, 130, 246, 0.15) !important;
}

[data-component="timeline-quote"] button,
[data-component="terminal-quote"] button {
  color: #f1f5f9 !important;
  font-weight: 530 !important;
  border-radius: 6px !important;
  transition: background-color 0.12s ease, color 0.12s ease !important;
}

[data-component="timeline-quote"] button svg,
[data-component="terminal-quote"] button svg {
  color: #60a5fa !important;
  filter: drop-shadow(0 0 4px rgba(96, 165, 250, 0.45));
}

[data-component="timeline-quote"]:hover,
[data-component="terminal-quote"]:hover {
  border-color: rgba(96, 165, 250, 0.75) !important;
  box-shadow: 0 10px 30px -4px rgba(0, 0, 0, 0.8), 0 0 18px rgba(59, 130, 246, 0.4) !important;
}

[data-component="timeline-quote"] button:hover,
[data-component="terminal-quote"] button:hover {
  background-color: rgba(96, 165, 250, 0.16) !important;
  color: #ffffff !important;
}

[data-component="timeline-quote"] button:active,
[data-component="terminal-quote"] button:active {
  background-color: rgba(96, 165, 250, 0.25) !important;
  transform: scale(0.98);
}
`
