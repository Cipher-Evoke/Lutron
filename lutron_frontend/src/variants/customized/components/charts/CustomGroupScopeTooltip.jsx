import React from "react";

/**
 * Shared tooltip for Energy + Space custom graphs.
 *
 * Supports:
 * - Multi-series line/bar tooltip: list each series and value.
 * - When group_scope is set (user_only/special_only/special_and_user):
 *   - For line/bar: group -> areas breakdown using the hovered row.
 *   - For pie/circular: group -> areas breakdown using totals across rows or provided areaSlices.
 */
export function buildAreaNameToGroupNameMap(areaGroups, scope) {
  const s = String(scope || "").trim().toLowerCase();
  const lists =
    s === "special_only"
      ? [areaGroups?.special_area_groups || []]
      : s === "user_only"
        ? [areaGroups?.user_area_groups || []]
        : s === "special_and_user"
          ? [areaGroups?.special_area_groups || [], areaGroups?.user_area_groups || []]
          : [];

  const out = new Map();
  // Overlap mode: allow an area to map to multiple groups.
  for (const list of lists) {
    for (const g of list) {
      const groupName = String(g?.name ?? "").trim();
      if (!groupName) continue;
      const areas = Array.isArray(g?.areas) ? g.areas : [];
      for (const a of areas) {
        const areaName = String(a?.name ?? "").trim();
        if (!areaName) continue;
        if (!out.has(areaName)) out.set(areaName, []);
        const arr = out.get(areaName);
        if (Array.isArray(arr) && !arr.includes(groupName)) arr.push(groupName);
      }
    }
  }
  return out;
}

function tooltipShell(title, body) {
  return (
    <div
      style={{
        backgroundColor: "#807864",
        border: "1px solid #fff",
        borderRadius: "4px",
        padding: "10px",
        color: "#fff",
        fontSize: "12px",
      }}
    >
      {title ? (
        <p
          style={{
            margin: "0 0 8px 0",
            fontWeight: "bold",
            borderBottom: "1px solid #fff",
            paddingBottom: "4px",
          }}
        >
          {title}
        </p>
      ) : null}
      {body}
    </div>
  );
}

export default function CustomGroupScopeTooltip({
  active,
  payload,
  label,
  unit = "",
  groupScope,
  areaGroups,
  // For line/bar: row payload has per-area values
  row,
  // For pie/circular: provide either areaSlices (area->value) or rows+valueGetter to sum totals
  areaSlices,
  rowsForTotals,
  getRowValue,
  showPercent = false,
  labelFormatter = (v) => v,
  graphName,
}) {
  if (!active || !payload?.length) return null;

  const scope = String(groupScope || "").trim().toLowerCase();
  const areaNameToGroup =
    scope === "user_only" || scope === "special_only" || scope === "special_and_user"
      ? buildAreaNameToGroupNameMap(areaGroups, scope)
      : null;

  // Group -> areas breakdown (line/bar)
  if (row && areaNameToGroup && areaNameToGroup.size) {
    const groupToAreas = new Map();
    for (const [areaName, groupNames] of areaNameToGroup.entries()) {
      if (!Array.isArray(groupNames) || groupNames.length === 0) continue;
      for (const gn of groupNames) {
        const gname = String(gn || "").trim();
        if (!gname) continue;
        if (!groupToAreas.has(gname)) groupToAreas.set(gname, new Set());
        groupToAreas.get(gname).add(areaName);
      }
    }

    // In Recharts, `payload` may include multiple series at the hovered x-value.
    // UX requirement: only show the WS list for the *hovered* series, not all series.
    const hoveredKey = String(payload?.[0]?.dataKey ?? payload?.[0]?.name ?? "").trim();
    const hoveredValue = payload?.[0]?.value;
    const groupsInLegend = (hoveredKey ? [hoveredKey] : [])
      .map((s) => String(s).trim())
      .filter(Boolean);

    // Requirement: do NOT show all WS names. Only show hovered series name + value (+ unit/%).
    return tooltipShell(
      (() => {
        const t = label != null ? String(label) : "";
        if (!hoveredKey) return t;
        const v = hoveredValue != null ? hoveredValue : 0;
        const suffix = showPercent ? " %" : "";
        const unitSuffix = !showPercent && unit ? ` ${unit}` : "";
        return t
          ? `${t} — ${hoveredKey}: ${v}${suffix}${unitSuffix}`
          : `${hoveredKey}: ${v}${suffix}${unitSuffix}`;
      })(),
      null
    );
  }

  // Group -> areas breakdown (pie/circular)
  if (areaNameToGroup && areaNameToGroup.size && areaSlices && payload?.[0]?.name != null) {
    const hoveredName = String(payload[0].name || "").trim();
    if (hoveredName) {
      const contributingAreas = Array.from(areaNameToGroup.keys()).filter((a) => {
        const gnames = areaNameToGroup.get(a);
        return Array.isArray(gnames) && gnames.includes(hoveredName);
      });

      const areaValue = (a) => {
        // Prefer explicit slices (area->value)
        if (Array.isArray(areaSlices)) {
          const hit = areaSlices.find((s) => String(s?.name ?? "").trim() === a);
          if (hit) return hit.value ?? 0;
        }
        // Otherwise sum from rows
        if (Array.isArray(rowsForTotals) && typeof getRowValue === "function") {
          return rowsForTotals.reduce((acc, r) => acc + (Number(getRowValue(r, a)) || 0), 0);
        }
        return 0;
      };

      return tooltipShell(
        null,
        <>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>{hoveredName}</div>
          {contributingAreas.map((a) => (
            <div
              key={`${hoveredName}_${a}`}
              style={{ display: "flex", justifyContent: "space-between", gap: 12, margin: "2px 0" }}
            >
              <span>{labelFormatter(a)}</span>
              <span style={{ fontWeight: 700 }}>{areaValue(a)}</span>
            </div>
          ))}
        </>
      );
    }
  }

  // Default: list each series in payload
  return tooltipShell(
    label != null ? String(label) : "",
    payload.map((entry, index) => {
      const rawKey = String(entry.name || entry.dataKey || "").trim();
      const isGeneric = rawKey === "data" || rawKey === "y";
      const seriesLabel = isGeneric ? "Count" : labelFormatter(rawKey);
      const suffix = showPercent ? " %" : "";
      const unitSuffix = !showPercent && unit ? ` ${unit}` : "";

      // If the tooltip header (label) already shows this series identity,
      // show graphName (widget title) as the series label instead, matching bar chart style.
      const labelStr = label != null ? String(label) : "";
      const labelAlreadyShown = labelStr && (labelStr === seriesLabel || labelStr.includes(rawKey));
      const displayLabel = labelAlreadyShown ? (graphName || null) : seriesLabel;

      return (
        <p key={index} style={{ margin: "4px 0", color: "#fff", fontWeight: "500" }}>
          {displayLabel ? <>{displayLabel} - </> : null}
          {entry.value}
          {suffix}
          {unitSuffix}
        </p>
      );
    })
  );
}

