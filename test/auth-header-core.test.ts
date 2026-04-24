import { describe, expect, it } from 'vitest'
import {
  buildSignInUrl,
  normalizeBaseUrl,
  DEFAULT_API_BASE,
  DEFAULT_AUTH_ORIGIN,
  DEFAULT_HOME_URL,
  DEFAULT_NAV_URL,
  initialFromEmail,
  normalizeNavigationUrl,
  renderAuthHeader,
  shouldShowHomeLink,
} from '../src/auth-header-core'

class FakeClassList {
  values = new Set<string>()

  add(...tokens: string[]): void {
    tokens.forEach((token) => this.values.add(token))
  }

  remove(...tokens: string[]): void {
    tokens.forEach((token) => this.values.delete(token))
  }
}

class FakeElement {
  children: FakeElement[] = []
  classList = new FakeClassList()
  attributes = new Map<string, string>()
  className = ''
  hidden = false
  href = ''
  innerHTML = ''
  textContent = ''
  title = ''
  type = ''

  appendChild(child: FakeElement): FakeElement {
    this.children.push(child)
    return child
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value)
  }

  addEventListener(_eventName: string, _listener: () => void): void {
    /* noop */
  }

  contains(child: unknown): boolean {
    return this.children.includes(child as FakeElement)
  }
}

function installFakeDocument(): void {
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      createElement: () => new FakeElement(),
      addEventListener: () => undefined,
    },
  })
}

describe('normalizeBaseUrl', () => {
  it('strips trailing slash', () => {
    expect(normalizeBaseUrl('https://api.michaelj43.dev/', DEFAULT_API_BASE)).toBe('https://api.michaelj43.dev')
  })

  it('uses fallback for empty', () => {
    expect(normalizeBaseUrl('', DEFAULT_API_BASE)).toBe(DEFAULT_API_BASE)
  })
})

describe('buildSignInUrl', () => {
  it('appends returnUrl for current page (auth SPA + shared-api-platform)', () => {
    const u = buildSignInUrl('https://auth.michaelj43.dev', 'https://static.michaelj43.dev/v1/m43-shell.css')
    expect(u).toBe(
      'https://auth.michaelj43.dev/?returnUrl=' +
        encodeURIComponent('https://static.michaelj43.dev/v1/m43-shell.css'),
    )
  })

  it('defaults auth origin to DEFAULT_AUTH_ORIGIN', () => {
    const u = buildSignInUrl('', 'https://cardgame.michaelj43.dev/foo')
    expect(u.startsWith(`${DEFAULT_AUTH_ORIGIN}/?returnUrl=`)).toBe(true)
    expect(u).toContain(encodeURIComponent('https://cardgame.michaelj43.dev/foo'))
  })
})

describe('DEFAULT_AUTH_ORIGIN', () => {
  it('matches shared-api-platform dashboard / auth default', () => {
    expect(DEFAULT_AUTH_ORIGIN).toBe('https://auth.michaelj43.dev')
  })
})

describe('DEFAULT_API_BASE', () => {
  it('matches shared API default', () => {
    expect(DEFAULT_API_BASE).toBe('https://api.michaelj43.dev')
  })
})

describe('DEFAULT_HOME_URL', () => {
  it('is the portfolio apex root', () => {
    expect(DEFAULT_HOME_URL).toBe('https://michaelj43.dev/')
  })
})

describe('DEFAULT_NAV_URL', () => {
  it('points at the portfolio navigation page', () => {
    expect(DEFAULT_NAV_URL).toBe('https://michaelj43.dev/navigation/')
  })
})

describe('normalizeNavigationUrl', () => {
  it('normalizes configured navigation URLs', () => {
    expect(normalizeNavigationUrl('https://michaelj43.dev/navigation')).toBe('https://michaelj43.dev/navigation')
  })

  it('uses the default for empty or invalid values', () => {
    expect(normalizeNavigationUrl('')).toBe(DEFAULT_NAV_URL)
    expect(normalizeNavigationUrl('not a url')).toBe(DEFAULT_NAV_URL)
  })
})

describe('renderAuthHeader navigation button', () => {
  it('renders the top-bar mark as an accessible button', () => {
    installFakeDocument()
    const mount = new FakeElement()

    renderAuthHeader(
      mount as unknown as HTMLElement,
      { ok: false, reason: 'unauthorized' },
      'https://auth.michaelj43.dev/',
      () => undefined,
      {
        homeUrl: DEFAULT_HOME_URL,
        navUrl: 'https://michaelj43.dev/navigation/',
        pageHref: 'https://cardgame.michaelj43.dev/',
      },
    )

    const inner = mount.children[0]
    const navButton = inner.children[0]
    const logoMark = navButton.children[0]
    expect(navButton.type).toBe('button')
    expect(navButton.className).toBe('m43-top-bar__logo-button')
    expect(navButton.attributes.get('aria-label')).toBe('Open site navigation')
    expect(logoMark.className).toBe('m43-top-bar__logo-mark')
  })
})

describe('shouldShowHomeLink', () => {
  const home = 'https://michaelj43.dev/'

  it('hides on apex root', () => {
    expect(shouldShowHomeLink('https://michaelj43.dev/', home)).toBe(false)
    expect(shouldShowHomeLink('https://michaelj43.dev', home)).toBe(false)
  })

  it('hides on /index.html at apex', () => {
    expect(shouldShowHomeLink('https://michaelj43.dev/index.html', home)).toBe(false)
  })

  it('shows on inner paths at apex', () => {
    expect(shouldShowHomeLink('https://michaelj43.dev/projects', home)).toBe(true)
  })

  it('shows on other subdomains', () => {
    expect(shouldShowHomeLink('https://static.michaelj43.dev/', home)).toBe(true)
    expect(shouldShowHomeLink('https://static.michaelj43.dev/v1/', home)).toBe(true)
  })
})

describe('initialFromEmail', () => {
  it('uses first alphanumeric of local part', () => {
    expect(initialFromEmail('foo@example.com')).toBe('F')
    expect(initialFromEmail('Michael@example.com')).toBe('M')
  })

  it('falls back to ? when no suitable character', () => {
    expect(initialFromEmail('@example.com')).toBe('?')
    expect(initialFromEmail('')).toBe('?')
  })
})
