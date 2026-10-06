/**
 * Combined Consumption + Savings chart.
 * Blue series = consumption. Red dashed horizontal line = connected load ceiling for the view
 * (max connected-load value in the series — same role as a “full load / 100% of budget” line in reference UIs).
 * Savings are not drawn as an area; tooltip lists Consumption, Savings, Connected load.
 * Export menu matches standalone Consumption chart (Send By Email / Download To PC) when parent passes API handlers; otherwise optional client CSV export.
 */

import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import FileUploadOutlined from '@mui/icons-material/FileUploadOutlined';
import {
  ExportMenuPanel,
  EXPORT_MENU_COPY,
  buildEmailDownloadExportActions,
} from '../../../../shared/dashboard/export/components';
import {
  BASIC_CONSUMPTION_SAVINGS_COMBINED_MIN_HEIGHT_PX,
  CONSUMPTION_SAVINGS_COMBINED_MIN_HEIGHT_PX,
  CONSUMPTION_SAVINGS_COMBINED_SHELL_VARIANTS,
  resolveConsumptionSavingsCombinedChrome,
} from '../../../../shared/dashboard/widgets/energy/consumptionSavingsCombinedChrome';
import {
  computeCo2KgFromEnergySavings,
  formatCo2Kg,
  summarizeMergedConsumptionSavings,
} from '../../utils/shadesWidgetSettings';
import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

const CONSUMPTION_COLOR = '#1565C0';
const CONNECTED_LOAD_COLOR = '#C62828';

const DASHBOARD_PALETTE = [
  '#1565C0', // Blue
  '#2E7D32', // Green
  '#EF6C00', // Orange
  '#C62828', // Red
  '#6A1B9A', // Purple
  '#00838F', // Cyan
  '#AD1457', // Pink
  '#37474F', // Blue Gray
];

const DEFAULT_TITLE_STYLE = {
  margin: 0,
  fontSize: '18px',
  fontWeight: 600,
  color: '#000000',
};

const formatCombinedTooltipValue = (val) =>
  val != null && val !== '' && Number.isFinite(Number(val)) ? Number(val).toFixed(2) : '—';

/**
 * Compact multi-area tooltip for the combined energy chart.
 * Shared by Basic / Advanced / Customized (same component import).
 */
