import React, { useMemo, useState, useCallback } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Label,
} from "recharts";
import {
  buildTotalConsumptionByGroupPieRows,
  isTotalConsumptionByGroupApiPath,
} from "../../utils/buildTotalConsumptionByGroupPieRows";
import { normalizeTotalConsumptionByGroupPayload } from "../../utils/normalizeTotalConsumptionByGroupPayload";
import { inferUnitFromApiPath, inferUnitFromChartTitle } from "../../utils/inferDashboardUnitFallback";
import { DASHBOARD_CHART_PLOT_BACKGROUND } from "../../utils/dashboardChartPlotSurface";
import { resolveEnergyChartTheme } from "../../../../shared/dashboard/charts/themes/energyChartTheme";
import { isAreaGroupChartScope } from "../../utils/filterGroupIdsByAreaGroupScope";
import CustomGroupScopeTooltip, { buildAreaNameToGroupNameMap } from "../charts/CustomGroupScopeTooltip";
import ChartSizeBox from "./ChartSizeBox";
import { BUILTIN_CUSTOM_GRAPH_PLOT_HEIGHT } from "../../utils/advancedBuiltinChartStyles";

/**
 * Built-in `fetchSavingsByStrategy` shape: `{ status: 'success', data: { 'Strategy A': 12.5, ... } }`.
 * Custom graphs previously only handled array `data` or x/y-axis; this maps the object to pie rows.
 */

function floorDisplayName(floors, floorId) {
  const n = typeof floorId === "number" ? floorId : parseInt(String(floorId), 10);
  if (Number.isNaN(n)) return String(floorId);
  const f = Array.isArray(floors) ? floors.find((x) => Number(x?.id) === n) : null;
  return f?.floor_name || f?.name || `Floor ${n}`;
}
function toEnergyThunkArgs(merged) {
  if (!merged) return null;
  return {
    areaIds: merged.areaIds ?? null,
    floorIds: merged.floorIds ?? [],
    groupIds: merged.groupIds ?? null,
    timeRange: merged.timeRange,
    startDate: merged.startDate,
    endDate: merged.endDate,
    isNavigating: merged.isNavigating ?? false,
  };
}
function getGenericEnergyPieRowsFromRaw(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  // Support both { status, data: { area: val } } and raw { area: val }
  const inner = (raw.data && typeof raw.data === "object" && !Array.isArray(raw.data)) ? raw.data : raw;
  const rows = [];
  for (const [k, v] of Object.entries(inner)) {
    if (k === "status" || k === "widget_title" || k === "state" || k === "message" || k === "detail" || k === "unit") continue;
    // Skip if it's the XY structure (handled elsewhere)
    if (k === "x-axis" || k === "y-axis" || k === "consumption" || k === "savings") continue;
    if (v !== null && typeof v === "object") continue;
    const n = Number(v);
    if (Number.isFinite(n)) rows.push({ name: String(k), value: n });
  }
  return rows.length > 0 ? rows : null;
}

const DASHBOARD_PALETTE = [
  '#2196f3', // Blue (for 1st floor)
  '#4caf50', // Green (for 2nd floor)
  '#ff9800', // Orange (for 3rd floor)
  '#e57373', '#ba68c8', '#4db6ac',
  '#ff8a65', '#7986cb', '#aed581', '#ffb74d', '#f06292', '#4fc3f7',
  '#fff176', '#e1bee7', '#b2dfdb', '#ffcc02', '#ff8a80',
  '#82b1ff', '#b9f6ca', '#ffe082', '#d1c4e9', '#c8e6c9', '#ffcdd2',
  '#bbdefb', '#c5cae9', '#f8bbd9', '#dcedc8', '#fff9c4', '#ffecb3'
];

function getColorForName(name) {
  if (!name) return DASHBOARD_PALETTE[0];
  const s = String(name).toLowerCase().trim();
  if (s.includes("1st floor")) return DASHBOARD_PALETTE[0]; // Blue
  if (s.includes("2nd floor")) return DASHBOARD_PALETTE[1]; // Green
  if (s.includes("3rd floor")) return DASHBOARD_PALETTE[2]; // Orange

  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = s.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % (DASHBOARD_PALETTE.length - 3) + 3;
  return DASHBOARD_PALETTE[index];
}

function getSavingsStrategyPieRowsFromRaw(raw) {
  return getGenericEnergyPieRowsFromRaw(raw);
}

function isSavingsStrategyApiPath(apiPath) {
  const p = String(apiPath || "").toLowerCase();
  return p.includes("saving_by_stratergy") || p.includes("saving_by_strategy");
}

/** Custom pie widgets using unified energy endpoints — use split + scroll legend when many slices. */
function isEnergyConsumptionOrSavingsPieApiPath(apiPath) {
  const p = String(apiPath || "").toLowerCase();
  return p.includes("energy_consumption") || p.includes("energy_savings");
}

/** At this count or above, use left/right scrollable columns (energy consumption/savings pies only). */
const ENERGY_PIE_DUAL_LEGEND_MIN_SLICES = 4;

function EnergyPieDualLegendColumn({ slices, graphId, getSeriesColor, setCustomColor, colorPickerOpen, setColorPickerOpen }) {
  return (
    <div
      style={{
        flex: "0 0 26%",
        minWidth: 0,
        maxHeight: "100%",
        overflowY: "auto",
        overflowX: "hidden",
        padding: "4px 2px",
        boxSizing: "border-box",
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(255,255,255,0.35) transparent",
      }}
    >
      {slices.map((s, i) => {
        const name = String(s.name);
        const color = getSeriesColor(graphId, name);
        const isPickerTarget = colorPickerOpen?.graphId === graphId && colorPickerOpen?.seriesName === name;
        return (
          <div
            key={`${graphId}_leg_${name}_${i}`}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 6,
              marginBottom: 6,
              fontSize: 11,
              lineHeight: 1.25,
              position: 'relative'
            }}
          >
            <span
              onClick={(e) => {
                e.stopPropagation();
                setColorPickerOpen(isPickerTarget ? null : { graphId, seriesName: name });
              }}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                flexShrink: 0,
                background: color,
                marginTop: 3,
                cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.3)'
              }}
              title="Click to change color"
            />
            {isPickerTarget && (
              <div
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute', bottom: 15, left: 15, zIndex: 1000,
                  background: '#2a2a2a', border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 8, padding: 8,
                  display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  minWidth: '240px'
                }}
                data-picker-active="true"
              >
                {DASHBOARD_PALETTE.map((c) => (
                  <div
                    key={c}
                    onClick={() => { setCustomColor(graphId, name, c); setColorPickerOpen(null); }}
                    style={{
                      width: 20, height: 20, borderRadius: 4,
                      backgroundColor: c, cursor: 'pointer',
                      border: color === c ? '2px solid #fff' : '2px solid transparent',
                    }}
                  />
                ))}
              </div>
            )}
            <span
              style={{ color: "rgba(255,255,255,0.9)", wordBreak: "break-word" }}
              title={name}
            >
              {name}
            </span>
          </div>
        );
      })}
    </div>
  );
}


function isTimeSeriesLabel(label) {
  if (!label) return false;
  const s = String(label);
  // Matches "00:00", "00:15:00", "2024-04-16", etc.
  return s.includes(":") || /\d{4}-\d{2}-\d{2}/.test(s) || /^[A-Za-z]{3} \d+$/.test(s);
}

/** Rich hover title for per-floor custom energy payloads (x-axis stays short; tooltips add area names). */
function perFloorEnergyTooltipTitleFromRaw(raw, categoryLabel) {
  if (!raw || typeof raw !== "object" || raw.__isPerFloorEnergyData !== true) return null;
  const titles = raw.__perFloorTooltipTitles;
  if (!Array.isArray(titles) || titles.length === 0) return null;
  const xAxis = raw["x-axis"];
  if (!Array.isArray(xAxis)) return null;
  const idx = xAxis.findIndex((x) => String(x) === String(categoryLabel));
  if (idx < 0 || idx >= titles.length) return null;
  const t = titles[idx];
  return t != null && String(t).trim() !== "" ? String(t).trim() : null;
}

/**
 * Resolve numeric area_id from a chart series label. Duplicate area names across floors require
 * disambiguation via preferredAreaIds (widget graph.area_ids and/or dashboard selection).
 */
