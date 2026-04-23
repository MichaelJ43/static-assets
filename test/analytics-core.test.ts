import { describe, expect, it } from 'vitest'
import {
  newSessionId,
  pathFromLocation,
  parseScriptConfig,
  getOrCreateSessionId,
  buildSingleEventBody,
  DEFAULT_API_BASE,
} from '../src/analytics-core'

const SESSION_KEY = 'm43_analytics_session_v1'

function mockStorage(): Storage {
  const store = new Map<string, string>()
  return {
    get length() {
      return store.size
    },
    clear: () => {
      store.clear()
    },
    getItem: (k: string) => store.get(k) ?? null,
    key: (i: number) => [...store.keys()][i] ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v)
    },
    removeItem: (k: string) => {
      store.delete(k)
    },
  } as Storage
}

describe('newSessionId', () => {
  it('returns distinct ids', () => {
    const a = newSessionId()
    const b = newSessionId()
    expect(a.length).toBeGreaterThan(6)
    expect(b.length).toBeGreaterThan(6)
    expect(a).not.toBe(b)
  })
})

describe('pathFromLocation', () => {
  it('joins pathname and search', () => {
    expect(pathFromLocation({ pathname: '/x', search: '?a=1' })).toBe('/x?a=1')
  })
  it('uses slash for empty pathname and search', () => {
    expect(pathFromLocation({ pathname: '', search: '' })).toBe('/')
  })
  it('truncates to 2048', () => {
    const long = 'x'.repeat(3000)
    expect(pathFromLocation({ pathname: long, search: '' }).length).toBe(2048)
  })
})

describe('parseScriptConfig', () => {
  it('returns defaults for null', () => {
    const c = parseScriptConfig(null)
    expect(c.appId).toBe('')
    expect(c.apiBase).toBe(DEFAULT_API_BASE)
    expect(c.spa).toBe(false)
  })
})

describe('getOrCreateSessionId', () => {
  it('reuses existing id', () => {
    const s = mockStorage()
    s.setItem(SESSION_KEY, 'kept')
    expect(getOrCreateSessionId(s)).toBe('kept')
  })
  it('creates and stores new id', () => {
    const s = mockStorage()
    const id = getOrCreateSessionId(s)
    expect(s.getItem(SESSION_KEY)).toBe(id)
  })
})

describe('buildSingleEventBody', () => {
  it('omits context when not needed', () => {
    const body = buildSingleEventBody({
      appId: 'a',
      sessionId: 's',
      eventType: 'pageview',
      path: '/',
      clientTimestamp: 1,
    })
    const j = JSON.parse(body) as { event: Record<string, unknown> }
    expect(j.event.appId).toBe('a')
    expect('context' in j.event).toBe(false)
  })
  it('includes context', () => {
    const body = buildSingleEventBody({
      appId: 'a',
      sessionId: 's',
      eventType: 'pageview',
      path: '/',
      clientTimestamp: 1,
      context: { r: 1 },
    })
    const j = JSON.parse(body) as { event: { context: Record<string, number> } }
    expect(j.event.context.r).toBe(1)
  })
})
