/**
 * Color scheme preference for pages using m43 tokens (`m43-tokens.css`).
 * Persists in localStorage; `applyColorSchemeToDocument` sets `data-m43-theme` on `<html>`.
 */

export const M43_THEME_STORAGE_KEY = 'm43-theme'

export type M43ColorScheme = 'light' | 'dark' | 'auto'

export function parseStoredTheme(raw: string | null): M43ColorScheme {
  if (raw === 'light' || raw === 'dark' || raw === 'auto') {
    return raw
  }
  return 'auto'
}

export function readStoredTheme(storage: Pick<Storage, 'getItem'> | null): M43ColorScheme {
  if (!storage) {
    return 'auto'
  }
  try {
    return parseStoredTheme(storage.getItem(M43_THEME_STORAGE_KEY))
  } catch {
    return 'auto'
  }
}

export function writeStoredTheme(storage: Pick<Storage, 'setItem'> | null, theme: M43ColorScheme): void {
  if (!storage) {
    return
  }
  try {
    storage.setItem(M43_THEME_STORAGE_KEY, theme)
  } catch {
    /* quota / private mode */
  }
}

/** Order: light → dark → auto → light … */
export function cycleColorScheme(current: M43ColorScheme): M43ColorScheme {
  if (current === 'light') {
    return 'dark'
  }
  if (current === 'dark') {
    return 'auto'
  }
  return 'light'
}

export function labelForColorScheme(theme: M43ColorScheme): string {
  switch (theme) {
    case 'light':
      return 'Light'
    case 'dark':
      return 'Dark'
    default:
      return 'Auto (system)'
  }
}

export function shortLabelForColorScheme(theme: M43ColorScheme): string {
  switch (theme) {
    case 'light':
      return 'Light'
    case 'dark':
      return 'Dark'
    default:
      return 'Auto'
  }
}

export function applyColorSchemeToRoot(root: HTMLElement, theme: M43ColorScheme): void {
  if (theme === 'auto') {
    root.removeAttribute('data-m43-theme')
  } else {
    root.setAttribute('data-m43-theme', theme)
  }
}

export function applyColorSchemeToDocument(doc: Document, theme: M43ColorScheme): void {
  applyColorSchemeToRoot(doc.documentElement, theme)
}

export function setThemeToggleButtonState(button: HTMLButtonElement, theme: M43ColorScheme): void {
  const mode = labelForColorScheme(theme)
  button.setAttribute('aria-label', `Color theme: ${mode}. Click to switch.`)
  button.title = `Theme: ${shortLabelForColorScheme(theme)}`
  button.textContent = shortLabelForColorScheme(theme)
}
