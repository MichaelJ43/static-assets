import {
  DEFAULT_API_BASE,
  DEFAULT_AUTH_ORIGIN,
  buildSignInUrl,
  fetchMe,
  normalizeBaseUrl,
  postLogout,
  renderAuthHeader,
} from './auth-header-core'

function getLoaderScript(): HTMLScriptElement | null {
  if (typeof document === 'undefined') {
    return null
  }
  return document.querySelector('script[data-m43-auth]')
}

function readConfig(el: HTMLScriptElement | null): { apiBase: string; authOrigin: string; mount: HTMLElement | null } {
  if (!el?.dataset) {
    return { apiBase: DEFAULT_API_BASE, authOrigin: DEFAULT_AUTH_ORIGIN, mount: null }
  }
  const d = el.dataset
  const apiBase = normalizeBaseUrl(d.m43Api ?? DEFAULT_API_BASE, DEFAULT_API_BASE)
  const authOrigin = (d.m43AuthOrigin ?? DEFAULT_AUTH_ORIGIN).trim() || DEFAULT_AUTH_ORIGIN
  const sel = (d.m43AuthMount ?? '').trim()
  let mount: HTMLElement | null = null
  if (sel) {
    try {
      mount = document.querySelector(sel) as HTMLElement | null
    } catch {
      mount = null
    }
  }
  if (!mount) {
    mount = document.querySelector('[data-m43-auth-header]') as HTMLElement | null
  }
  return { apiBase, authOrigin, mount }
}

/**
 * Fetches /v1/auth/me, then renders sign-in (with returnUrl) or user + sign out.
 */
export async function initM43AuthHeader(): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined' || typeof location === 'undefined') {
    return
  }
  const el = getLoaderScript()
  const { apiBase, authOrigin, mount } = readConfig(el)
  if (!mount) {
    // eslint-disable-next-line no-console
    console.warn(
      '[m43-auth-header] No mount: add a placeholder element with data-m43-auth-header (or set data-m43-auth-mount).',
    )
    return
  }

  const me = await fetchMe(apiBase)
  const signInUrl = buildSignInUrl(authOrigin, location.href)

  const onSignOut = (): void => {
    void (async () => {
      const ok = await postLogout(apiBase)
      if (ok) {
        location.reload()
        return
      }
      window.alert('Sign out failed. Check the network and API CORS configuration.')
    })()
  }

  renderAuthHeader(mount, me, signInUrl, onSignOut)
}

void initM43AuthHeader()
