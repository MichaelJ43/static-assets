import { applyExternalLinkTargets } from './external-links-core'

function initM43ExternalLinks(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return
  }
  applyExternalLinkTargets(document, window.location.href, window.location.hostname)
}

void initM43ExternalLinks()
