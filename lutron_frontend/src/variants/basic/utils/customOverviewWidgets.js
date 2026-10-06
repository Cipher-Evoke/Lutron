import { DEFAULT_SHADES_CO2_CONSTANT } from './shadesWidgetSettings'

/** Set true to show Settings "Add Dashboard Overview widgets" and custom tiles on Overview. */
export const ENABLE_CUSTOM_DASHBOARD_OVERVIEW_WIDGETS = false

export const CUSTOM_OVERVIEW_WIDGETS_KEY = 'lutron_dashboard_custom_overview_widgets_v1'
export const CUSTOM_OVERVIEW_WIDGETS_EVENT = 'lutron-custom-overview-widgets-changed'

export const CUSTOM_OVERVIEW_WIDGET_TYPES = {
  EXTERNAL_LINK: 'external_link',
  CARBON_FOOTPRINT: 'carbon_footprint',
  STATIC: 'static',
}

export const CUSTOM_OVERVIEW_WIDGET_TYPE_LABELS = {
  [CUSTOM_OVERVIEW_WIDGET_TYPES.EXTERNAL_LINK]: 'External Link',
  [CUSTOM_OVERVIEW_WIDGET_TYPES.CARBON_FOOTPRINT]: 'Carbon Footprint',
  [CUSTOM_OVERVIEW_WIDGET_TYPES.STATIC]: 'Image & Info',
}

/** Prefix for visibility keys in dashboardWidgetVisibility map. */
export function customOverviewVisibilityKey(id) {
  return `custom_overview_${id}`
}

function createId() {
  return `cw_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function readCustomOverviewWidgetsRaw() {
  try {
    return localStorage.getItem(CUSTOM_OVERVIEW_WIDGETS_KEY)
  } catch {
    return null
  }
}

export function restoreCustomOverviewWidgetsAfterStorageClear(raw) {
  if (raw == null) return
  try {
    localStorage.setItem(CUSTOM_OVERVIEW_WIDGETS_KEY, raw)
  } catch {
    /* quota / private mode */
  }
}

export function readCustomOverviewWidgets() {
  try {
    const raw = localStorage.getItem(CUSTOM_OVERVIEW_WIDGETS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((w) => w && typeof w.id === 'string' && typeof w.name === 'string')
      .map(normalizeCustomOverviewWidget)
  } catch {
    return []
  }
}

function normalizeCustomOverviewWidget(widget) {
  const type = Object.values(CUSTOM_OVERVIEW_WIDGET_TYPES).includes(widget.type)
    ? widget.type
    : CUSTOM_OVERVIEW_WIDGET_TYPES.STATIC
  const co2 = Number(widget.co2Constant)
  return {
    id: widget.id,
    name: String(widget.name).trim(),
    type,
    description: typeof widget.description === 'string' ? widget.description.trim() : '',
    imageUrl: typeof widget.imageUrl === 'string' ? widget.imageUrl : '',
    hyperlink: typeof widget.hyperlink === 'string' ? widget.hyperlink.trim() : '',
    co2Constant:
      Number.isFinite(co2) && co2 >= 0 ? co2 : DEFAULT_SHADES_CO2_CONSTANT,
    visible: widget.visible !== false,
    createdAt: widget.createdAt || Date.now(),
  }
}

export function writeCustomOverviewWidgets(widgets) {
  try {
    localStorage.setItem(CUSTOM_OVERVIEW_WIDGETS_KEY, JSON.stringify(widgets))
    window.dispatchEvent(new CustomEvent(CUSTOM_OVERVIEW_WIDGETS_EVENT))
  } catch {
    /* quota / private mode */
  }
}

export function addCustomOverviewWidget(payload) {
  const widgets = readCustomOverviewWidgets()
  const next = normalizeCustomOverviewWidget({
    id: createId(),
    visible: true,
    createdAt: Date.now(),
    ...payload,
  })
  writeCustomOverviewWidgets([...widgets, next])
  return next
}

export function updateCustomOverviewWidget(id, updates) {
  const widgets = readCustomOverviewWidgets()
  const idx = widgets.findIndex((w) => w.id === id)
  if (idx < 0) return null
  const merged = normalizeCustomOverviewWidget({ ...widgets[idx], ...updates, id })
  const next = [...widgets]
  next[idx] = merged
  writeCustomOverviewWidgets(next)
  return merged
}

export function removeCustomOverviewWidget(id) {
  writeCustomOverviewWidgets(readCustomOverviewWidgets().filter((w) => w.id !== id))
}

export function setCustomOverviewWidgetVisible(id, visible) {
  return updateCustomOverviewWidget(id, { visible: Boolean(visible) })
}

/** @param {File} file @param {number} maxBytes */
export function readImageFileAsDataUrl(file, maxBytes = 400_000) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file.'))
      return
    }
    if (file.size > maxBytes) {
      reject(new Error('Image must be 400 KB or smaller.'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Could not read image file.'))
    reader.readAsDataURL(file)
  })
}