function CombinedEnergyChartTooltip({
  active,
  label,
  mergedData,
  areaKeys = [],
  unit,
  consumptionColor,
  connectedLoadColor,
}) {
  if (!active || !mergedData?.length) return null;
  const row = mergedData.find((r) => String(r.date) === String(label));
  if (!row) return null;

  const unitSuffix = unit ? ` (${unit})` : '';

  const stopWheel = (e) => {
    e.stopPropagation();
  };

  const boxStyle = {
    backgroundColor: '#f5f5f5',
    border: '1px solid #333',
    borderRadius: '4px',
    color: '#000',
    fontSize: '11px',
    lineHeight: 1.25,
    maxWidth: '280px',
    pointerEvents: 'auto',
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
  };

  if (!areaKeys.length) {
    return (
      <div style={{ ...boxStyle, padding: '8px 10px' }}>
        <div style={{ fontWeight: 700, marginBottom: 6, borderBottom: '1px solid #333', paddingBottom: 4 }}>
          {label}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '2px 8px', alignItems: 'center' }}>
          <span
            aria-hidden
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              backgroundColor: consumptionColor,
              border: '1px solid rgba(0,0,0,0.25)',
            }}
          />
          <span>Cons.{unitSuffix}</span>
          <span style={{ fontWeight: 600, textAlign: 'right' }}>{formatCombinedTooltipValue(row.consumption)}</span>
          <span />
          <span>Sav.{unitSuffix}</span>
          <span style={{ fontWeight: 600, textAlign: 'right' }}>{formatCombinedTooltipValue(row.savings)}</span>
          <span
            aria-hidden
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              backgroundColor: connectedLoadColor,
              border: '1px solid rgba(0,0,0,0.25)',
            }}
          />
          <span>Load{unitSuffix}</span>
          <span style={{ fontWeight: 600, textAlign: 'right' }}>{formatCombinedTooltipValue(row.connectedLoad)}</span>
        </div>
      </div>
    );
  }

  return (
    <div style={boxStyle}>
      <div
        style={{
          fontWeight: 700,
          padding: '6px 8px 4px',
          borderBottom: '1px solid #333',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <span>{label}</span>
        {unit ? <span style={{ fontWeight: 500, color: '#555' }}>{unit}</span> : null}
      </div>
      <div
        style={{
          maxHeight: '168px',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          padding: '0 0 4px',
        }}
        onWheel={stopWheel}
        onMouseDown={stopWheel}
        onTouchMove={stopWheel}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            tableLayout: 'fixed',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#ececec' }}>
              <th
                style={{
                  textAlign: 'left',
                  padding: '3px 6px',
                  fontWeight: 600,
                  position: 'sticky',
                  top: 0,
                  backgroundColor: '#ececec',
                  width: '40%',
                }}
              >
                Area
              </th>
              <th
                style={{
                  textAlign: 'right',
                  padding: '3px 4px',
                  fontWeight: 600,
                  position: 'sticky',
                  top: 0,
                  backgroundColor: '#ececec',
                }}
              >
                Cons.
              </th>
              <th
                style={{
                  textAlign: 'right',
                  padding: '3px 4px',
                  fontWeight: 600,
                  position: 'sticky',
                  top: 0,
                  backgroundColor: '#ececec',
                }}
              >
                Sav.
              </th>
              <th
                style={{
                  textAlign: 'right',
                  padding: '3px 6px',
                  fontWeight: 600,
                  position: 'sticky',
                  top: 0,
                  backgroundColor: '#ececec',
                }}
              >
                Load
              </th>
            </tr>
          </thead>
          <tbody>
            {areaKeys.map((areaName, idx) => {
              const seriesColor = DASHBOARD_PALETTE[idx % DASHBOARD_PALETTE.length];
              return (
              <tr key={areaName}>
                <td
                  style={{
                    padding: '2px 6px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontWeight: 600,
                  }}
                  title={areaName}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      maxWidth: '100%',
                      verticalAlign: 'middle',
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        flexShrink: 0,
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        backgroundColor: seriesColor,
                        border: '1px solid rgba(0,0,0,0.25)',
                      }}
                    />
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {areaName}
                    </span>
                  </span>
                </td>
                <td style={{ padding: '2px 4px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {formatCombinedTooltipValue(row[`${areaName}_consumption`])}
                </td>
                <td style={{ padding: '2px 4px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {formatCombinedTooltipValue(row[`${areaName}_savings`])}
                </td>
                <td style={{ padding: '2px 6px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {formatCombinedTooltipValue(row[`${areaName}_connectedLoad`])}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ConsumptionSavingsCombinedChart({
  mergedData = [],
  unit = 'kWh',
  isLoading = false,
  emptyStateVariant = 'message', // 'message' | 'blank'
  formatXAxisLabel = (v) => v,
  /** When `'this-week'`, axis labels hide duplicate Sat 24 and strip trailing ` 0` from day markers (Sun 0 → Sun). */
  selectedDuration = null,
  /** Optional — notified after legacy client-side CSV export (only when server export props are not used). */
  onDownload,
  /** Same as standalone Consumption chart: API email export. */
  onEmail,
  /** Same as standalone Consumption chart: API CSV download. */
  onDownloadReport,
  exportEmailLoading = false,
  exportDownloadLoading = false,
  title = 'Consumption & Savings',
  contentColor = 'rgba(128, 120, 100, 0.7)',
  shellVariant = CONSUMPTION_SAVINGS_COMBINED_SHELL_VARIANTS.basic,
  advancedSurface = null,
  titleStyle: titleStyleProp,
  strategyContent = null,
  strategyLoading = false,
  topControls = null,
  /** Theme-aware consumption color for the combined blue series (used when not rendering individual area series). */
  consumptionColor = CONSUMPTION_COLOR,
  /** Connected-load line color (defaults to red). */
  connectedLoadColor = CONNECTED_LOAD_COLOR,
}) {
  // Tabs like the reference image: Consumption | Savings By Strategy
  const [activeSeries, setActiveSeries] = useState('consumption'); // 'consumption' | 'strategy'
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const exportMenuWrapRef = useRef(null);

  const areaKeys = useMemo(() => {
    if (!mergedData || mergedData.length === 0) return [];
    const keys = new Set();
    mergedData.forEach((row) => {
      Object.keys(row).forEach((k) => {
        if (k.endsWith('_consumption')) {
          const areaName = k.slice(0, -12); // remove '_consumption'
          if (areaName && areaName !== 'Combined Areas') {
            keys.add(areaName);
          }
        }
      });
    });
    return Array.from(keys);
  }, [mergedData]);

  const isIndividualAreas = areaKeys.length > 0;

  const titleStyle = titleStyleProp || DEFAULT_TITLE_STYLE;
  const chrome = useMemo(
    () =>
      resolveConsumptionSavingsCombinedChrome({
        shellVariant,
        contentColor,
        advancedSurface,
        titleStyle,
      }),
    [shellVariant, contentColor, advancedSurface, titleStyle]
  );

  const useServerExportMenu =
    typeof onEmail === 'function' && typeof onDownloadReport === 'function';

  useEffect(() => {
    const handleMouseDown = (event) => {
      if (!showExportDropdown) return;
      const wrap = exportMenuWrapRef.current;
      if (wrap && !wrap.contains(event.target)) {
        setShowExportDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [showExportDropdown]);

  const yAxisMax = useMemo(() => {
    if (!mergedData.length) return null;
    let max = 0;
    mergedData.forEach((row) => {
      const v = row.connectedLoad != null && row.connectedLoad !== '' ? Number(row.connectedLoad) : null;
      if (v != null && !Number.isNaN(v) && v > max) max = v;
    });
    return max > 0 ? max : null;
  }, [mergedData]);

  const summary = useMemo(
    () => summarizeMergedConsumptionSavings(mergedData),
    [mergedData]
  );

  const carbonFootprintKg = useMemo(
    () => computeCo2KgFromEnergySavings(summary.totalSavings, unit),
    [summary.totalSavings, unit]
  );

  /** Legacy client-only CSV when `onEmail` / `onDownloadReport` are not supplied. */
  const handleClientCsvDownload = useCallback(() => {
    if (!mergedData.length) return;
    const headers = ['Time', `Consumption (${unit})`, `Savings (${unit})`, `Connected Load (${unit})`];
    if (areaKeys.length > 0) {
      areaKeys.forEach((areaName) => {
        headers.push(`${areaName} Consumption (${unit})`);
        headers.push(`${areaName} Savings (${unit})`);
        headers.push(`${areaName} Connected Load (${unit})`);
      });
    }

    const rows = mergedData.map((row) => {
      const line = [
        row.date,
        row.consumption != null && row.consumption !== '' ? Number(row.consumption) : '',
        row.savings != null && row.savings !== '' ? Number(row.savings) : '',
        row.connectedLoad != null && row.connectedLoad !== '' ? Number(row.connectedLoad) : ''
      ];
      if (areaKeys.length > 0) {
        areaKeys.forEach((areaName) => {
          line.push(row[`${areaName}_consumption`] ?? '');
          line.push(row[`${areaName}_savings`] ?? '');
          line.push(row[`${areaName}_connectedLoad`] ?? '');
        });
      }
      return line;
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `consumption_savings_connected_load_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    if (typeof onDownload === 'function') onDownload();
  }, [mergedData, unit, onDownload, areaKeys]);

  const chartConfig = useMemo(() => {
    const n = mergedData.length;
    if (n === 96 || n === 97) return { xAxisInterval: 3, xAxisTickCount: 24, xAxisFontSize: 10, strokeWidth: 1.5, dotSize: 1.5 };
    if (n === 28 || n === 29) return { xAxisInterval: 3, xAxisTickCount: 7, xAxisFontSize: 10, strokeWidth: 2, dotSize: 3 };
    if (n >= 30 && n <= 31) return { xAxisInterval: 0, xAxisTickCount: n, xAxisFontSize: 8, strokeWidth: 2, dotSize: 3 };
    if (n === 48) return { xAxisInterval: 3, xAxisTickCount: 12, xAxisFontSize: 8, strokeWidth: 2, dotSize: 2 };
    return { xAxisInterval: 0, xAxisTickCount: Math.min(n, 12), xAxisFontSize: 10, strokeWidth: 2, dotSize: 3 };
  }, [mergedData.length]);

  const consumptionAxisTickFormatter = useCallback(
    (value, index) => {
      if (selectedDuration === 'this-week' && typeof value === 'string') {
        const t = value.trim();
        if (/^sat\s+24$/i.test(t)) return '';
        const dayAtMidnight = t.match(/^([A-Za-z]{3})\s+0$/);
        if (dayAtMidnight) return dayAtMidnight[1];
      }
      return formatXAxisLabel(value, index);
    },
    [selectedDuration, formatXAxisLabel]
  );

  const yDomain = useMemo(() => {
    if (yAxisMax != null && yAxisMax > 0) return [0, Math.ceil(yAxisMax * 1.05) || yAxisMax];
    return undefined;
  }, [yAxisMax]);

  /** Dashed line stops before the last X category so "100%" can sit to the right without overlapping dashes. */
  const connectedLoadRefSegment = useMemo(() => {
    if (yAxisMax == null || yAxisMax <= 0 || mergedData.length < 3) return null;
    const start = mergedData[0]?.date;
    const end = mergedData[mergedData.length - 2]?.date;
    if (start == null || end == null) return null;
    return [
      { x: start, y: yAxisMax },
      { x: end, y: yAxisMax },
    ];
  }, [mergedData, yAxisMax]);

  const hundredPctRefLabel = useMemo(
    () => ({
      value: '100%',
      position: 'right',
      fill: connectedLoadColor,
      fontSize: 11,
      fontWeight: 600,
      offset: 10,
    }),
    [connectedLoadColor]
  );

  const hasData = useMemo(() => {
    if (activeSeries === 'strategy') return true;
    return mergedData.some((row) => {
      const v = row.consumption;
      return v != null && v !== '' && !Number.isNaN(Number(v));
    });
  }, [mergedData, activeSeries]);

  const headerCenterControls = (
    <div
      style={{
        width: 'min(330px, 100%)',
        maxWidth: '100%',
        minWidth: 0,
        flexShrink: 0,
        boxSizing: 'border-box',
      }}
    >
      {topControls}
    </div>
  );

  const headerExportOnly =
    activeSeries !== 'strategy' &&
    (useServerExportMenu ? (
      <div ref={exportMenuWrapRef} style={{ position: 'relative' }} data-energy-combined-export>
        <button
          type="button"
          data-export-menu="true"
          onClick={(event) => {
            event.stopPropagation();
            setShowExportDropdown((v) => !v);
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            color: chrome.exportColor,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <FileUploadOutlined sx={{ fontSize: 18, color: 'inherit', flexShrink: 0 }} aria-hidden />
          Export
        </button>
        {showExportDropdown && (
          <ExportMenuPanel
            panelStyle={chrome.exportMenuPreset.panel}
            panelDataAttribute={chrome.exportMenuPreset.panelDataAttribute}
            className={chrome.exportMenuPreset.className}
            actions={buildEmailDownloadExportActions({
              onEmail: () => {
                setShowExportDropdown(false);
                onEmail();
              },
              onDownload: () => {
                setShowExportDropdown(false);
                onDownloadReport();
              },
              emailLoading: exportEmailLoading,
              downloadLoading: exportDownloadLoading,
              emailLabel: EXPORT_MENU_COPY.email,
              downloadLabel: EXPORT_MENU_COPY.download,
            })}
            itemDefaults={chrome.exportMenuPreset.item}
            useEmoji={chrome.exportMenuUseEmoji}
          />
        )}
      </div>
    ) : (
      <button
        type="button"
        onClick={handleClientCsvDownload}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px',
          color: chrome.exportColor,
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
        }}
      >
        <FileUploadOutlined sx={{ fontSize: 18, color: 'inherit', flexShrink: 0 }} aria-hidden />
        Export
      </button>
    ));

  const seriesTabs = (
    <div style={{ display: 'flex', gap: 16 }}>
      <button
        type="button"
        onClick={() => setActiveSeries('consumption')}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: activeSeries === 'consumption' ? chrome.tabActiveColor : chrome.tabInactiveColor,
          fontSize: 12,
          fontWeight: 600,
          textDecoration: activeSeries === 'consumption' ? 'underline' : 'none',
          textUnderlineOffset: 6,
        }}
      >
        Consumption
      </button>
      <button
        type="button"
        onClick={() => setActiveSeries('strategy')}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: activeSeries === 'strategy' ? chrome.tabActiveColor : chrome.tabInactiveColor,
          fontSize: 12,
          fontWeight: 600,
          textDecoration: activeSeries === 'strategy' ? 'underline' : 'none',
          textUnderlineOffset: 6,
        }}
      >
        Savings By Strategy
      </button>
    </div>
  );

  const cardHeader = (
    <div style={{ marginBottom: 8 }}>
      <div style={{ borderBottom: chrome.divider, paddingBottom: 6, marginBottom: 6 }}>
        <h3 style={chrome.titleStyle}>{title}</h3>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          width: '100%',
        }}
      >
        <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', justifyContent: 'flex-start' }}>
          {seriesTabs}
        </div>
        {headerCenterControls}
        <div
          style={{
            flex: '1 1 0',
            minWidth: 0,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'flex-start',
          }}
        >
          {headerExportOnly}
        </div>
      </div>
    </div>
  );

  if (isLoading || (activeSeries === 'strategy' && strategyLoading)) {
    return (
      <div style={chrome.shell} className={chrome.shellClassName}>
        {cardHeader}
        <div style={{ height: shellVariant === CONSUMPTION_SAVINGS_COMBINED_SHELL_VARIANTS.basic ? '400px' : '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', borderRadius: '4px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: chrome.loader.border,
              borderTop: chrome.loader.borderTop,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
        </div>
      </div>
    );
  }

  // Strategy tab uses `strategyContent` (donut); do not use the consumption line-chart blank frame here.
  if (activeSeries !== 'strategy' && (!hasData || !mergedData.length)) {
    const blank = emptyStateVariant === 'blank'
    const placeholder = blank
      ? Array.from({ length: 24 }, (_, i) => ({
        date: `${String(i).padStart(2, '0')}:00`,
        consumption: null,
        savings: null,
        connectedLoad: null,
      }))
      : []
    return (
      <div style={chrome.shell} className={chrome.shellClassName}>
        {cardHeader}
        <div style={chrome.plotEmpty}>
          {blank ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={placeholder} margin={{ top: 20, right: 100, left: 20, bottom: 8 }}>
                <CartesianGrid stroke={chrome.chart.gridStroke} strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke={chrome.chart.axisStroke}
                  fontSize={10}
                  tick={{ fill: chrome.chart.tickFill, fontWeight: 600, fontSize: 10 }}
                  axisLine={{ stroke: chrome.chart.axisStroke }}
                  tickLine={{ stroke: chrome.chart.axisStroke }}
                  interval={3}
                  angle={-45}
                  textAnchor="end"
                  height={44}
                  type="category"
                />
                <YAxis
                  stroke={chrome.chart.axisStroke}
                  fontSize={10}
                  tick={{ fill: chrome.chart.tickFill, fontWeight: 600, fontSize: 10 }}
                  axisLine={{ stroke: chrome.chart.axisStroke }}
                  tickLine={{ stroke: chrome.chart.axisStroke }}
                  width={50}
                  tickCount={6}
                />
                {/* keep area with nulls so frame matches, but no fill renders */}
                <Area
                  type="monotone"
                  dataKey="consumption"
                  stroke={consumptionColor}
                  fill={consumptionColor}
                  fillOpacity={0.22}
                  connectNulls={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 600 }}>
              No data available
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        ...chrome.shell,
        minHeight:
          shellVariant === CONSUMPTION_SAVINGS_COMBINED_SHELL_VARIANTS.basic
            ? BASIC_CONSUMPTION_SAVINGS_COMBINED_MIN_HEIGHT_PX
            : CONSUMPTION_SAVINGS_COMBINED_MIN_HEIGHT_PX,
      }}
      className={chrome.shellClassName}
    >
      {cardHeader}
      {activeSeries === 'strategy' ? (
        <div style={chrome.strategyPlot}>
          {strategyContent}
        </div>
      ) : (
        <div style={chrome.plot}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={mergedData}
              margin={{ top: 20, right: 100, left: 20, bottom: 8 }}
            >
              <CartesianGrid stroke={chrome.chart.gridStroke} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                stroke={chrome.chart.axisStroke}
                fontSize={chartConfig.xAxisFontSize}
                tick={{ fill: chrome.chart.tickFill, fontWeight: 600, fontSize: chartConfig.xAxisFontSize }}
                tickFormatter={consumptionAxisTickFormatter}
                axisLine={{ stroke: chrome.chart.axisStroke }}
                tickLine={{ stroke: chrome.chart.axisStroke }}
                interval={chartConfig.xAxisInterval}
                angle={-45}
                textAnchor="end"
                height={40}
                type="category"
                tickCount={chartConfig.xAxisTickCount}
                allowDuplicatedCategory={false}
                scale="point"
                label={{
                  value: '(Time)',
                  position: 'insideBottomLeft',
                  offset: -5,
                  style: { textAnchor: 'start', fill: chrome.chart.tickFill, fontSize: '12px', fontWeight: 'bold' },
                }}
              />
              <YAxis
                stroke={chrome.chart.axisStroke}
                fontSize={chartConfig.xAxisFontSize}
                tick={{ fill: chrome.chart.tickFill, fontWeight: 600, fontSize: chartConfig.xAxisFontSize }}
                axisLine={{ stroke: chrome.chart.axisStroke }}
                tickLine={{ stroke: chrome.chart.axisStroke }}
                width={50}
                tickCount={8}
                domain={yDomain}
                label={{
                  value: unit ? `(${unit})` : '',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 15,
                  style: { textAnchor: 'middle', fill: chrome.chart.tickFill, fontSize: '12px', fontWeight: 'bold' },
                }}
              />
              <Tooltip
                content={({ active, label }) => (
                  <CombinedEnergyChartTooltip
                    active={active}
                    label={label}
                    mergedData={mergedData}
                    areaKeys={areaKeys}
                    unit={unit}
                    consumptionColor={consumptionColor}
                    connectedLoadColor={connectedLoadColor}
                  />
                )}
                wrapperStyle={{ pointerEvents: 'auto', zIndex: 20, outline: 'none' }}
                allowEscapeViewBox={{ x: true, y: true }}
                cursor={{ stroke: '#333', strokeWidth: 1 }}
              />
              {/* Legend removed to avoid "Consumption" label under x-axis */}
              {isIndividualAreas ? (
                areaKeys.map((areaName, idx) => {
                  const color = DASHBOARD_PALETTE[idx % DASHBOARD_PALETTE.length];
                  return (
                    <Area
                      key={`${areaName}_consumption`}
                      type="monotone"
                      dataKey={`${areaName}_consumption`}
                      name={`${areaName} Consumption`}
                      fill={color}
                      fillOpacity={0.4 / areaKeys.length}
                      stroke={color}
                      strokeWidth={chartConfig.strokeWidth}
                      dot={{ r: chartConfig.dotSize, fill: color, stroke: '#fff', strokeWidth: 1 }}
                      activeDot={{ r: 4, fill: color, stroke: '#fff', strokeWidth: 0.5 }}
                      connectNulls={false}
                    />
                  );
                })
              ) : (
                <Area
                  type="monotone"
                  dataKey="consumption"
                  name="Consumption"
                  fill={consumptionColor}
                  fillOpacity={0.7}
                  stroke={consumptionColor}
                  strokeWidth={chartConfig.strokeWidth}
                  dot={{ r: chartConfig.dotSize, fill: consumptionColor, stroke: '#fff', strokeWidth: 1 }}
                  activeDot={{ r: 4, fill: consumptionColor, stroke: '#fff', strokeWidth: 0.5 }}
                  connectNulls={false}
                />
              )}
              {yAxisMax != null && yAxisMax > 0 && connectedLoadRefSegment && (
                <ReferenceLine
                  segment={connectedLoadRefSegment}
                  stroke={connectedLoadColor}
                  strokeDasharray="4 4"
                  label={hundredPctRefLabel}
                />
              )}
              {yAxisMax != null && yAxisMax > 0 && !connectedLoadRefSegment && mergedData.length > 0 && (
                <ReferenceLine
                  y={yAxisMax}
                  stroke={connectedLoadColor}
                  strokeDasharray="4 4"
                  label={hundredPctRefLabel}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Summary - single line, no background */}
      <div style={{ marginTop: '2px', marginBottom: '0', color: chrome.summaryColor, fontSize: '14px' }}>
        Summary Total energy consumed: <strong>{summary.totalConsumption.toFixed(1)} {unit}</strong>
        {' · '}
        Savings compared to Full On: <strong>{summary.totalSavings.toFixed(2)} {unit} ({summary.savingsPercent.toFixed(0)}%)</strong>
        {' · '}
        Carbon Footprint: <strong>{formatCo2Kg(carbonFootprintKg)}</strong>
      </div>
    </div>
  );
}

export default React.memo(ConsumptionSavingsCombinedChart);
