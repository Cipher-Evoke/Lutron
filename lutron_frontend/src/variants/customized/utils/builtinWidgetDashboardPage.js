/**
 * Optional per–widget-key dashboard assignment (Energy vs Space) for built-in widgets (localStorage).
 * Used by Settings → Widgets and dashboard visibility.
 */
export const BUILTIN_WIDGET_DASHBOARD_PAGE_KEY = "builtinWidgetDashboardPage";

const ENERGY_BUILTIN_KEYS = new Set([
    "savings_by_strategy",
    "total_consumption_by_group",
    "consumption_by_area_groups",
    "consumption",
    "savings",
    "consumption_saving",
    "light_power_density",
    "peak_and_minimum_consumption",
]);

const SPACE_BUILTIN_KEYS = new Set([
    "utilization",
    "instant_occupancy_count",
    "instant_utilization_combined",
    "utilization_by_area_group",
    "peak_and_minimum_utilization",
    "utilization_by_area",
]);

export function defaultBuiltinDashboardPage(widgetKey) {
    const k = String(widgetKey ?? "").trim();
    if (ENERGY_BUILTIN_KEYS.has(k)) return "energy";
    if (SPACE_BUILTIN_KEYS.has(k)) return "space";
    return "energy";
}

export function readBuiltinWidgetDashboardPage() {
    try {
        const raw = localStorage.getItem(BUILTIN_WIDGET_DASHBOARD_PAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
        return {};
    }
}

export function writeBuiltinWidgetDashboardPage(next) {
    try {
        localStorage.setItem(BUILTIN_WIDGET_DASHBOARD_PAGE_KEY, JSON.stringify(next || {}));
        window.dispatchEvent(new CustomEvent("builtinWidgetDashboardPageUpdated"));
    } catch {
        // ignore
    }
}

export function setBuiltinWidgetDashboardPage(widgetKey, page) {
    const key = String(widgetKey ?? "").trim();
    if (!key) return;
    const p = page === "energy" || page === "space" ? page : null;
    const cur = readBuiltinWidgetDashboardPage();
    const def = defaultBuiltinDashboardPage(key);
    if (!p || p === def) {
        const { [key]: _, ...rest } = cur;
        writeBuiltinWidgetDashboardPage(rest);
        return;
    }
    writeBuiltinWidgetDashboardPage({ ...cur, [key]: p });
}

export function getEffectiveBuiltinDashboardPage(widgetKey) {
    const key = String(widgetKey ?? "").trim();
    if (!key) return "energy";
    // Combined widgets always belong on their canonical tab (ignore stale localStorage overrides).
    if (key === "instant_utilization_combined") return "space";
    if (key === "consumption_saving") return "energy";
    const cur = readBuiltinWidgetDashboardPage();
    const o = cur[key];
    if (o === "energy" || o === "space") return o;
    return defaultBuiltinDashboardPage(key);
}

export { ENERGY_BUILTIN_KEYS, SPACE_BUILTIN_KEYS };
