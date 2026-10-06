/** LocalStorage keys for Dashboard Overview Shades tile settings. */
export const SHADES_HYPERLINK_KEY = 'lutron_dashboard_shades_hyperlink'
export const SHADES_NAME_KEY = 'lutron_dashboard_shades_name'
export const SHADES_CO2_CONSTANT_KEY = 'lutron_dashboard_shades_co2_constant'
export const SHADES_IMAGE_KEY = 'lutron_dashboard_shades_image'
export const SHADES_DESCRIPTION_KEY = 'lutron_dashboard_shades_description'
export const SHADES_SETTINGS_EVENT = 'lutron-dashboard-shades-settings-changed'

/** Default visible name for the overview external-link tile (internal key remains `shades`). */
export const DEFAULT_SHADES_WIDGET_NAME = 'External Link'

/** Default conversion factor when none is saved in Settings → Widgets → External Link. */
export const DEFAULT_SHADES_CO2_CONSTANT = 0.82

export const getShadesCo2Constant = () => {
  try {
    const raw = localStorage.getItem(SHADES_CO2_CONSTANT_KEY)
    if (raw == null || raw === '') return DEFAULT_SHADES_CO2_CONSTANT
    const n = Number(raw)
    return Number.isFinite(n) && n >= 0 ? n : DEFAULT_SHADES_CO2_CONSTANT
  } catch {
    return DEFAULT_SHADES_CO2_CONSTANT
  }
}

export const getShadesWidgetName = () => {
  try {
    const saved = localStorage.getItem(SHADES_NAME_KEY)
    if (saved && saved.trim()) return saved.trim()
  } catch {
    /* ignore */
  }
  return DEFAULT_SHADES_WIDGET_NAME
}

export const getShadesWidgetImage = () => {
  try {
    const saved = localStorage.getItem(SHADES_IMAGE_KEY)
    return saved && saved.trim() ? saved.trim() : ''
  } catch {
    return ''
  }
}

export const getShadesWidgetDescription = () => {
  try {
    const saved = localStorage.getItem(SHADES_DESCRIPTION_KEY)
    return saved && saved.trim() ? saved.trim() : ''
  } catch {
    return ''
  }
}

export const getShadesWidgetHyperlink = (fallback = '') => {
  try {
    const stored = localStorage.getItem(SHADES_HYPERLINK_KEY)
    if (stored && stored.trim()) return stored.trim()
  } catch {
    /* ignore */
  }
  return fallback
}

/**
 * Same-origin or root-relative URLs resolve to an in-app pathname; external URLs return null.
 * @param {string} url
 * @returns {string|null}
 */
export const resolveInternalAppPath = (url) => {
  const trimmed = String(url || '').trim()
  if (!trimmed) return null
  try {
    if (trimmed.startsWith('/')) {
      return trimmed.split('#')[0].split('?')[0] || null
    }
    if (typeof window === 'undefined') return null
    const parsed = new URL(trimmed, window.location.origin)
    if (parsed.origin !== window.location.origin) return null
    return parsed.pathname || null
  } catch {
    return null
  }
}

/**
 * Open Shades / Carbon Footprint overview tile hyperlink.
 * Internal app routes navigate in the current tab; external URLs open in a new tab.
 */
export const openShadesWidgetHyperlink = (url, { navigate, onNavigateToEnergy } = {}) => {
  const trimmed = String(url || '').trim()
  if (!trimmed || trimmed === 'https://') return

  const internalPath = resolveInternalAppPath(trimmed)
  if (internalPath) {
    const isEnergyDashboard =
      internalPath === '/dashboard/energy' || internalPath.startsWith('/dashboard/energy/')
    if (isEnergyDashboard && typeof onNavigateToEnergy === 'function') {
      onNavigateToEnergy()
      return
    }

    const inAppTarget = trimmed.startsWith('/')
      ? trimmed
      : (() => {
          try {
            const parsed = new URL(trimmed, window.location.origin)
            return `${parsed.pathname}${parsed.search}${parsed.hash}`
          } catch {
            return internalPath
          }
        })()

    if (typeof navigate === 'function') {
      navigate(inAppTarget)
      return
    }
    window.location.assign(inAppTarget)
    return
  }

  window.open(trimmed, '_blank', 'noopener,noreferrer')
}

export const notifyShadesSettingsChanged = () => {
  try {
    window.dispatchEvent(new CustomEvent(SHADES_SETTINGS_EVENT))
  } catch {
    /* ignore */
  }
}

/**
 * Same summary logic as Energy (Combined) chart — no hardcoded savings values.
 * @param {Array<{ consumption?: number, savings?: number, connectedLoad?: number }>} mergedData
 */
