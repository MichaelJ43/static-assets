import {
  buildSignInUrl,
  fallbackNavigationItems,
  fetchMe,
  fetchNavigationItems,
  populateNavMenuFromItems,
  postLogout,
  renderAuthHeader,
} from './auth-header-core'

export type ProgressiveAuthHeaderConfig = {
  mount: HTMLElement
  apiBase: string
  authOrigin: string
  homeUrl: string
  navUrl: string
  navDataUrl: string
  layout: 'fixed' | 'in-flow'
  /** Current page URL for sign-in `returnUrl` and Home visibility. */
  pageHref: string
  fetchImpl?: typeof fetch
}

export type ProgressiveAuthHeaderHooks = {
  onAfterFirstRender?: (mount: HTMLElement, layout: 'fixed' | 'in-flow') => void
}

/**
 * Awaits session (`/me`), renders the bar once with fallback nav, then upgrades the nav menu
 * when `navigation.json` resolves. Avoids a second full render (duplicate document listeners).
 */
export async function runProgressiveAuthHeaderInit(
  config: ProgressiveAuthHeaderConfig,
  hooks?: ProgressiveAuthHeaderHooks,
): Promise<void> {
  const { mount, apiBase, authOrigin, homeUrl, navUrl, navDataUrl, layout, pageHref, fetchImpl = fetch } = config

  const navPromise = fetchNavigationItems(navDataUrl, navUrl, fetchImpl)
  const me = await fetchMe(apiBase, fetchImpl)
  const signInUrl = buildSignInUrl(authOrigin, pageHref)

  const onSignOut = (): void => {
    void (async () => {
      const ok = await postLogout(apiBase, fetchImpl)
      if (ok) {
        location.reload()
        return
      }
      window.alert('Sign out failed. Check the network and API CORS configuration.')
    })()
  }

  renderAuthHeader(mount, me, signInUrl, onSignOut, {
    homeUrl,
    navUrl,
    navItems: fallbackNavigationItems(navUrl),
    layout,
    pageHref,
  })

  hooks?.onAfterFirstRender?.(mount, layout)

  void navPromise.then((items) => {
    const ul = mount.querySelector('ul.m43-nav-menu__menu')
    if (ul instanceof HTMLElement) {
      populateNavMenuFromItems(ul, items)
    } else {
      // eslint-disable-next-line no-console
      console.warn('[m43-auth-header] Nav menu element missing; skipping navigation refresh.')
    }
  })
}