function resolveAreaIdForLabel(rawLabel, displayMap, preferredAreaIds) {
  const s = String(rawLabel ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  if (Number.isFinite(n) && !Number.isNaN(n)) return n;
  const m = /^Area (\d+)$/i.exec(s);
  if (m) {
    const id = Number(m[1]);
    if (Number.isFinite(id)) return id;
  }
  const map = displayMap instanceof Map ? displayMap : new Map(Object.entries(displayMap || {}));
  const candidates = [];
  map.forEach((val, key) => {
    if (typeof key === "number" && String(val).trim() === s) {
      candidates.push(key);
    }
  });
  if (candidates.length === 0) return null;
  const pref = Array.isArray(preferredAreaIds)
    ? preferredAreaIds.map((x) => Number(x)).filter((x) => Number.isFinite(x))
    : [];
  const hitPref = candidates.filter((id) => pref.includes(id));
  if (hitPref.length === 1) return hitPref[0];
  if (candidates.length === 1) return candidates[0];
  if (hitPref.length > 0) return hitPref[0];
  return candidates[0];
}

/**
 * Shared Energy dashboard card for custom graphs and built-in widgets with API/path overrides.
 */
export default function EnergyCustomGraphCard({
  g,
  chartHeaderStyle,
  customGraphData,
  customGraphLoading,
  customGraphError,
  transformDataForCharts,
  onExport,
  areaGroups,
  areaIdToDisplayName,
  areaIdToFloorId,
  floors,
  dashboardApiParams,
  shellVariant = 'customized',
  advancedSurface = null,
  /** basic only: `light` matches standalone white-theme charts; `dark` keeps legacy brown card */
  chartSurface = 'dark',
}) {
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exportBusy, setExportBusy] = useState({ email: false, download: false });
  const [lightingUnit, setLightingUnit] = useState("Watt / Sq ft");
  const [pieActiveIndex, setPieActiveIndex] = useState(0);
  const [focusedSeriesByGraph, setFocusedSeriesByGraph] = useState({});
  const [hoveredSeries, setHoveredSeries] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Custom color assignments per graph (localStorage-persisted, custom graphs only)
  const [customSeriesColors, setCustomSeriesColors] = useState(() => {
    try {
      const raw = localStorage.getItem('customGraphSeriesColors');
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });
  const [colorPickerOpen, setColorPickerOpen] = useState(null); // { graphId, seriesName }

  // Auto-close picker when clicking outside
  React.useEffect(() => {
    if (!colorPickerOpen) return;
    const handleClickOutside = (event) => {
      // Find picker element by its special attribute
      const picker = document.querySelector('[data-picker-active="true"]');
      if (picker && !picker.contains(event.target)) {
        setColorPickerOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [colorPickerOpen]);

  const getCustomColor = useCallback((graphId, seriesName) => {
    return customSeriesColors?.[graphId]?.[seriesName] || null;
  }, [customSeriesColors]);

  const setCustomColor = useCallback((graphId, seriesName, color) => {
    setCustomSeriesColors((prev) => {
      const next = { ...prev, [graphId]: { ...(prev?.[graphId] || {}), [seriesName]: color } };
      try { localStorage.setItem('customGraphSeriesColors', JSON.stringify(next)); } catch { }
      return next;
    });
  }, []);

  const getSeriesColor = useCallback((graphId, seriesName) => {
    return getCustomColor(graphId, seriesName) || getColorForName(seriesName);
  }, [getCustomColor]);

  const canExport = typeof onExport === "function";
  const graphKey = useMemo(() => String(g?.id ?? g?.name ?? ""), [g?.id, g?.name]);

  const cardChrome = useMemo(() => {
    if (shellVariant === 'advanced') {
      const surface = advancedSurface || {};
      return {
        shell: {
          background: surface.cardBackground || 'var(--dashboard-card-background, #232323)',
          borderRadius: '8px',
          padding: '18px',
          boxShadow: surface.cardShadow || '0 2px 4px rgba(0,0,0,0.1)',
          height: '100%',
          minHeight: 0,
          boxSizing: 'border-box',
          border: surface.cardBorder || '1px solid #ccc',
          display: 'flex',
          flexDirection: 'column',
        },
        plot: {
          backgroundColor: 'transparent',
          border: '1px solid rgba(255,255,255,0.16)',
          color: chartHeaderStyle?.color || '#fff',
        },
        exportColor: '#fff',
        exportBorder: '1px solid rgba(255,255,255,0.22)',
      };
    }
    if (shellVariant === 'basic') {
      const theme = resolveEnergyChartTheme({ chartSurface });
      return {
        shell: {
          backgroundColor: theme.outerBg,
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          height: '100%',
          minHeight: 0,
          boxSizing: 'border-box',
          border: theme.outerBorder,
          display: 'flex',
          flexDirection: 'column',
        },
        plot: {
          backgroundColor: theme.plotBg,
          border: theme.plotBorder,
          color: theme.header,
        },
        exportColor: theme.exportBtn,
        exportBorder:
          chartSurface === 'light'
            ? '1px solid rgba(0,0,0,0.12)'
            : '1px solid rgba(255,255,255,0.22)',
        chartTheme: theme,
      };
    }
    return {
      shell: {
        background: 'linear-gradient(180deg, rgba(128,120,100,0.55) 0%, rgba(128,120,100,0.40) 100%)',
        borderRadius: '14px',
        padding: '18px',
        boxShadow: '0 10px 28px rgba(0,0,0,0.18)',
        height: '100%',
        minHeight: 0,
        boxSizing: 'border-box',
        border: '1px solid rgba(255,255,255,0.16)',
        display: 'flex',
        flexDirection: 'column',
        backdropFilter: 'blur(6px)',
      },
      plot: {
        backgroundColor: DASHBOARD_CHART_PLOT_BACKGROUND,
        border: '1px solid rgba(255,255,255,0.10)',
        color: '#fff',
      },
      exportColor: '#fff',
      exportBorder: '1px solid rgba(255,255,255,0.22)',
    };
  }, [shellVariant, advancedSurface, chartHeaderStyle?.color, chartSurface]);

  /** Prefer widget + dashboard area ids when the same display name exists on multiple floors. */
  const scopedAreaIdsForLabels = useMemo(() => {
    const rawG = Array.isArray(g?.area_ids) ? g.area_ids : [];
    const rawD = Array.isArray(dashboardApiParams?.areaIds) ? dashboardApiParams.areaIds : [];
    const out = [];
    const seen = new Set();
    for (const x of [...rawG, ...rawD]) {
      const n = typeof x === "number" && !Number.isNaN(x) ? x : parseInt(String(x), 10);
      if (Number.isFinite(n) && !seen.has(n)) {
        seen.add(n);
        out.push(n);
      }
    }
    return out;
  }, [g?.area_ids, dashboardApiParams?.areaIds]);

  const resolveFullTooltipLabel = useCallback(
    (label) => {
      if (!label || isTimeSeriesLabel(label)) return label;
      const s = String(label).trim();

      const displayMap = areaIdToDisplayName instanceof Map ? areaIdToDisplayName : new Map(Object.entries(areaIdToDisplayName || {}));
      const floorIdMap = areaIdToFloorId instanceof Map ? areaIdToFloorId : new Map(Object.entries(areaIdToFloorId || {}));

      // 1. Resolve for display name (Area Name)
      const res = displayMap.get(s) || displayMap.get(Number(s)) || displayMap.get(String(s)) || s;
      const actualName = String(res).trim();

      // 2. Floor ID must come from numeric area_id only (names are not unique across floors).
      const aid = resolveAreaIdForLabel(s, displayMap, scopedAreaIdsForLabels);
      let fid =
        aid != null ? floorIdMap.get(aid) ?? floorIdMap.get(Number(aid)) : undefined;
      if (fid == null) {
        fid = floorIdMap.get(s) || floorIdMap.get(Number(s)) || floorIdMap.get(String(s));
      }

      if (fid != null && floors) {
        const floorLookup = new Map();
        (floors || []).forEach((f) => {
          if (f && f.id != null) floorLookup.set(Number(f.id), f);
        });
        const f = floorLookup.get(Number(fid));
        if (f) {
          const fName = f.floor_name || f.name;
          return `${fName}/${actualName}`;
        }
      }

      return actualName;
    },
    [areaIdToDisplayName, areaIdToFloorId, floors, scopedAreaIdsForLabels]
  );

  const resolveJustAreaName = useCallback(
    (label) => {
      if (!label || isTimeSeriesLabel(label)) return label;
      const s = String(label).trim();
      if (areaIdToDisplayName) {
        const displayMap = areaIdToDisplayName instanceof Map ? areaIdToDisplayName : new Map(Object.entries(areaIdToDisplayName).map(([k, v]) => [k, v]));
        const resolved = displayMap.get(s) || displayMap.get(Number(s)) || displayMap.get(String(s));
        if (resolved) return resolved;
      }
      return s;
    },
    [areaIdToDisplayName]
  );

  const isLightPowerDensity = useMemo(
    () => String(g?.api_path ?? "").includes("light_power_density"),
    [g?.api_path]
  );

  const handleExportClick = async (action) => {
    if (!canExport) return;
    if (!graphKey) {
      // eslint-disable-next-line no-console
      console.warn("Export requested but graph id/name is empty.");
      return;
    }
    setExportBusy((prev) => ({ ...prev, [action]: true }));
    try {
      await onExport(action, g);
    } catch (e) {
      // Parent handles snackbar; this is just a fallback.
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      setExportBusy((prev) => ({ ...prev, [action]: false }));
      setExportMenuOpen(false);
    }
  };

  return (
    <div style={cardChrome.shell}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
          <h3
            style={{
              ...chartHeaderStyle,
              margin: 0,
              fontSize: 16,
              letterSpacing: 0.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color:
                shellVariant === 'basic'
                  ? cardChrome.chartTheme?.header ?? chartHeaderStyle?.color
                  : chartHeaderStyle?.color,
            }}
          >
            {g?.name ? (g.name.charAt(0).toUpperCase() + g.name.slice(1)) : "Custom Graph"}
          </h3>
        </div>

        {canExport ? (
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setExportMenuOpen((v) => !v)}
              style={{
                background: "none",
                color: cardChrome.exportColor,
                border: cardChrome.exportBorder,
                borderRadius: 10,
                padding: "7px 12px",
                fontWeight: 800,
                cursor: "pointer",
                fontSize: 13,
                letterSpacing: 0.2,
              }}
              aria-haspopup="menu"
              aria-expanded={exportMenuOpen}
              title="Export this graph"
            >
              📤 Export
            </button>
            {exportMenuOpen ? (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 10px)",
                  right: 0,
                  backgroundColor: "#CDC0A0",
                  border: "1px solid #444",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                  zIndex: 1000,
                  minWidth: 200,
                  padding: "8px 0",
                }}
              >
                <button
                  type="button"
                  onClick={() => handleExportClick("email")}
                  disabled={exportBusy.email}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "none",
                    background: "none",
                    cursor: exportBusy.email ? "not-allowed" : "pointer",
                    textAlign: "left",
                    fontSize: 14,
                    color: exportBusy.email ? "#999" : "#fff",
                    fontWeight: 700,
                    opacity: exportBusy.email ? 0.7 : 1,
                    borderBottom: "1px solid #444",
                  }}
                >
                  {exportBusy.email ? "Sending..." : "Send By Email"}
                </button>
                <button
                  type="button"
                  onClick={() => handleExportClick("download")}
                  disabled={exportBusy.download}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "none",
                    background: "none",
                    cursor: exportBusy.download ? "not-allowed" : "pointer",
                    textAlign: "left",
                    fontSize: 14,
                    color: exportBusy.download ? "#999" : "#fff",
                    fontWeight: 700,
                    opacity: exportBusy.download ? 0.7 : 1,
                  }}
                >
                  {exportBusy.download ? "Downloading..." : "Download To PC"}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      <div
        style={{
          height: BUILTIN_CUSTOM_GRAPH_PLOT_HEIGHT,
          minHeight: BUILTIN_CUSTOM_GRAPH_PLOT_HEIGHT,
          flexShrink: 0,
          display: "flex",
          alignItems: "stretch",
          justifyContent: "center",
          width: "100%",
          backgroundColor: cardChrome.plot.backgroundColor,
          borderRadius: shellVariant === 'customized' ? '14px' : '4px',
          color: cardChrome.plot.color,
          fontSize: "14px",
          padding: "12px",
          border: cardChrome.plot.border,
          boxSizing: "border-box",
        }}
      >
        {(() => {
          const id = String(g?.id ?? g?.name ?? "");
          const type = String(g?.graph_type || "bar").toLowerCase();
          const raw = id ? customGraphData[id] : null;
          let normalizedRaw = raw;
          const isLoading = id ? !!customGraphLoading[id] : false;
          const err = id ? customGraphError[id] : null;
          const ct = cardChrome.chartTheme;
          const tickFill = ct?.tick ?? "#fff";
          const gridStroke = ct?.grid ?? "rgba(255,255,255,0.08)";
          const legendColor = ct?.legend ?? "#fff";
          const emptyTextColor = ct?.emptyText ?? "#fff";
          const scrollThumb =
            chartSurface === 'light' ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.2)';

          const toNumberOrNull = (v) => {
            if (v === null || v === undefined) return 0;
            if (v === "null" || v === "None" || v === "") return 0;
            const n = Number(v);
            return Number.isFinite(n) ? n : 0;
          };

          let peakVal = null;
          let minVal = null;
          let peakTime = null;
          let minTime = null;

          const CenterMessage = ({ title, subtitle }) => (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                gap: 6,
                padding: 14,
                boxSizing: "border-box",
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 16, color: emptyTextColor }}>{title}</div>
              {subtitle ? (
                <div style={{ opacity: 0.8, fontSize: 12, lineHeight: 1.35 }}>{subtitle}</div>
              ) : null}
            </div>
          );

          if (isLoading) return <CenterMessage title="Loading…" subtitle="Fetching chart data" />;
          if (err) return <CenterMessage title="Error" subtitle={String(err)} />;
          if (raw == null) return <CenterMessage title="No data" subtitle={`Type: ${type.toUpperCase()}`} />;

          if (typeof raw === "string") return <CenterMessage title={raw} />;
          if (raw && typeof raw === "object") {
            const st = String(raw.status || raw.state || "").toLowerCase();
            if (st === "error") {
              return <CenterMessage title="Error" subtitle={String(raw.message || raw.detail || "Error")} />;
            }
            // Built-in `light_power_density` widget is a scalar response (watt_per_sqft / watt_per_sqm),
            // so custom graphs must render it explicitly (instead of trying to build XY charts).
            if (isLightPowerDensity) {
              let value = "No data";
              let unit = "";

              if (st === "success") {
                if (lightingUnit === "Watt / Sq ft") {
                  value = raw.watt_per_sqft;
                } else if (lightingUnit === "Watt / Sq m") {
                  value = raw.watt_per_sqm;
                }
                unit = raw.unit || "";
              }

              if (value === null || value === undefined) {
                value = "No data";
                unit = "";
              }

              return (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    padding: 12,
                    boxSizing: "border-box",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "flex-end",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <select
                      value={lightingUnit}
                      onChange={(e) => setLightingUnit(e.target.value)}
                      style={{
                        padding: "5px 10px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        backgroundColor: "white",
                        fontSize: "14px",
                        color: "#333",
                      }}
                    >
                      <option value="Watt / Sq ft">Watt / Sq ft</option>
                      <option value="Watt / Sq m">Watt / Sq m</option>
                    </select>
                  </div>

                  <div
                    style={{
                      width: "100%",
                      backgroundColor: DASHBOARD_CHART_PLOT_BACKGROUND,
                      borderRadius: 12,
                      padding: "16px 14px",
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      boxSizing: "border-box",
                      border: "1px solid rgba(255,255,255,0.10)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: "#fff",
                        marginBottom: 6,
                        lineHeight: 1.25,
                        wordWrap: "break-word",
                      }}
                    >
                      {String(value)} {unit}
                    </div>
                    <div style={{ fontSize: 12, color: "#ccc", fontWeight: 500 }} />
                  </div>
                </div>
              );
            }
            if (isSavingsStrategyApiPath(String(g?.api_path ?? ""))) {
              const strategyRows = getSavingsStrategyPieRowsFromRaw(raw);
              const isVirtualBuiltinOverride = String(g?.id || "").startsWith('builtin_');
              // For actual custom graphs with explicit graph_type set to bar/line, convert to bar format.
              // Do not alter built-in charts unless the user explicitly created a builtin override.
              const isCustomGraphWithExplicitType = !isVirtualBuiltinOverride && g?.graph_type && String(g.graph_type).toLowerCase() !== 'pie';
              if (strategyRows && strategyRows.length > 0) {
                const toNum = (v) => {
                  if (v === null || v === undefined) return 0;
                  if (v === "null" || v === "None" || v === "") return 0;
                  const n = Number(v);
                  return Number.isFinite(n) ? n : 0;
                };
                const safe = strategyRows
                  .map((r) => ({ name: String(r.name), value: toNum(r.value) }))
                  .filter((r) => r.value > 0);
                if (safe.length === 0) {
                  return (
                    <CenterMessage title="No data" subtitle="No positive values to display" />
                  );
                }

                // For custom graphs with bar/line type, convert strategy data to X-Y format
                if (isCustomGraphWithExplicitType) {
                  normalizedRaw = {
                    'x-axis': safe.map(s => s.name),
                    'y-axis': {
                      'Savings': safe.map(s => s.value)
                    }
                  };
                } else {
                  // Default: render as pie

                  return (
                    <div style={{ width: "100%", height: "100%" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={safe}
                            dataKey="value"
                            nameKey="name"
                            innerRadius="55%"
                            outerRadius="80%"
                            paddingAngle={2}
                            stroke="rgba(255,255,255,0.12)"
                          >
                            {safe.map((r, idx) => (
                              <Cell key={`${id}_savings_strategy_${idx}`} fill={getColorForName(r.name)} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend layout="vertical" align="right" verticalAlign="middle" />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  );
                }
              }
            }
            if (String(g?.api_path ?? "").includes("peak_min_consumption") || String(g?.api_path ?? "").includes("peak_and_minimum_consumption")) {
              peakVal = null;
              minVal = null;
              peakTime = null;
              minTime = null;

              if (raw.peak !== undefined || raw.min !== undefined) {
                if (raw.peak && typeof raw.peak === 'object') {
                  peakVal = raw.peak.value !== undefined ? raw.peak.value : raw.peak;
                  peakTime = raw.peak.time || raw.peak.time_stamp || raw.peakTime || raw.peak_time;
                } else {
                  peakVal = raw.peak;
                  peakTime = raw.peakTime || raw.peak_time || raw.peak_timestamp;
                }

                if (raw.min && typeof raw.min === 'object') {
                  minVal = raw.min.value !== undefined ? raw.min.value : raw.min;
                  minTime = raw.min.time || raw.min.time_stamp || raw.minTime || raw.min_time;
                } else {
                  minVal = raw.min;
                  minTime = raw.minTime || raw.min_time || raw.min_timestamp;
                }
              } else if (raw["x-axis"] && raw["y-axis"]) {
                const xAxis = raw["x-axis"];
                const yAxis = raw["y-axis"];
                const yValuesLists = Object.values(yAxis).filter(Array.isArray);
                const summedPoints = [];
                const isPercentage = String(raw?.unit || '').trim() === '%' || String(inferUnitFromApiPath(g?.api_path) || inferUnitFromChartTitle(g?.name) || '').trim() === '%';

                for (let i = 0; i < xAxis.length; i++) {
                  let sum = 0;
                  let count = 0;
                  let hasData = false;
                  for (const arr of yValuesLists) {
                    const val = arr[i];
                    if (val !== null && val !== undefined) {
                      const n = Number(val);
                      if (!Number.isNaN(n)) {
                        sum += n;
                        count++;
                        hasData = true;
                      }
                    }
                  }
                  if (hasData) {
                    const finalVal = (isPercentage && count > 0) ? (sum / count) : sum;
                    summedPoints.push({ value: finalVal, time: String(xAxis[i] || ""), index: i });
                  }
                }
                if (summedPoints.length > 0) {
                  const peakEntry = summedPoints.reduce((max, p) => p.value > max.value ? p : max, summedPoints[0]);
                  const tolerance = 1e-6;
                  const zeroes = summedPoints.filter(p => Math.abs(p.value) <= tolerance);
                  const minEntry = zeroes.length > 0
                    ? zeroes.reduce((best, curr) => curr.index < best.index ? curr : best, zeroes[0])
                    : summedPoints.reduce((m, p) => p.value < m.value ? p : m, summedPoints[0]);

                  peakVal = peakEntry.value;
                  minVal = minEntry.value;
                  peakTime = peakEntry.time;
                  minTime = minEntry.time;
                }
              }

              if (peakVal !== null || minVal !== null) {
                // Ensure we get the correct unit matching the built-in graph
                let unit = String(raw?.unit || '').trim();
                if (!unit) {
                  unit = String(inferUnitFromApiPath(g?.api_path) || inferUnitFromChartTitle(g?.name) || '').trim();
                }
                // Fallback clearly defaults to Wh if dealing with Consumption (matching built-in)
                if (!unit && String(g?.api_path || '').includes('consumption')) {
                  unit = 'Wh';
                }

                const formatVal = (v) => v !== null && v !== undefined ? `${Number.isFinite(Number(v)) ? Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 }) : v}${unit ? ` ${unit}` : ''}` : 'No data';

                return (
                  <div style={{ width: "100%", height: "100%", padding: "0", display: "flex", flexDirection: "row", gap: "15px", boxSizing: "border-box" }}>
                    <div style={{ flex: 1, backgroundColor: "#232323", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px 14px", border: "none" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 8, textAlign: "center", fontFamily: 'inherit' }}>Peak Load</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", textAlign: "center", lineHeight: 1.25, fontFamily: 'inherit', wordWrap: 'break-word', overflow: 'hidden' }}>{formatVal(peakVal)}</div>
                      <div style={{ fontSize: 11, color: "#ccc", marginTop: 6, fontWeight: 500, textAlign: "center", fontFamily: 'inherit' }}>{peakTime ? `at ${peakTime}` : ''}</div>
                    </div>
                    <div style={{ flex: 1, backgroundColor: "#232323", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px 14px", border: "none" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 8, textAlign: "center", fontFamily: 'inherit' }}>Min Load</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", textAlign: "center", lineHeight: 1.25, fontFamily: 'inherit', wordWrap: 'break-word', overflow: 'hidden' }}>{formatVal(minVal)}</div>
                      <div style={{ fontSize: 11, color: "#ccc", marginTop: 6, fontWeight: 500, textAlign: "center", fontFamily: 'inherit' }}>{minTime ? `at ${minTime}` : ''}</div>
                    </div>
                  </div>
                );
              }
            }
            const hasXYArrays =
              Array.isArray(normalizedRaw?.["x-axis"]) ||
              (normalizedRaw?.["y-axis"] && typeof normalizedRaw?.["y-axis"] === "object") ||
              Array.isArray(raw?.consumption) ||
              Array.isArray(raw?.savings);
            if (!hasXYArrays) {
              //   const scalar = raw.value ?? raw.count ?? raw.y ?? raw.result ?? raw.data;
              const scalar = raw.value ?? raw.count ?? raw.y ?? raw.result ?? raw.data ?? raw.consumption_wh;
              if (typeof scalar === "number" || (typeof scalar === "string" && scalar.trim() !== "")) {
                const unit = String(raw.unit || "").trim();
                return (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 28,
                      fontWeight: 900,
                      textAlign: "center",
                      padding: 12,
                      boxSizing: "border-box",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {unit ? `${String(scalar)} ${unit}` : String(scalar)}
                  </div>
                );
              }
            }
            if (raw.text != null || raw.valueText != null) {
              return <CenterMessage title={String(raw.text ?? raw.valueText)} />;
            }

            let normalized = normalizedRaw;
            if (normalizedRaw && typeof normalizedRaw === "object" && !Array.isArray(normalizedRaw)) {
              // Revert xAxis to simple names as requested (not prefixed with floor)
              let xAxis = normalizedRaw["x-axis"];
              const yAxisObj = normalizedRaw["y-axis"];

              if (!Array.isArray(xAxis) && yAxisObj && typeof yAxisObj === "object" && !Array.isArray(yAxisObj)) {
                const firstSeries = Object.values(yAxisObj).find((v) => Array.isArray(v));
                if (Array.isArray(firstSeries)) {
                  xAxis = Array.from({ length: firstSeries.length }).map((_, i) => String(i + 1));
                }
              }
              if (Array.isArray(xAxis) && yAxisObj && typeof yAxisObj === "object" && !Array.isArray(yAxisObj)) {
                const nextYAxis = {};
                for (const [seriesName, arr] of Object.entries(yAxisObj)) {
                  let sName = seriesName;
                  const lowerS = String(seriesName).toLowerCase();
                  if (lowerS === "data" || lowerS === "count" || lowerS === "value") {
                    const fallback = String(g?.name || "").trim();
                    if (fallback) {
                      sName = fallback.charAt(0).toUpperCase() + fallback.slice(1);
                    }
                    else if (String(g?.api_path || "").includes("consumption")) sName = "Total Consumption";
                    else if (String(g?.api_path || "").includes("savings")) sName = "Total Savings";
                    else sName = "Data";
                  }
                  nextYAxis[sName] = Array.isArray(arr) ? arr.map(toNumberOrNull) : [];
                }
                normalized = { ...normalizedRaw, "x-axis": xAxis, "y-axis": nextYAxis };
              } else if (Array.isArray(xAxis) && Array.isArray(normalizedRaw["y-axis"])) {
                let sName = "Data";
                const fallback = String(g?.name || "").trim();
                if (fallback) {
                  sName = fallback.charAt(0).toUpperCase() + fallback.slice(1);
                }
                else if (String(g?.api_path || "").includes("consumption")) sName = "Total Consumption";
                else if (String(g?.api_path || "").includes("savings")) sName = "Total Savings";
                normalized = { ...normalizedRaw, "y-axis": { [sName]: normalizedRaw["y-axis"].map(toNumberOrNull) } };
              } else if (Array.isArray(xAxis) && Array.isArray(normalizedRaw.consumption)) {
                normalized = {
                  ...normalizedRaw,
                  "y-axis": { [normalizedRaw.widget_title || g?.name || "Total Consumption"]: normalizedRaw.consumption.map(toNumberOrNull) },
                };
              } else if (Array.isArray(xAxis) && Array.isArray(normalizedRaw.savings)) {
                normalized = {
                  ...normalizedRaw,
                  "y-axis": { [normalizedRaw.widget_title || g?.name || "Total Savings"]: normalizedRaw.savings.map(toNumberOrNull) },
                };
              }
            }

            const chartTypeGuess =
              normalizedRaw && typeof normalizedRaw === "object" && !Array.isArray(normalizedRaw) && Array.isArray(normalizedRaw.savings)
                ? "other"
                : "consumption";

            let chartData;
            let isFloorAggregatedBarChart = false;

            // Special handling for bar charts using total_consumption/by_group endpoint
            if (type === "bar" && isTotalConsumptionByGroupApiPath(String(g?.api_path ?? ""))) {
              const normalizedData = normalizeTotalConsumptionByGroupPayload(raw);
              if (normalizedData && typeof normalizedData === "object" && normalizedData.data && typeof normalizedData.data === "object") {
                // Data is per-area: { "Area 1": 100, "Area 2": 200 }
                const areaData = normalizedData.data;
                const floorSums = {};
                const areaIdToFloorIdMap = areaIdToFloorId instanceof Map ? areaIdToFloorId : new Map(Object.entries(areaIdToFloorId || {}));

                for (const [areaName, value] of Object.entries(areaData)) {
                  const areaId = resolveAreaIdForLabel(areaName, areaIdToDisplayName, g?.area_ids);
                  if (areaId != null) {
                    const floorId = areaIdToFloorIdMap.get(areaId) || areaIdToFloorIdMap.get(Number(areaId)) || areaIdToFloorIdMap.get(String(areaId));
                    if (floorId != null) {
                      const floorName = floorDisplayName(floors, floorId);
                      floorSums[floorName] = (floorSums[floorName] || 0) + (Number(value) || 0);
                    }
                  }
                }

                // Create bar chart data: array of { name: floorName, value: sum }
                chartData = Object.entries(floorSums).map(([floorName, sum]) => ({
                  name: floorName,
                  value: sum
                }));

                isFloorAggregatedBarChart = true;
              } else {
                // Fallback to normal processing
                chartData = transformDataForCharts(normalized, chartTypeGuess, true, g?.floor_ids, g?.area_ids, g?.group_ids);
              }
            } else {
              chartData = transformDataForCharts(normalized, chartTypeGuess, true, g?.floor_ids, g?.area_ids, g?.group_ids);
            }

            if (!Array.isArray(chartData) || chartData.length === 0) return "No data";

            const first = chartData.find((r) => r && typeof r === "object") || chartData[0] || {};
            const seriesKeys = Object.keys(first).filter((k) => k !== "date" && k !== "name");
            if (seriesKeys.length === 0 && !isFloorAggregatedBarChart) return "No data";

            if (type === "line" || type === "bar") {
              let effectiveChartData = chartData;
              let effectiveSeriesKeys = isFloorAggregatedBarChart ? ["value"] : seriesKeys;

              // SpaceUtilization parity: when group_scope is set but backend returns per-area series
              // (e.g. EL/TEST), aggregate areas into area-group names for display.
              const scope = String(g?.group_scope || "").trim().toLowerCase();
              if (
                isAreaGroupChartScope(scope) &&
                Array.isArray(seriesKeys) &&
                seriesKeys.length > 0
              ) {
                const areaNameToGroup = buildAreaNameToGroupNameMap(areaGroups, scope);
                const hasAny = seriesKeys.some((k) => areaNameToGroup.has(String(k).trim()));
                if (hasAny) {
                  const groupSet = new Set();
                  effectiveChartData = (chartData || []).map((row) => {
                    // Keep original per-area keys so tooltip can show group -> areas breakdown.
                    const next = { ...(row && typeof row === "object" ? row : {}), date: row?.date };
                    for (const k of seriesKeys) {
                      const key = String(k).trim();
                      const gnames = areaNameToGroup.get(key);
                      if (!Array.isArray(gnames) || gnames.length === 0) continue;
                      const v = Number(toNumberOrNull(row?.[k])) || 0;
                      for (const gname of gnames) {
                        //   next[gname] = (Number(next[gname]) || 0) + v;

                        groupSet.add(gname);
                      }
                    }
                    return next;
                  });
                  effectiveSeriesKeys = Array.from(groupSet);
                }
              }

              const isHorizontal = false; // Reverting to vertical bars as requested "names in xaxis"
              const ChartImpl = type === "line" ? LineChart : BarChart;
              const SeriesImpl = type === "line" ? Line : Bar;
              const palette = ["#64b5f6", "#81c784", "#ffd54f", "#e57373", "#ba68c8", "#4db6ac"];
              const tooltipUnit = String(
                (raw && typeof raw === "object" ? raw.unit : "") ||
                inferUnitFromApiPath(g?.api_path) ||
                inferUnitFromChartTitle(g?.name) ||
                ""
              ).trim();

              const isPerFloorEnergy = raw && typeof raw === "object" && raw.__isPerFloorEnergyData === true;
              const effectiveGroupScope = isPerFloorEnergy ? null : g?.group_scope;
              const focused = focusedSeriesByGraph?.[id] || "";
              const handleLegendClick = (e) => {
                const key = String(e?.dataKey ?? e?.value ?? "").trim();
                if (!key) return;
                setFocusedSeriesByGraph((prev) => ({
                  ...prev,
                  [id]: prev?.[id] === key ? "" : key,
                }));
              };

              const needsScroll = type === "bar" && effectiveChartData.length > 5;
              const scrollWidth = Math.max(effectiveChartData.length * 90, 100);

              return (
                <ChartSizeBox graphId={id} graph={g}>
                  <div style={{
                    width: "100%",
                    height: "100%",
                    overflowX: needsScroll ? "auto" : "visible",
                    overflowY: "hidden",
                    scrollbarWidth: "thin",
                    scrollbarColor: `${scrollThumb} transparent`
                  }}>
                    <div style={{
                      width: needsScroll ? `${scrollWidth}px` : "100%",
                      minWidth: "100%",
                      height: "100%"
                    }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <ChartImpl
                          data={effectiveChartData}
                          margin={{ top: 10, right: 30, bottom: 45, left: 10 }}
                        >
                          <CartesianGrid stroke={gridStroke} />
                          <XAxis
                            dataKey={isFloorAggregatedBarChart ? "name" : "date"}
                            tick={{ fill: tickFill, fontSize: 10 }}
                            interval={type === "line" && effectiveChartData.length > 10
                              ? Math.ceil(effectiveChartData.length / 6) - 1
                              : 0}
                            angle={type === "line" && effectiveChartData.length > 10 ? 0 : -45}
                            textAnchor={type === "line" && effectiveChartData.length > 10 ? "middle" : "end"}
                            height={45}
                          />
                          <YAxis
                            tick={{ fill: tickFill, fontSize: 10 }}
                            label={tooltipUnit ? {
                              value: tooltipUnit,
                              angle: -90,
                              position: 'insideLeft',
                              fill: tickFill,
                              fontSize: 10,
                              offset: 10
                            } : null}
                          />
                          <Tooltip
                            content={(props) => {
                              const cat = props?.label;
                              const rich =
                                isPerFloorEnergy && cat != null
                                  ? perFloorEnergyTooltipTitleFromRaw(raw, cat)
                                  : null;
                              const resolved =
                                rich != null ? rich : resolveFullTooltipLabel(cat);
                              return (
                                <CustomGroupScopeTooltip
                                  {...props}
                                  label={resolved}
                                  unit={tooltipUnit}
                                  groupScope={effectiveGroupScope}
                                  areaGroups={areaGroups}
                                  graphName={(isPerFloorEnergy || g?.is_area_group_widget) ? null : g?.name}
                                  payload={isPerFloorEnergy ? (props.payload || []).filter(e => Number(e.value) !== 0) : props.payload}
                                  row={
                                    props?.payload?.[0]?.payload && typeof props.payload[0].payload === "object"
                                      ? props.payload[0].payload
                                      : null
                                  }
                                  labelFormatter={(lbl) => {
                                    const r =
                                      isPerFloorEnergy && lbl != null
                                        ? perFloorEnergyTooltipTitleFromRaw(raw, lbl)
                                        : null;
                                    return r != null ? r : resolveFullTooltipLabel(lbl);
                                  }}
                                />
                              );
                            }}
                          />
                          <Legend
                            content={() => (
                              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, paddingTop: 8, position: 'relative' }}>
                                {effectiveSeriesKeys.map((name) => {
                                  const displayName = isFloorAggregatedBarChart ? "Consumption" : resolveJustAreaName(name);
                                  const color = getSeriesColor(id, name);
                                  const isPickerTarget = colorPickerOpen?.graphId === id && colorPickerOpen?.seriesName === name;
                                  return (
                                    <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', position: 'relative' }}>
                                      <div
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setColorPickerOpen(isPickerTarget ? null : { graphId: id, seriesName: name });
                                        }}
                                        style={{
                                          width: 14, height: 14, borderRadius: 3,
                                          backgroundColor: color,
                                          border: '2px solid rgba(255,255,255,0.5)',
                                          cursor: 'pointer',
                                        }}
                                        title="Click to change color"
                                      />
                                      <span
                                        onClick={() => handleLegendClick({ dataKey: name, value: name })}
                                        style={{ fontSize: 11, color: legendColor, opacity: Boolean(focused) && String(name) !== String(focused) ? 0.3 : 1 }}
                                      >
                                        {displayName}
                                      </span>
                                      {isPickerTarget && (
                                        <div
                                          onClick={(e) => e.stopPropagation()}
                                          onMouseDown={(e) => e.stopPropagation()}
                                          style={{
                                            position: 'absolute', bottom: 25, left: 0, zIndex: 100,
                                            background: '#2a2a2a', border: '1px solid rgba(255,255,255,0.2)',
                                            borderRadius: 8, padding: 8,
                                            display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4,
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                                            minWidth: '240px'
                                          }}
                                          data-picker-active="true"
                                        >
                                          {DASHBOARD_PALETTE.map((c) => (
                                            <div
                                              key={c}
                                              onClick={() => { setCustomColor(id, name, c); setColorPickerOpen(null); }}
                                              style={{
                                                width: 20, height: 20, borderRadius: 4,
                                                backgroundColor: c, cursor: 'pointer',
                                                border: color === c ? '2px solid #fff' : '2px solid transparent',
                                              }}
                                            />
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          />
                          {effectiveSeriesKeys.map((name, idx) => (
                            <SeriesImpl
                              // eslint-disable-next-line react/no-array-index-key
                              key={`${id}_${name}_${idx}`}
                              dataKey={isFloorAggregatedBarChart ? "value" : name}
                              name={isFloorAggregatedBarChart ? "Consumption" : resolveJustAreaName(name)}
                              stroke={getSeriesColor(id, name)}
                              fill={getSeriesColor(id, name)}
                              stackId={type === "bar" ? "a" : undefined}
                              dot={false}
                              isAnimationActive={false}
                              onMouseEnter={() => setHoveredSeries(name)}
                              onMouseLeave={() => { setHoveredSeries(null); setHoveredIndex(null); }}
                              strokeOpacity={hoveredSeries === null || hoveredSeries === name ? 1 : 0.3}
                              fillOpacity={hoveredSeries === null || hoveredSeries === name ? 1 : 0.3}
                              hide={Boolean(focused) && String(name) !== String(focused)}
                            >
                              {type === 'bar' && effectiveChartData.map((entry, index) => {
                                const isRowActive = hoveredIndex === null || hoveredIndex === index;
                                const isSeriesActive = hoveredSeries === null || hoveredSeries === name;
                                const active = isSeriesActive && isRowActive;
                                return (
                                  <Cell
                                    key={`cell-${index}`}
                                    onMouseEnter={() => setHoveredIndex(index)}
                                    fillOpacity={active ? 1 : 0.3}
                                    style={{ transition: 'fill-opacity 0.2s ease' }}
                                  />
                                );
                              })}
                            </SeriesImpl>
                          ))}
                        </ChartImpl>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </ChartSizeBox>
              );
            }

            if (type === "pie" || type === "circular") {
              const palette = ["#64b5f6", "#81c784", "#ffd54f", "#e57373", "#ba68c8", "#4db6ac"];
              let pieRows = [];
              const seriesK = Object.keys(chartData[0] || {}).filter(k => k !== "date");
              if (seriesK.length > 1) {
                // Multiple series (areas/floors). Aggregate each series total.
                const seriesTotals = new Map();
                chartData.forEach(row => {
                  seriesK.forEach(k => {
                    const val = row?.[k];
                    let v = 0;
                    if (val != null) {
                      v = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^\d.-]/g, ''));
                      if (isNaN(v)) v = 0;
                    }
                    seriesTotals.set(k, (seriesTotals.get(k) || 0) + v);
                  });
                });
                pieRows = Array.from(seriesTotals.entries()).map(([name, value]) => ({ name: resolveJustAreaName(name), value }));
              } else if (chartData.length > 0) {
                const firstLabel = String(chartData[0]?.date ?? "");
                if (isTimeSeriesLabel(firstLabel)) {
                  // If it's time series (e.g. 00:00), we don't want 96 slices of time.
                  // We want ONE slice representing the total for this series.
                  const name = seriesK[0] ?? g?.name ?? "Total";
                  const total = chartData.reduce((sum, row) => {
                    const val = row?.[seriesK[0]];
                    let v = 0;
                    if (val != null) {
                      v = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^\d.-]/g, ''));
                      if (isNaN(v)) v = 0;
                    }
                    return sum + v;
                  }, 0);
                  pieRows = [{ name, value: total }];
                } else {
                  // Use rows as slices (these are likely area/floor names).
                  pieRows = chartData.map(row => {
                    const total = seriesK.reduce((sum, k) => sum + (Number(toNumberOrNull(row?.[k])) || 0), 0);
                    return { name: String(row?.date ?? ""), value: total };
                  });
                }
              }

              if (!pieRows.length) {
                if (isTotalConsumptionByGroupApiPath(String(g?.api_path ?? ""))) {
                  const areaMap = areaIdToDisplayName instanceof Map ? areaIdToDisplayName : new Map();
                  const tcRows = buildTotalConsumptionByGroupPieRows(raw, areaGroups, areaMap);
                  if (tcRows && tcRows.length > 0) pieRows = tcRows;
                }
              }

              if (!pieRows.length) {
                const genericRows = getGenericEnergyPieRowsFromRaw(raw);
                if (genericRows && genericRows.length > 0) pieRows = genericRows;
              }

              if (!pieRows.length && Array.isArray(raw)) {
                pieRows = raw;
              } else if (!pieRows.length && raw && typeof raw === "object") {
                const target = (raw.data && typeof raw.data === "object" && !Array.isArray(raw.data)) ? raw.data : raw;
                const xAxis = target["x-axis"];
                const yAxis = target["y-axis"];
                if (Array.isArray(xAxis) && yAxis && typeof yAxis === "object" && !Array.isArray(yAxis)) {
                  const seriesArrays = Object.values(yAxis).filter(Array.isArray);
                  pieRows = xAxis.map((areaName, i) => {
                    const total = seriesArrays.reduce((sum, arr) => sum + (Number(toNumberOrNull(arr[i])) || 0), 0);
                    return { name: String(areaName), value: total };
                  });
                }
              }

              const safeAll = (Array.isArray(pieRows) ? pieRows : [])
                .map((r, idx) => {
                  const name = r?.name ?? r?.label ?? r?.x ?? `Slice ${idx + 1}`;
                  const value = toNumberOrNull(r?.value ?? r?.y ?? r?.count ?? r?.amount ?? r?.total);
                  return { name: String(name), value: value ?? 0 };
                });

              const safe = safeAll.filter((r) => Number(r.value) > 0);

              const scope = String(g?.group_scope || "").trim().toLowerCase();
              // Use the unfiltered area list for tooltip breakdown (so 0 values still show).
              const areaSlices = safeAll;
              let finalSlices = safe;
              const areaNameToGroup = isAreaGroupChartScope(scope)
                ? buildAreaNameToGroupNameMap(areaGroups, scope)
                : null;
              if (isAreaGroupChartScope(scope) && safe.length) {
                const hasAny = safe.some((s) => areaNameToGroup.has(String(s?.name ?? "").trim()));
                if (hasAny) {
                  const acc = new Map();
                  for (const s of safe) {
                    const areaName = String(s?.name ?? "").trim();
                    const v = Number(toNumberOrNull(s?.value)) || 0;
                    const gnames = areaNameToGroup.get(areaName);
                    if (!Array.isArray(gnames) || gnames.length === 0) continue;
                    for (const gname of gnames) {
                      const n = String(gname || "").trim();
                      if (!n) continue;
                      acc.set(n, (Number(acc.get(n)) || 0) + v);
                    }
                  }
                  const aggregated = Array.from(acc.entries())
                    .map(([name, value]) => ({ name, value }))
                    .filter((s) => Number(s.value) > 0);

                  // Only use aggregated if we actually got results. 
                  // Otherwise, stay with individual areas (finalSlices = safe).
                  if (aggregated.length > 0) {
                    finalSlices = aggregated;
                  }
                }
              }

              if (finalSlices.length === 0)
                return <CenterMessage title="No data" subtitle="No positive values to display" />;

              const tooltipUnit = String(
                (raw && typeof raw === "object" ? raw.unit : "") ||
                inferUnitFromApiPath(g?.api_path) ||
                inferUnitFromChartTitle(g?.name) ||
                ""
              ).trim();

              const avgValue = finalSlices.length > 0
                ? (finalSlices.reduce((s, sl) => s + sl.value, 0) / finalSlices.length)
                : 0;
              const avgDisplay = avgValue % 1 === 0
                ? avgValue.toLocaleString()
                : avgValue.toLocaleString(undefined, { maximumFractionDigits: 2 });

              const useDualEnergyLegend =
                isEnergyConsumptionOrSavingsPieApiPath(String(g?.api_path ?? "")) &&
                finalSlices.length >= ENERGY_PIE_DUAL_LEGEND_MIN_SLICES;
              const midSlice = Math.ceil(finalSlices.length / 2);
              const leftLegendSlices = useDualEnergyLegend ? finalSlices.slice(0, midSlice) : [];
              const rightLegendSlices = useDualEnergyLegend ? finalSlices.slice(midSlice) : [];
              const manySlices = finalSlices.length >= 16;
              const pieLabelFn = manySlices
                ? ({ percent }) => (percent > 0.1 ? `${(percent * 100).toFixed(1)}%` : "")
                : ({ percent }) => (percent > 0.05 ? `${(percent * 100).toFixed(1)}%` : "");

              return (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "stretch",
                    gap: 8,
                    minHeight: 0,
                  }}
                >
                  {useDualEnergyLegend ? (
                    <EnergyPieDualLegendColumn
                      slices={leftLegendSlices}
                      graphId={id}
                      getSeriesColor={getSeriesColor}
                      setCustomColor={setCustomColor}
                      colorPickerOpen={colorPickerOpen}
                      setColorPickerOpen={setColorPickerOpen}
                    />
                  ) : null}
                  <div
                    style={{
                      flex: useDualEnergyLegend ? "1 1 44%" : "1 1 100%",
                      minWidth: 0,
                      minHeight: 0,
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={useDualEnergyLegend ? { left: 2, right: 2, top: 4, bottom: 4 } : undefined}>
                        <Pie
                          data={finalSlices}
                          dataKey="value"
                          nameKey="name"
                          innerRadius="55%"
                          outerRadius="80%"
                          paddingAngle={2}
                          stroke="rgba(255,255,255,0.12)"
                          label={pieLabelFn}
                          onMouseEnter={(data) => setHoveredSeries(data.name)}
                          onMouseLeave={() => setHoveredSeries(null)}
                        >
                          <Label
                            value={`${avgDisplay} ${tooltipUnit}`}
                            position="center"
                            fill={tickFill}
                            style={{
                              fontSize: "24px",
                              fontWeight: "900",
                              dominantBaseline: "central",
                            }}
                          />
                          {finalSlices.map((s, idx) => {
                            const isActive = hoveredSeries === null || String(hoveredSeries) === String(s.name);
                            return (
                              <Cell
                                key={`${id}_cell_${idx}`}
                                fill={getSeriesColor(id, s.name)}
                                fillOpacity={isActive ? 1 : 0.3}
                                style={{ transition: 'fill-opacity 0.2s ease' }}
                              />
                            );
                          })}
                        </Pie>
                        <Tooltip
                          content={(props) => {
                            const sliceName = props?.payload?.[0]?.name;
                            const isPerFloorPie =
                              raw && typeof raw === "object" && raw.__isPerFloorEnergyData === true;
                            const rich =
                              isPerFloorPie && sliceName != null
                                ? perFloorEnergyTooltipTitleFromRaw(raw, sliceName)
                                : null;
                            const resolved =
                              rich != null ? rich : resolveFullTooltipLabel(sliceName);
                            return (
                              <CustomGroupScopeTooltip
                                {...props}
                                label={resolved}
                                unit={tooltipUnit}
                                groupScope={g?.group_scope}
                                areaGroups={areaGroups}
                                areaSlices={areaSlices}
                                labelFormatter={(lbl) => {
                                  const r =
                                    isPerFloorPie && lbl != null
                                      ? perFloorEnergyTooltipTitleFromRaw(raw, lbl)
                                      : null;
                                  return r != null ? r : resolveFullTooltipLabel(lbl);
                                }}
                                graphName={g?.is_area_group_widget ? null : g?.name}
                              />
                            );
                          }}
                        />
                        {!useDualEnergyLegend ? (
                          <Legend
                            content={() => (
                              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, paddingTop: 8, position: 'relative' }}>
                                {finalSlices.map((s) => {
                                  const name = String(s.name);
                                  const color = getSeriesColor(id, name);
                                  const isPickerTarget = colorPickerOpen?.graphId === id && colorPickerOpen?.seriesName === name;
                                  return (
                                    <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', position: 'relative' }}>
                                      <div
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setColorPickerOpen(isPickerTarget ? null : { graphId: id, seriesName: name });
                                        }}
                                        style={{
                                          width: 14, height: 14, borderRadius: 3,
                                          backgroundColor: color,
                                          border: '2px solid rgba(255,255,255,0.5)',
                                          cursor: 'pointer',
                                        }}
                                        title="Click to change color"
                                      />
                                      <span style={{ fontSize: 11, color: legendColor }}>{resolveJustAreaName(name)}</span>
                                      {isPickerTarget && (
                                        <div
                                          onClick={(e) => e.stopPropagation()}
                                          onMouseDown={(e) => e.stopPropagation()}
                                          style={{
                                            position: 'absolute', bottom: 22, left: 0, zIndex: 100,
                                            background: '#2a2a2a', border: '1px solid rgba(255,255,255,0.2)',
                                            borderRadius: 8, padding: 8,
                                            display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4,
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                                            minWidth: '240px'
                                          }}
                                          data-picker-active="true"
                                        >
                                          {DASHBOARD_PALETTE.map((c) => (
                                            <div
                                              key={c}
                                              onClick={() => { setCustomColor(id, name, c); setColorPickerOpen(null); }}
                                              style={{
                                                width: 20, height: 20, borderRadius: 4,
                                                backgroundColor: c, cursor: 'pointer',
                                                border: color === c ? '2px solid #fff' : '2px solid transparent',
                                              }}
                                            />
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          />
                        ) : null}
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {useDualEnergyLegend ? (
                    <EnergyPieDualLegendColumn
                      slices={rightLegendSlices}
                      graphId={id}
                      getSeriesColor={getSeriesColor}
                      setCustomColor={setCustomColor}
                      colorPickerOpen={colorPickerOpen}
                      setColorPickerOpen={setColorPickerOpen}
                    />
                  ) : null}
                </div>
              );
            }

            const tooltipUnit = String(
              (raw && typeof raw === "object" ? raw.unit : "") ||
              inferUnitFromApiPath(g?.api_path) ||
              inferUnitFromChartTitle(g?.name) ||
              ""
            ).trim();

            // Table + single series: either time-series rows OR one row per entity (e.g. per-area totals from __isPerFloorEnergyData).
            // Do not collapse all time points / entities into one "series total" row.
            if (type === "table" && seriesKeys.length === 1 && chartData.length > 0) {
              const firstLbl = String(chartData[0]?.date ?? "");
              if (isTimeSeriesLabel(firstLbl)) {
                const top = chartData.slice(0, 96);
                return (
                  <div style={{ width: "100%", height: "100%", overflowY: "auto", overflowX: "hidden" }}>
                    <div style={{ fontWeight: 800, marginBottom: 12, fontSize: 14 }}>{type.toUpperCase()} DATA</div>
                    {top.map((r, i) => (
                      <div
                        key={`${id}_tbl_ts_${i}`}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          borderBottom: i === top.length - 1 ? "none" : "1px solid rgba(255,255,255,0.08)",
                          padding: "8px 0",
                          alignItems: "center",
                        }}
                      >
                        <div style={{ opacity: 0.9, fontSize: 12.5 }}>{String(r?.date ?? "")}</div>
                        <div style={{ fontWeight: 800, fontSize: 12.5, color: "#fff" }}>
                          {(Number(toNumberOrNull(r?.[seriesKeys[0]])) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
                          {tooltipUnit}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }
              const seriesName = seriesKeys[0];
              const totalSum = chartData.reduce(
                (acc, row) => acc + (Number(toNumberOrNull(row?.[seriesName])) || 0),
                0
              );
              const headerTotal =
                raw &&
                  typeof raw === "object" &&
                  raw.__isPerFloorEnergyData === true &&
                  raw.__perFloorOverallAggregate === "mean" &&
                  typeof raw.overallTotal === "number" &&
                  Number.isFinite(raw.overallTotal)
                  ? raw.overallTotal
                  : totalSum;
              return (
                <div style={{ width: "100%", height: "100%", overflowY: "auto", overflowX: "hidden", paddingRight: "4px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 16,
                      paddingBottom: 8,
                      borderBottom: "1px solid rgba(255,255,255,0.15)",
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: 13, letterSpacing: "0.5px" }}>
                      {type.toUpperCase()} BREAKDOWN
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                      {raw?.__perFloorOverallAggregate === "mean" && raw?.__isPerFloorEnergyData
                        ? "Average: "
                        : "Total: "}
                      {headerTotal.toLocaleString(undefined, { maximumFractionDigits: 1 })} {tooltipUnit}
                    </div>
                  </div>
                  {chartData.map((row, i) => {
                    const val = Number(toNumberOrNull(row?.[seriesName])) || 0;
                    const pct = totalSum > 0 ? (val / totalSum) * 100 : 0;
                    const rowDate = String(row?.date ?? "");
                    const richPerFloor =
                      raw && typeof raw === "object" && raw.__isPerFloorEnergyData === true
                        ? perFloorEnergyTooltipTitleFromRaw(raw, rowDate)
                        : null;
                    const resolvedLabel =
                      richPerFloor != null ? richPerFloor : resolveFullTooltipLabel(rowDate);
                    return (
                      <div key={`${id}_tbl_ent_${i}`} style={{ marginBottom: 14, position: "relative" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-end",
                            marginBottom: 4,
                            zIndex: 2,
                            position: "relative",
                          }}
                        >
                          <div
                            style={{
                              opacity: 0.9,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              fontSize: 12,
                              fontWeight: 500,
                              flex: 1,
                              marginRight: 10,
                            }}
                            title={resolvedLabel}
                          >
                            {resolvedLabel}
                          </div>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                            <span style={{ fontWeight: 800, fontSize: 13, color: "#fff" }}>
                              {val.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                            </span>
                            <span style={{ fontSize: 10, opacity: 0.8, fontWeight: 600 }}>{tooltipUnit}</span>
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                const name = String(row?.date ?? seriesName);
                                setColorPickerOpen(colorPickerOpen?.seriesName === name ? null : { graphId: id, seriesName: name });
                              }}
                              style={{
                                fontSize: 10,
                                color: getSeriesColor(id, String(row?.date ?? seriesName)),
                                fontWeight: 800,
                                marginLeft: 4,
                                minWidth: "40px",
                                textAlign: "right",
                                cursor: 'pointer',
                                borderBottom: '1px dashed rgba(255,255,255,0.2)'
                              }}
                              title="Click to change color"
                            >
                              {pct.toFixed(1)}%
                            </span>
                            {colorPickerOpen?.graphId === id && colorPickerOpen?.seriesName === String(row?.date ?? seriesName) && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                style={{
                                  position: 'absolute',
                                  [i === 0 ? 'top' : 'bottom']: 25,
                                  right: 0,
                                  zIndex: 1000,
                                  background: '#2a2a2a', border: '1px solid rgba(255,255,255,0.2)',
                                  borderRadius: 8, padding: 8,
                                  display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4,
                                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                                  minWidth: '240px'
                                }}
                                data-picker-active="true"
                              >
                                {DASHBOARD_PALETTE.map((c) => (
                                  <div
                                    key={c}
                                    onClick={() => { setCustomColor(id, String(row?.date ?? seriesName), c); setColorPickerOpen(null); }}
                                    style={{
                                      width: 20, height: 20, borderRadius: 4,
                                      backgroundColor: c, cursor: 'pointer',
                                      border: getSeriesColor(id, String(row?.date ?? seriesName)) === c ? '2px solid #fff' : '2px solid transparent',
                                    }}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div
                          style={{
                            height: 4,
                            width: "100%",
                            backgroundColor: "rgba(255,255,255,0.05)",
                            borderRadius: 2,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${pct}%`,
                              backgroundColor: getSeriesColor(id, String(row?.date ?? seriesName)),
                              borderRadius: 2,
                              transition: "width 0.5s ease-out",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            }

            // When multiple areas/floors are selected, show a breakdown by series (entity) total.
            // When only one is selected, show the time-series breakdown.
            const isEnergyGraph = g?.api_path?.toLowerCase().includes("energy") || g?.name?.toLowerCase().includes("energy");
            if (seriesKeys.length > 1 || (seriesKeys.length === 1 && isEnergyGraph)) {
              const seriesTotals = seriesKeys.map((name) => {
                const total = chartData.reduce(
                  (sum, row) => {
                    const val = row[name];
                    if (val == null) return sum;
                    const parsed = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^\d.-]/g, ''));
                    return sum + (isNaN(parsed) ? 0 : parsed);
                  },
                  0
                );
                return { name, value: total };
              });

              const totalSum = seriesTotals.reduce((acc, s) => acc + s.value, 0);
              const headerTotalMulti =
                raw &&
                  typeof raw === "object" &&
                  raw.__isPerFloorEnergyData === true &&
                  raw.__perFloorOverallAggregate === "mean" &&
                  typeof raw.overallTotal === "number" &&
                  Number.isFinite(raw.overallTotal)
                  ? raw.overallTotal
                  : totalSum;

              return (
                <div style={{ width: "100%", height: "100%", overflowY: "auto", overflowX: "hidden", paddingRight: "4px" }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                    paddingBottom: 8,
                    borderBottom: '1px solid rgba(255,255,255,0.15)'
                  }}>
                    <div style={{ fontWeight: 800, fontSize: 13, letterSpacing: '0.5px' }}>
                      {type.toUpperCase()} BREAKDOWN
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                      {raw?.__perFloorOverallAggregate === "mean" && raw?.__isPerFloorEnergyData
                        ? "Average: "
                        : "Total: "}
                      {headerTotalMulti.toLocaleString(undefined, { maximumFractionDigits: 1 })} {tooltipUnit}
                    </div>
                  </div>

                  {seriesTotals.map((s, i) => {
                    const percent = totalSum > 0 ? (s.value / totalSum) * 100 : 0;
                    const resolvedLabel = (raw && raw.__isPerFloorEnergyData && raw.__perFloorTooltipTitles && raw.__perFloorTooltipTitles[i]) || resolveFullTooltipLabel(s.name);

                    return (
                      <div
                        key={`${id}_table_series_${i}`}
                        style={{
                          marginBottom: 14,
                          position: "relative"
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-end",
                            marginBottom: 4,
                            zIndex: 2,
                            position: "relative"
                          }}
                        >
                          <div
                            style={{
                              opacity: 0.9,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              fontSize: 12,
                              fontWeight: 500,
                              flex: 1,
                              marginRight: 10
                            }}
                            title={resolvedLabel}
                          >
                            {resolvedLabel}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                            <span style={{ fontWeight: 800, fontSize: 13, color: "#fff" }}>
                              {s.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                            </span>
                            <span style={{ fontSize: 10, opacity: 0.8, fontWeight: 600 }}>
                              {tooltipUnit}
                            </span>
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                setColorPickerOpen(colorPickerOpen?.seriesName === s.name ? null : { graphId: id, seriesName: s.name });
                              }}
                              style={{
                                fontSize: 10,
                                color: getSeriesColor(id, s.name),
                                fontWeight: 800,
                                marginLeft: 4,
                                minWidth: '40px',
                                textAlign: 'right',
                                cursor: 'pointer',
                                borderBottom: '1px dashed rgba(255,255,255,0.2)'
                              }}
                              title="Click to change color"
                            >
                              {percent.toFixed(1)}%
                            </span>
                            {colorPickerOpen?.graphId === id && colorPickerOpen?.seriesName === s.name && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                style={{
                                  position: 'absolute',
                                  [i === 0 ? 'top' : 'bottom']: 25,
                                  right: 0,
                                  zIndex: 1000,
                                  background: '#2a2a2a', border: '1px solid rgba(255,255,255,0.2)',
                                  borderRadius: 8, padding: 8,
                                  display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4,
                                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                                  minWidth: '240px'
                                }}
                                data-picker-active="true"
                              >
                                {DASHBOARD_PALETTE.map((c) => (
                                  <div
                                    key={c}
                                    onClick={() => { setCustomColor(id, s.name, c); setColorPickerOpen(null); }}
                                    style={{
                                      width: 20, height: 20, borderRadius: 4,
                                      backgroundColor: c, cursor: 'pointer',
                                      border: getSeriesColor(id, s.name) === c ? '2px solid #fff' : '2px solid transparent',
                                    }}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Distribution Bar */}
                        <div style={{
                          height: 4,
                          width: "100%",
                          backgroundColor: "rgba(255,255,255,0.05)",
                          borderRadius: 2,
                          overflow: "hidden"
                        }}>
                          <div style={{
                            height: "100%",
                            width: `${percent}%`,
                            backgroundColor: getSeriesColor(id, s.name),
                            borderRadius: 2,
                            transition: "width 0.5s ease-out"
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );

            }

            // Fallback: Time-series table for single entity
            const top = chartData.slice(0, 12);
            return (
              <div style={{ width: "100%", height: "100%", overflowY: "auto", overflowX: "hidden" }}>
                <div style={{ fontWeight: 800, marginBottom: 12, fontSize: 14 }}>{type.toUpperCase()} DATA</div>
                {top.map((r, i) => (
                  <div
                    key={`${id}_${i}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      borderBottom: i === top.length - 1 ? "none" : "1px solid rgba(255,255,255,0.08)",
                      padding: "8px 0",
                      alignItems: "center"
                    }}
                  >
                    <div style={{ opacity: 0.9, fontSize: 12.5 }}>{String(r?.date ?? "")}</div>
                    <div style={{ fontWeight: 800, fontSize: 12.5, color: "#fff" }}>
                      {(Number(toNumberOrNull(r?.[seriesKeys[0]])) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} {tooltipUnit}
                    </div>
                  </div>
                ))}
              </div>
            );
          }
        })()}
      </div>
    </div>
  );
}