export const summarizeMergedConsumptionSavings = (mergedData = []) => {
  if (!Array.isArray(mergedData) || mergedData.length === 0) {
    return { totalConsumption: 0, totalSavings: 0, fullOnTotal: 0, savingsPercent: 0 }
  }
  let totalConsumption = 0
  let totalSavings = 0
  let totalConnectedLoad = 0
  mergedData.forEach((row) => {
    const c = Number(row.consumption)
    const s = Number(row.savings)
    const cl =
      row.connectedLoad != null && row.connectedLoad !== '' ? Number(row.connectedLoad) : null
    if (!Number.isNaN(c)) totalConsumption += c
    if (!Number.isNaN(s)) totalSavings += s
    if (cl != null && !Number.isNaN(cl)) totalConnectedLoad += cl
  })
  const fullOnTotal = totalConnectedLoad > 0 ? totalConnectedLoad : totalConsumption + totalSavings
  const savingsPercent = fullOnTotal > 0 ? (totalSavings / fullOnTotal) * 100 : 0
  return { totalConsumption, totalSavings, fullOnTotal, savingsPercent }
}

/**
 * Normalize savings to kWh for CO₂ math (constant is kg per kWh).
 * Wh/W are divided by 1000; kW/kWh and unknown units use the amount as-is.
 *
 * @param {number} amount
 * @param {string|null|undefined} unit
 * @returns {number|null}
 */
export const energySavingsAmountToKwh = (amount, unit) => {
  const n = Number(amount)
  if (!Number.isFinite(n)) return null
  const u = String(unit || '').toLowerCase().trim()
  if (u === 'wh' || u === 'w') return n / 1000
  return n
}

/**
 * Carbon footprint from energy savings using the CO₂ constant from Shades settings.
 * kW and kWh both multiply by kg/kWh (kW treated as kWh over 1 hour, per product spec).
 * Wh/W are converted to kWh before applying the factor.
 *
 * @param {number|null|undefined} savingsAmount
 * @param {string|null|undefined} unit e.g. 'kW', 'kWh', 'Wh'
 * @param {number} [co2Constant]
 * @returns {number|null}
 */
export const computeCo2KgFromEnergySavings = (
  savingsAmount,
  unit,
  co2Constant = getShadesCo2Constant()
) => {
  const factor = Number(co2Constant)
  if (!Number.isFinite(factor)) return null
  const savingsKwh = energySavingsAmountToKwh(savingsAmount, unit)
  if (savingsKwh == null || !Number.isFinite(savingsKwh)) return null
  return savingsKwh * factor
}

/** @deprecated Use computeCo2KgFromEnergySavings(savingsKw, 'kW') */
export const computeShadesCo2Kg = (savingsKw, co2Constant = getShadesCo2Constant()) =>
  computeCo2KgFromEnergySavings(savingsKw, 'kW', co2Constant)

/** @param {number|null} kg */
export const formatCo2Kg = (kg) => {
  if (kg == null || !Number.isFinite(kg)) return '—'
  return `${kg.toFixed(2)} kg`
}

/** Numeric portion only (for teardrop gauge display). */
export const formatCo2Number = (kg) => {
  if (kg == null || !Number.isFinite(kg)) return '—'
  return kg.toFixed(2)
}

/**
 * Resolve savings input for Shades CO₂ from Energy (Combined) API data, with overview fallback.
 * @param {Array} mergedData from unified energy consumption + savings series
 * @param {string} unit from unified energy API
 * @param {number|null|undefined} overviewSavingsKw from /home/dashboard energy.savings_kw
 */
export const resolveShadesCo2SavingsInput = (
  mergedData,
  unit,
  overviewSavingsKw
) => {
  const summary = summarizeMergedConsumptionSavings(mergedData)
  if (mergedData?.length && Number.isFinite(summary.totalSavings)) {
    return {
      amount: summary.totalSavings,
      unit: unit || 'kWh',
      source: 'energy_combined',
    }
  }
  const kw = Number(overviewSavingsKw)
  if (Number.isFinite(kw)) {
    return { amount: kw, unit: 'kW', source: 'overview' }
  }
  return { amount: null, unit: null, source: null }
}

/** Snapshot before localStorage.clear() on logout so Admin/Operator keep Superadmin External Link / Shades settings. */
export const snapshotShadesSettingsForLogout = () => {
  try {
    return {
      [SHADES_NAME_KEY]: localStorage.getItem(SHADES_NAME_KEY),
      [SHADES_HYPERLINK_KEY]: localStorage.getItem(SHADES_HYPERLINK_KEY),
      [SHADES_IMAGE_KEY]: localStorage.getItem(SHADES_IMAGE_KEY),
      [SHADES_DESCRIPTION_KEY]: localStorage.getItem(SHADES_DESCRIPTION_KEY),
      [SHADES_CO2_CONSTANT_KEY]: localStorage.getItem(SHADES_CO2_CONSTANT_KEY),
    }
  } catch {
    return null
  }
}

/** Restore after localStorage.clear() so Admin/Operator keep Superadmin External Link / Shades settings. */
export const restoreShadesSettingsAfterStorageClear = (snapshot) => {
  if (!snapshot || typeof snapshot !== 'object') return
  try {
    Object.entries(snapshot).forEach(([key, val]) => {
      if (val != null) {
        localStorage.setItem(key, val)
      }
    })
  } catch {
    /* quota / private mode */
  }
}
