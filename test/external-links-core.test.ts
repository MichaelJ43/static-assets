import { describe, expect, it } from 'vitest'
import { Window } from 'happy-dom'
import { applyExternalLinkTargets, internalDomainForHost, shouldOpenInNewTab } from '../src/external-links-core'

describe('internalDomainForHost', () => {
  it('returns apex for subdomains', () => {
    expect(internalDomainForHost('cool-app.michaelj43.dev')).toBe('michaelj43.dev')
  })

  it('keeps localhost as-is', () => {
    expect(internalDomainForHost('localhost')).toBe('localhost')
  })
})

describe('shouldOpenInNewTab', () => {
  it('returns true for different http host', () => {
    expect(shouldOpenInNewTab(new URL('https://github.com/michaelj43'), 'michaelj43.dev')).toBe(true)
  })

  it('returns false for same host', () => {
    expect(shouldOpenInNewTab(new URL('https://michaelj43.dev/navigation/'), 'michaelj43.dev')).toBe(false)
  })

  it('returns false for same apex subdomain', () => {
    expect(shouldOpenInNewTab(new URL('https://cool-app.michaelj43.dev/page'), 'michaelj43.dev')).toBe(false)
  })

  it('returns false for non-http protocol', () => {
    expect(shouldOpenInNewTab(new URL('mailto:test@example.com'), 'michaelj43.dev')).toBe(false)
  })
})

describe('applyExternalLinkTargets', () => {
  it('updates only external http links', () => {
    const window = new Window()
    const { document } = window
    document.body.innerHTML = `
      <a id="same" href="/navigation/">same</a>
      <a id="external" href="https://github.com/michaelj43">external</a>
      <a id="mailto" href="mailto:test@example.com">email</a>
      <a id="hash" href="#top">hash</a>
    `

    applyExternalLinkTargets(document, 'https://michaelj43.dev/', 'michaelj43.dev')

    const same = document.getElementById('same')
    const external = document.getElementById('external')
    const mailto = document.getElementById('mailto')
    const hash = document.getElementById('hash')

    expect(same?.getAttribute('target')).toBeNull()
    expect(external?.getAttribute('target')).toBe('_blank')
    expect(external?.getAttribute('rel')).toBe('noopener noreferrer')
    expect(mailto?.getAttribute('target')).toBeNull()
    expect(hash?.getAttribute('target')).toBeNull()
  })
})
