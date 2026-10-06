/**
 * Frontend-only unit fallback map.
 *
 * Prefer backend-provided `unit` whenever present. Use these only when the API omits unit,
 * so existing charts that already provide units are not affected.
 */
function normStr(x) {
  return String(x ?? '').trim();
}

export function inferUnitFromChartTitle(title) {
  const t = normStr(title).toLowerCase();
  if (!t) return '';
  // "Consumption" charts in Energy dashboard are energy over time in this app (Wh),
  // not instantaneous power (W). Use Wh as a safe fallback when backend omits `unit`.
  if (t.includes('consumption')) return 'Wh';
  if (t.includes('savings')) return '%';
  if (t.includes('utilization')) return '%';
  if (t.includes('occupancy')) return 'people';
  if (t.includes('light power density') || t.includes('power density')) return 'W/m²';
  return '';
}

export function inferUnitFromApiPath(apiPath) {
  const p = normStr(apiPath).toLowerCase();
  if (!p) return '';
  // Energy consumption endpoints return energy (Wh) in this app.
  if (p.includes('energy_consumption')) return 'Wh';
  if (p.includes('energy_savings')) return '%';
  if (p.includes('saving_by_stratergy') || p.includes('saving_by_strategy')) return '%';
  if (p.includes('space_utilization_per')) return '%';
  if (p.includes('occupancy_count') || p.includes('instant_occupancy_count')) return 'people';
  if (p.includes('light_power_density')) return 'W/m²';
  if (p.includes('total_consumption/by_group')) return 'Wh';
  if (p.includes('occupancy_by_group')) return '%';
  return '';
}

