import React from 'react';
import { Box } from '@mui/material';
import FileUploadOutlined from '@mui/icons-material/FileUploadOutlined';
import { SpaceWidgetRenderer } from '../../../../shared/dashboard/space/container';
import { SpaceEmptyPanel } from '../../../../shared/dashboard/space/components/status';
import SpaceInstantUtilizationCombinedChart from './SpaceInstantUtilizationCombinedChart';

const chartEventHandlers = {
  onMouseDown: (e) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
  },
  onMouseUp: (e) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
  },
  onClick: (e) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
  },
  onDoubleClick: (e) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
  },
  onContextMenu: (e) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
  },
};

function resolveCardBackground(spaceUtilLight) {
  return spaceUtilLight ? '#ffffff' : 'rgba(128, 120, 100, 0.6)';
}

function resolveCardBorder(spaceUtilLight) {
  return spaceUtilLight ? '1px solid #e8e8e8' : '1px solid #ccc';
}

function resolveExportColor(spaceUtilLight) {
  return spaceUtilLight ? '#1565C0' : '#fff';
}

function resolveExportButtonHoverBg(spaceUtilLight) {
  return spaceUtilLight ? 'rgba(21, 101, 192, 0.08)' : 'rgba(255, 255, 255, 0.1)';
}

function resolveTitle(slotId, layoutContext, exportMeta) {
  const getWidgetTitle =
    layoutContext?.getWidgetTitle ||
    layoutContext?.widgetRenderContext?.getWidgetTitle;
  const { selectorMode } = layoutContext;
  if (slotId === 'utilization_by_area_group') {
    const fallback =
      selectorMode === 'main' ? exportMeta.fallbackMain : exportMeta.fallbackCharts;
    return typeof getWidgetTitle === 'function'
      ? getWidgetTitle(exportMeta.titleKey, fallback)
      : fallback;
  }
  return typeof getWidgetTitle === 'function'
    ? getWidgetTitle(exportMeta.titleKey, exportMeta.fallback)
    : exportMeta.fallback;
}

const SLOT_EXPORT = {
  utilization: { dropdownKey: 'line', titleKey: 'utilization', fallback: 'Utilization' },
  instant_occupancy_count: {
    dropdownKey: 'instant',
    titleKey: 'instant_occupancy_count',
    fallback: 'Instant Occupancy Count',
  },
  utilization_by_area_group: {
    dropdownKey: 'pie',
    titleKey: 'utilization_by_area_group',
    fallbackCharts: 'Occupancy by Group',
    fallbackMain: 'Utilization By Area Groups',
  },
  utilization_by_area: {
    dropdownKey: 'table',
    titleKey: 'utilization_by_area',
    fallback: 'Utilization By Area',
  },
};

function resolveChartLoaderHeight(slotId, layoutContext) {
  const heights = layoutContext.chartLoaderHeights || {};
  if (heights[slotId]) return heights[slotId];
  if (slotId === 'utilization' || slotId === 'instant_occupancy_count') return '180px';
  if (slotId === 'utilization_by_area_group') return '210px';
  return undefined;
}

