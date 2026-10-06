/**
 * Shared Help PDF download helpers (Basic / Advanced / Customized).
 * Uses page-host API origin so LAN / custom domain works (not baked 127.0.0.1).
 */
import { resolveApiOrigin } from '../utils/resolveMediaUrl'

function getApiBaseUrl() {
  return String(resolveApiOrigin()).replace(/\/+$/, '')
}

export function buildHelpFileUrl(filePath) {
  const path = String(filePath ?? '').trim()
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${getApiBaseUrl()}${normalized}`
}

function guessFileName(filePath, fallbackName) {
  const fromPath = String(filePath || '')
    .split(/[/\\]/)
    .filter(Boolean)
    .pop()
  if (fromPath && /\.[a-z0-9]+$/i.test(fromPath)) return fromPath
  const base = String(fallbackName || 'help').trim() || 'help'
  return base.toLowerCase().endsWith('.pdf') ? base : `${base}.pdf`
}

function triggerAnchorDownload(href, fileName, { openInNewTab = false } = {}) {
  const a = document.createElement('a')
  a.href = href
  if (openInNewTab) {
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
  } else if (fileName) {
    a.download = fileName
  }
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/**
 * Download a help PDF from the API static mount (/help_files/...).
 * Prefers blob + <a download> (avoids popup blockers); falls back to new tab.
 */
export async function downloadHelpFile(filePath, options = {}) {
  const { fileName } = options
  const url = buildHelpFileUrl(filePath)
  if (!url) return false

  const suggested = guessFileName(filePath, fileName)

  try {
    let token = null
    try {
      token = localStorage.getItem('lutron')
    } catch {
      /* private mode */
    }

    const res = await fetch(url, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    if (!res.ok) {
      throw new Error(`Help file request failed (${res.status})`)
    }
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    triggerAnchorDownload(objectUrl, suggested)
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
    return true
  } catch {
    try {
      triggerAnchorDownload(url, suggested, { openInNewTab: true })
      return true
    } catch {
      return false
    }
  }
}
