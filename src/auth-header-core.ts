/**
 * Auth header helpers (shared-api-platform: GET /v1/auth/me, POST /v1/auth/logout,
 * auth SPA reads ?returnUrl= for login). No side effects on import.
 */

export const DEFAULT_API_BASE = 'https://api.michaelj43.dev'
export const DEFAULT_AUTH_ORIGIN = 'https://auth.michaelj43.dev'

function dlog(msg: string, ...args: unknown[]): void {
  try {
    if (typeof location !== 'undefined' && /(?:[?&])m43debug=1(?:&|$)/.test(location.search)) {
      console.debug(`[m43-auth-header] ${msg}`, ...args)
    }
  } catch {
    /* empty */
  }
}

export function normalizeBaseUrl(raw: string, fallback: string): string {
  const t = raw.trim() || fallback
  return t.replace(/\/$/, '') || fallback
}

/**
 * Auth SPA expects `returnUrl` as a query param; login POST forwards it to the API
 * (see shared-api-platform auth-spa and v1Auth).
 */
export function buildSignInUrl(authOrigin: string, currentPageUrl: string): string {
  const base = normalizeBaseUrl(authOrigin, DEFAULT_AUTH_ORIGIN)
  const u = new URL(base.endsWith('/') ? base : `${base}/`)
  u.searchParams.set('returnUrl', currentPageUrl)
  return u.toString()
}

export type MeResult =
  | { ok: true; email: string; userId: string }
  | { ok: false; reason: 'unauthorized' | 'network' | 'bad_response' }

export async function fetchMe(apiBase: string, fetchImpl: typeof fetch = fetch): Promise<MeResult> {
  const base = normalizeBaseUrl(apiBase, DEFAULT_API_BASE)
  const url = `${base}/v1/auth/me`
  try {
    const r = await fetchImpl(url, { credentials: 'include', method: 'GET' })
    if (r.status === 401) {
      return { ok: false, reason: 'unauthorized' }
    }
    if (!r.ok) {
      dlog('me non-ok', r.status, r.statusText)
      return { ok: false, reason: 'bad_response' }
    }
    const j = (await r.json()) as { user?: { email?: string; id?: string } }
    const email = j.user?.email
    const id = j.user?.id
    if (typeof email !== 'string' || !email || typeof id !== 'string' || !id) {
      return { ok: false, reason: 'bad_response' }
    }
    return { ok: true, email, userId: id }
  } catch (e) {
    dlog('me fetch error', e)
    return { ok: false, reason: 'network' }
  }
}

export async function postLogout(apiBase: string, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  const base = normalizeBaseUrl(apiBase, DEFAULT_API_BASE)
  const url = `${base}/v1/auth/logout`
  try {
    const r = await fetchImpl(url, { credentials: 'include', method: 'POST' })
    return r.ok
  } catch (e) {
    dlog('logout error', e)
    return false
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function truncateEmail(email: string, max: number): string {
  if (email.length <= max) {
    return email
  }
  return `${email.slice(0, max - 1)}…`
}

const USER_ICON_SVG = `<svg class="m43-auth-user__icon" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`

/**
 * Renders sign-in or user menu into `mount` (replaces content).
 */
export function renderAuthHeader(
  mount: HTMLElement,
  me: MeResult,
  signInUrl: string,
  onSignOut: () => void,
): void {
  mount.classList.add('m43-auth-header')
  mount.innerHTML = ''

  if (me.ok) {
    mount.classList.remove('m43-auth-header--signed-out')
    mount.classList.add('m43-auth-header--signed-in')
    const label = truncateEmail(me.email, 32)

    const wrap = document.createElement('div')
    wrap.className = 'm43-auth-user'

    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'm43-auth-user__trigger'
    btn.setAttribute('aria-haspopup', 'true')
    btn.setAttribute('aria-expanded', 'false')
    btn.setAttribute('aria-label', `Account: ${me.email}. Open menu.`)
    btn.innerHTML = `${USER_ICON_SVG}<span class="m43-auth-user__label">${escapeHtml(label)}</span>`

    const menu = document.createElement('ul')
    menu.className = 'm43-auth-user__menu'
    menu.setAttribute('role', 'menu')
    menu.hidden = true

    const li = document.createElement('li')
    li.setAttribute('role', 'none')
    const out = document.createElement('button')
    out.type = 'button'
    out.className = 'm43-auth-user__item'
    out.setAttribute('role', 'menuitem')
    out.textContent = 'Sign out'
    out.addEventListener('click', () => onSignOut())
    li.appendChild(out)
    menu.appendChild(li)

    function closeMenu(): void {
      menu.hidden = true
      btn.setAttribute('aria-expanded', 'false')
    }

    function openMenu(): void {
      menu.hidden = false
      btn.setAttribute('aria-expanded', 'true')
    }

    function toggleMenu(): void {
      if (menu.hidden) {
        openMenu()
      } else {
        closeMenu()
      }
    }

    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      toggleMenu()
    })

    const onDocDown = (e: MouseEvent): void => {
      if (wrap.contains(e.target as Node)) {
        return
      }
      closeMenu()
    }
    document.addEventListener('mousedown', onDocDown)

    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeMenu()
        btn.focus()
      }
    })

    wrap.appendChild(btn)
    wrap.appendChild(menu)
    mount.appendChild(wrap)

    return
  }

  mount.classList.remove('m43-auth-header--signed-in')
  mount.classList.add('m43-auth-header--signed-out')
  const a = document.createElement('a')
  a.className = 'm43-button m43-button--primary m43-auth-signin'
  a.href = signInUrl
  a.textContent = 'Sign in'
  mount.appendChild(a)
}