export function renderBasicSpaceWidgetSlot(slotId, meta, layoutContext, api) {
  const {
    chartHeaderStyle,
    isLargeScreen,
    spaceUtilLight,
    spacePeakMinOuterSx,
    ExportDropdown,
    showExportDropdown,
    setShowExportDropdown,
    showChartsTab,
  } = api;
  const widgetRenderContext = layoutContext.widgetRenderContext;
  if (!widgetRenderContext) return null;

  if (slotId === 'peak_and_minimum_utilization') {
    return (
      <Box sx={spacePeakMinOuterSx} {...chartEventHandlers}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box component="h3" sx={chartHeaderStyle}>
            {api.getWidgetTitle('peak_and_minimum_utilization', 'Peak & Minimum Utilization')}
          </Box>
        </Box>
        <SpaceWidgetRenderer
          widgetKey="peak_and_minimum_utilization"
          context={{ ...widgetRenderContext, selectorMode: meta.selectorMode }}
        />
      </Box>
    );
  }

  const exportMeta = SLOT_EXPORT[slotId];
  const title = exportMeta ? resolveTitle(slotId, layoutContext, exportMeta) : slotId;
  const cardBg = resolveCardBackground(spaceUtilLight);
  const cardBorder = resolveCardBorder(spaceUtilLight);
  const exportColor = resolveExportColor(spaceUtilLight);
  const exportHoverBg = resolveExportButtonHoverBg(spaceUtilLight);

  const minHeights = {
    utilization: { xs: '220px', sm: '230px', md: '250px', lg: '260px', xl: '280px' },
    instant_occupancy_count: { xs: '220px', sm: '230px', md: '250px', lg: '260px', xl: '280px' },
    utilization_by_area_group: { xs: '200px', sm: '210px', md: '230px', lg: '240px', xl: '260px' },
    utilization_by_area: undefined,
  };

  const instantLightCard = slotId === 'instant_occupancy_count' && spaceUtilLight;

  return (
    <Box
      {...chartEventHandlers}
      sx={{
        backgroundColor: instantLightCard ? '#ffffff' : cardBg,
        borderRadius: '8px',
        padding: { xs: 1.25, sm: 1.5, md: 1.75, lg: 2, xl: 2.25 },
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        border: instantLightCard ? '1px solid #e8e8e8' : cardBorder,
        minHeight: minHeights[slotId] || 0,
        overflow: 'visible',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom:
            slotId === 'utilization_by_area_group'
              ? { xs: 1, sm: 1.25, md: 1.5, lg: 1.75, xl: 2 }
              : { xs: 1.25, sm: 1.5, md: 1.75, lg: 2, xl: 2.25 },
        }}
      >
        <Box component="h3" sx={chartHeaderStyle}>
          {title}
        </Box>
        {exportMeta ? (
          <Box sx={{ position: 'relative' }}>
            <button
              type="button"
              data-export-menu="true"
              onClick={(event) => {
                event.stopPropagation();
                setShowExportDropdown((prev) => ({
                  ...prev,
                  [exportMeta.dropdownKey]: !prev[exportMeta.dropdownKey],
                }));
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: isLargeScreen ? '16px' : '14px',
                color: exportColor,
                display: 'flex',
                alignItems: 'center',
                gap: slotId === 'instant_occupancy_count' ? '9px' : '8px',
                padding: isLargeScreen ? '8px 12px' : '6px 10px',
                borderRadius: '4px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = exportHoverBg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <FileUploadOutlined
                sx={{ fontSize: isLargeScreen ? 20 : 18, color: 'inherit', flexShrink: 0 }}
                aria-hidden
              />
              Export
            </button>
            <ExportDropdown
              isOpen={showExportDropdown[exportMeta.dropdownKey]}
              onClose={() =>
                setShowExportDropdown((prev) => ({ ...prev, [exportMeta.dropdownKey]: false }))
              }
              chartTitle={title}
              dropdownKey={exportMeta.dropdownKey}
            />
          </Box>
        ) : null}
      </Box>
      <SpaceWidgetRenderer
        widgetKey={meta.widgetKey}
        context={{ ...widgetRenderContext, selectorMode: meta.selectorMode }}
        overrides={
          slotId === 'instant_occupancy_count'
            ? {
                chartSurface: spaceUtilLight ? 'light' : 'dark',
                enableUtilizationFooter: true,
              }
            : undefined
        }
        chartLoaderHeight={resolveChartLoaderHeight(slotId, layoutContext)}
      />
    </Box>
  );
}

export function createBasicSpaceLayoutAdapterStyles(resolvers = {}) {
  return {
    buildRows: resolvers.buildRows,
    resolveRowSx: resolvers.resolveRowSx || (() => ({})),
    resolveSlotSx: resolvers.resolveSlotSx || (() => ({})),
    resolveStackSx: resolvers.resolveStackSx || (() => ({ width: '100%', display: 'flex', flexDirection: 'column' })),
    getSlotStorageKey: resolvers.getSlotStorageKey,
  };
}

export function renderBasicInstantUtilizationCombined(api) {
  const {
    getWidgetTitle,
    isLargeScreen,
    isWidgetVisible,
    spaceChartsDurationFilterElement,
    spaceUtilLight,
    spaceWidgetRenderContext,
    showChartsTab,
    ExportDropdown,
    showExportDropdown,
    setShowExportDropdown,
  } = api;

  return (
    <SpaceInstantUtilizationCombinedChart
      cardTitle={getWidgetTitle('instant_utilization_combined', 'Space Utilization')}
      instantTabLabel="Trends Over Time"
      areaTabLabel="Split By Area"
      instantTrendToolbarRight={
        <Box sx={{ position: 'relative' }}>
          <button
            type="button"
            data-export-menu="true"
            onClick={() =>
              setShowExportDropdown((prev) => ({ ...prev, instantCombined: !prev.instantCombined }))
            }
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: isLargeScreen ? '16px' : '14px',
              color: '#1565C0',
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              padding: isLargeScreen ? '8px 12px' : '6px 10px',
              borderRadius: '4px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(21, 101, 192, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            <FileUploadOutlined
              sx={{ fontSize: isLargeScreen ? 20 : 18, color: 'inherit', flexShrink: 0 }}
              aria-hidden
            />
            Export
          </button>
          <ExportDropdown
            isOpen={showExportDropdown.instantCombined}
            onClose={() => setShowExportDropdown((prev) => ({ ...prev, instantCombined: false }))}
            chartTitle={getWidgetTitle('instant_occupancy_count', 'Instant Occupancy Count')}
            dropdownKey="instantCombined"
          />
        </Box>
      }
      instantTrendDateNav={
        isWidgetVisible('instant_utilization_combined') ? spaceChartsDurationFilterElement : null
      }
      instantSection={
        <SpaceWidgetRenderer
          widgetKey="instant_occupancy_count"
          context={{ ...spaceWidgetRenderContext, selectorMode: 'active' }}
          overrides={{
            chartSurface: spaceUtilLight ? 'light' : 'dark',
            enableUtilizationFooter: true,
          }}
          chartLoaderHeight={showChartsTab ? 'clamp(140px, 26vh, 200px)' : '220px'}
        />
      }
      areaSection={
        <>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              marginBottom: { xs: 2, sm: 2.5, md: 3 },
            }}
          >
            <Box sx={{ position: 'relative' }}>
              <button
                type="button"
                data-export-menu="true"
                onClick={() => setShowExportDropdown((prev) => ({ ...prev, table: !prev.table }))}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: isLargeScreen ? '16px' : '14px',
                  color: '#1565C0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: isLargeScreen ? '8px 12px' : '6px 10px',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(21, 101, 192, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                <FileUploadOutlined
                  sx={{ fontSize: isLargeScreen ? 20 : 18, color: 'inherit', flexShrink: 0 }}
                  aria-hidden
                />
                Export
              </button>
              <ExportDropdown
                isOpen={showExportDropdown.table}
                onClose={() => setShowExportDropdown((prev) => ({ ...prev, table: false }))}
                chartTitle={getWidgetTitle('utilization_by_area', 'Utilization By Area')}
                dropdownKey="table"
              />
            </Box>
          </Box>
          <SpaceWidgetRenderer
            widgetKey="utilization_by_area"
            context={{ ...spaceWidgetRenderContext, selectorMode: 'active' }}
          />
        </>
      }
    />
  );
}

export function renderBasicSpaceEmptyState(emptyStateKey) {
  const isCharts = emptyStateKey === 'charts';
  return (
    <SpaceEmptyPanel
      shellVariant="basic"
      title="No Space Utilization widgets are visible"
      subtitle={
        isCharts
          ? 'Turn charts back on under Settings → Rename Widget (Space section), or open /rename-widget/ and re-enable those widgets.'
          : 'Enable widgets under Settings → Rename Widget (Space section), or open /rename-widget/.'
      }
    />
  );
}
