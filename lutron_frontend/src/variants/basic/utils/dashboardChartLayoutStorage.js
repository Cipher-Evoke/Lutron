/**
 * Dashboard chart slot order — same-origin localStorage only (survives logout; see TopbarComponent).
 * Space orders were previously in sessionStorage; we migrate once from session → local.
 */
export const DASHBOARD_ENERGY_CHART_ORDER_STORAGE_KEY = 'dashboard-energy-chart-slot-order-v1'

export const SPACE_CHARTS_TAB_ORDER_STORAGE_KEY = 'space-charts-tab-slot-order-v2'
export const SPACE_MAIN_TAB_ORDER_STORAGE_KEY = 'space-main-tab-slot-order-v1'

/** @deprecated use SPACE_CHARTS_TAB_ORDER_STORAGE_KEY */
export const SPACE_CHARTS_TAB_ORDER_SESSION_KEY = SPACE_CHARTS_TAB_ORDER_STORAGE_KEY
/** @deprecated use SPACE_MAIN_TAB_ORDER_STORAGE_KEY */
export const SPACE_MAIN_TAB_ORDER_SESSION_KEY = SPACE_MAIN_TAB_ORDER_STORAGE_KEY

export function migrateSpaceChartOrdersFromSessionToLocalOnce() {
  try {
    for (const k of [SPACE_CHARTS_TAB_ORDER_STORAGE_KEY, SPACE_MAIN_TAB_ORDER_STORAGE_KEY]) {
      if (!localStorage.getItem(k)) {
        const fromSession = sessionStorage.getItem(k)
        if (fromSession != null) localStorage.setItem(k, fromSession)
      }
    }
  } catch {
    /* ignore */
  }
}

function readSpaceChartsTabRawWithLegacy() {
  migrateSpaceChartOrdersFromSessionToLocalOnce()
  try {
    const loc = localStorage.getItem(SPACE_CHARTS_TAB_ORDER_STORAGE_KEY)
    if (loc != null) return loc
    return sessionStorage.getItem(SPACE_CHARTS_TAB_ORDER_STORAGE_KEY)
  } catch {
    return null
  }
}

function readSpaceMainTabRawWithLegacy() {
  migrateSpaceChartOrdersFromSessionToLocalOnce()
  try {
    const loc = localStorage.getItem(SPACE_MAIN_TAB_ORDER_STORAGE_KEY)
    if (loc != null) return loc
    return sessionStorage.getItem(SPACE_MAIN_TAB_ORDER_STORAGE_KEY)
  } catch {
    return null
  }
}

export function readDashboardChartLayoutSnapshotForLogout() {
  try {
    return {
      energyOrder: localStorage.getItem(DASHBOARD_ENERGY_CHART_ORDER_STORAGE_KEY),
      spaceChartsTab: readSpaceChartsTabRawWithLegacy(),
      spaceMainTab: readSpaceMainTabRawWithLegacy(),
    }
  } catch {
    return { energyOrder: null, spaceChartsTab: null, spaceMainTab: null }
  }
}

/** Call once after `localStorage.clear()` (before or after sessionStorage.clear — layout is all local now). */
export function restoreDashboardChartLayoutAfterLocalStorageClear(snapshot) {
  if (!snapshot) return
  try {
    if (snapshot.energyOrder != null) {
      localStorage.setItem(DASHBOARD_ENERGY_CHART_ORDER_STORAGE_KEY, snapshot.energyOrder)
    }
    if (snapshot.spaceChartsTab != null) {
      localStorage.setItem(SPACE_CHARTS_TAB_ORDER_STORAGE_KEY, snapshot.spaceChartsTab)
    }
    if (snapshot.spaceMainTab != null) {
      localStorage.setItem(SPACE_MAIN_TAB_ORDER_STORAGE_KEY, snapshot.spaceMainTab)
    }
  } catch {
    /* quota / private mode */
  }
}

/** LongPressDraggable persists {x,y} offsets in sessionStorage under these prefixes */
const DRAGGABLE_SESSION_KEY_PREFIXES = ['dashboard-energy-', 'space-charts-', 'space-tab-']

export function readDashboardDraggableSessionSnapshotForLogout() {
  const entries = {}
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i)
      if (!k) continue
      if (DRAGGABLE_SESSION_KEY_PREFIXES.some((p) => k.startsWith(p))) {
        const v = sessionStorage.getItem(k)
        if (v != null) entries[k] = v
      }
    }
  } catch {
    /* ignore */
  }
  return entries
}

/** Call after `sessionStorage.clear()` so chart nudge offsets survive logout/login in the same browser */
export function restoreDashboardDraggableSessionAfterClear(entries) {
  if (!entries || typeof entries !== 'object') return
  try {
    for (const [k, v] of Object.entries(entries)) {
      if (v != null) sessionStorage.setItem(k, v)
    }
  } catch {
    /* ignore */
  }
}
