type LinkLike = {
  getAttribute(name: string): string | null
  setAttribute(name: string, value: string): void
}

type LinkQueryRoot = {
  querySelectorAll(selectors: string): Iterable<LinkLike>
}

function isIpv4(hostname: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)
}

export function internalDomainForHost(currentHostname: string): string {
  const host = currentHostname.toLowerCase()
  if (!host || host === 'localhost' || isIpv4(host) || host.includes(':')) {
    return host
  }
  const labels = host.split('.').filter(Boolean)
  if (labels.length < 2) {
    return host
  }
  return `${labels[labels.length - 2]}.${labels[labels.length - 1]}`
}

export function shouldOpenInNewTab(url: URL, currentHostname: string): boolean {
  if (!/^https?:$/.test(url.protocol)) {
    return false
  }
  const linkHost = url.hostname.toLowerCase()
  const internalDomain = internalDomainForHost(currentHostname)
  if (!internalDomain) {
    return false
  }
  return !(linkHost === internalDomain || linkHost.endsWith(`.${internalDomain}`))
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
