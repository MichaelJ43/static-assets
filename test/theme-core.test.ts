import { describe, expect, it } from 'vitest'
import {
  M43_THEME_STORAGE_KEY,
  applyColorSchemeToRoot,
  cycleColorScheme,
  parseStoredTheme,
  readStoredTheme,
  writeStoredTheme,
} from '../src/theme-core'

describe('parseStoredTheme', () => {
  it('accepts stored keywords', () => {
    expect(parseStoredTheme('light')).toBe('light')
    expect(parseStoredTheme('dark')).toBe('dark')
    expect(parseStoredTheme('auto')).toBe('auto')
  })

  it('defaults invalid values to auto', () => {
    expect(parseStoredTheme('')).toBe('auto')
    expect(parseStoredTheme('system')).toBe('auto')
    expect(parseStoredTheme(null)).toBe('auto')
  })
})

describe('readStoredTheme / writeStoredTheme', () => {
  it('round-trips via getItem/setItem', () => {
    const map = new Map<string, string>()
    const storage = {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => {
        map.set(k, v)
      },
    }
    expect(readStoredTheme(storage)).toBe('auto')
    writeStoredTheme(storage, 'dark')
    expect(map.get(M43_THEME_STORAGE_KEY)).toBe('dark')
    expect(readStoredTheme(storage)).toBe('dark')
  })
})

describe('cycleColorScheme', () => {
  it('rotates light → dark → auto → light', () => {
    expect(cycleColorScheme('light')).toBe('dark')
    expect(cycleColorScheme('dark')).toBe('auto')
    expect(cycleColorScheme('auto')).toBe('light')
  })
})

class FakeHtmlElement {
  attrs = new Map<string, string>()
  setAttribute(name: string, value: string): void {
    this.attrs.set(name, value)
  }
  getAttribute(name: string): string | null {
    return this.attrs.get(name) ?? null
  }
  removeAttribute(name: string): void {
    this.attrs.delete(name)
  }
  hasAttribute(name: string): boolean {
    return this.attrs.has(name)
  }
}

describe('applyColorSchemeToRoot', () => {
  it('sets data-m43-theme for light and dark', () => {
    const root = new FakeHtmlElement() as unknown as HTMLElement
    applyColorSchemeToRoot(root, 'light')
    expect(root.getAttribute('data-m43-theme')).toBe('light')
    applyColorSchemeToRoot(root, 'dark')
    expect(root.getAttribute('data-m43-theme')).toBe('dark')
  })

  it('removes data-m43-theme for auto', () => {
    const root = new FakeHtmlElement() as unknown as HTMLElement
    root.setAttribute('data-m43-theme', 'light')
    applyColorSchemeToRoot(root, 'auto')
    expect(root.hasAttribute('data-m43-theme')).toBe(false)
  })
})
