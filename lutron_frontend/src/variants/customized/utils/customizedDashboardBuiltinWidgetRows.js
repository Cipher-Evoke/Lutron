/**
 * Built-in dashboard widgets that must always appear in customized Settings → Widgets,
 * even when the API omits them or page-assignment filters drop them.
 */
export const CUSTOMIZED_GUARANTEED_ENERGY_BUILTIN_ROWS = [
  { key: "consumption_saving", label: "Energy (Combined)" },
];

export const CUSTOMIZED_GUARANTEED_SPACE_BUILTIN_ROWS = [
  { key: "instant_utilization_combined", label: "Space Utilization (Combined)" },
];

export function mergeGuaranteedCustomizedBuiltinRows(rows, guaranteedRows, section) {
  const seen = new Set(
    (Array.isArray(rows) ? rows : []).map((row) => String(row?.key ?? "").trim())
  );
  const extras = (Array.isArray(guaranteedRows) ? guaranteedRows : [])
    .filter((row) => {
      const key = String(row?.key ?? "").trim();
      return key && !seen.has(key);
    })
    .map((row) => ({
      key: String(row.key).trim(),
      dropdown_name: row.label || row.key,
      isCustom: false,
      graph: null,
      section,
    }));
  return [...(Array.isArray(rows) ? rows : []), ...extras];
}
