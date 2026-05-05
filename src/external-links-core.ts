type LinkLike = {
  getAttribute(name: string): string | null
  setAttribute(name: string, value: string): void
}

type LinkQueryRoot = {
  querySelectorAll(selectors: string): Iterable<LinkLike>
}

export function shouldOpenInNewTab(url: URL, currentHostname: string): boolean {
  if (!/^https?:$/.test(url.protocol)) {
    return false
  }
  return url.hostname.toLowerCase() !== currentHostname.toLowerCase()
}

export function applyExternalLinkTargets(
  root: LinkQueryRoot,
  currentHref: string,
  currentHostname: string,
): void {
  for (const link of root.querySelectorAll('a[href]')) {
    const href = link.getAttribute('href')
    if (!href) {
      continue
    }
    try {
      const url = new URL(href, currentHref)
      if (!shouldOpenInNewTab(url, currentHostname)) {
        continue
      }
      link.setAttribute('target', '_blank')
      link.setAttribute('rel', 'noopener noreferrer')
    } catch {
      // Ignore malformed href values.
    }
  }
}
