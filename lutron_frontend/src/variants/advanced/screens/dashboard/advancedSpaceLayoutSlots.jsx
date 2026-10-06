import React from 'react';
import { Box } from '@mui/material';
import ChartExportButton from '../../components/ChartExportButton';
import { CARD_BACKGROUND, CARD_BORDER, CARD_SHADOW } from '../../config/themeConstants';
import { SpaceWidgetRenderer } from '../../../../shared/dashboard/space/container';
import SpaceInstantUtilizationCombinedChart from '../../../basic/screens/dashboard/SpaceInstantUtilizationCombinedChart';
import {
  SPACE_INSTANT_UTILIZATION_COMBINED_SHELL_VARIANTS,
} from '../../../../shared/dashboard/widgets/space/spaceInstantUtilizationCombinedChrome';

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

const SLOT_EXPORT = {
  instant_occupancy_count: { dropdownKey: 'instant', titleKey: 'instant_occupancy_count', fallback: 'Instant Occupancy Count' },
  utilization: { dropdownKey: 'line', titleKey: 'utilization', fallback: 'Utilization' },
  utilization_by_area_group: { dropdownKey: 'pie', titleKey: 'utilization_by_area_group', fallbackCharts: 'Occupancy by Group', fallbackMain: 'Utilization By Area Groups' },
  utilization_by_area: { dropdownKey: 'table', titleKey: 'utilization_by_area', fallback: 'Utilization By Area' },
};

const SLOT_CHART_LOADER_HEIGHT = {
  instant_occupancy_count: '350px',
  utilization: '350px',
  utilization_by_area_group: '400px',
};

const ADVANCED_COMBINED_SURFACE = {
  cardBackground: CARD_BACKGROUND,
  cardBorder: CARD_BORDER,
  cardShadow: CARD_SHADOW,
  cardClassName: 'chart-card-animated',
};

const SLOT_CARD_SX = {
  instant_occupancy_count: {
    background: CARD_BACKGROUND,
    borderRadius: '8px',
    padding: { xs: 2, sm: 2.5, md: 3, lg: 4, xl: 5 },
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    border: '1px solid #ccc',
    minHeight: { xs: '400px', sm: '430px', md: '450px', lg: '470px', xl: '500px' },
  },
  utilization: {
    background: CARD_BACKGROUND,
    borderRadius: '8px',
    padding: { xs: 2, sm: 2.5, md: 3, lg: 4, xl: 5 },
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    border: '1px solid #ccc',
    minHeight: { xs: '400px', sm: '430px', md: '450px', lg: '470px', xl: '500px' },
  },
  utilization_by_area_group: {
    background: CARD_BACKGROUND,
    borderRadius: '8px',
    padding: { xs: 2, sm: 2.5, md: 3, lg: 4, xl: 5 },
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    border: '1px solid #ccc',
    minHeight: { xs: '350px', sm: '380px', md: '400px', lg: '420px', xl: '450px' },
  },
  peak_and_minimum_utilization: {
    background: CARD_BACKGROUND,
    borderRadius: '8px',
    padding: { xs: 2, sm: 2.5, md: 3, lg: 4, xl: 5 },
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    border: '1px solid #ccc',
    minHeight: { xs: '200px', sm: '220px', md: '240px', lg: '260px', xl: '280px' },
  },
  utilization_by_area: {
    width: '100%',
    background: CARD_BACKGROUND,
    borderRadius: '8px',
    padding: { xs: 2, sm: 2.5, md: 3, lg: 4, xl: 5 },
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    border: '1px solid #ccc',
    height: { xs: '600px', sm: '650px', md: '700px', lg: '850px', xl: '900px' },
  },
};

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

export function renderAdvancedSpaceWidgetSlot(slotId, meta, layoutContext, api) {
  const {
    chartHeaderStyle,
    isLargeScreen,
    ExportDropdown,
    showExportDropdown,
    setShowExportDropdown,
    spaceChartsDurationFilterElement,
    isWidgetVisible,
  } = api;
  const widgetRenderContext = layoutContext.widgetRenderContext;
  if (!widgetRenderContext) return null;

  if (slotId === 'instant_utilization_combined') {
    return (
      <SpaceInstantUtilizationCombinedChart
        cardTitle={api.getWidgetTitle('instant_utilization_combined', 'Space Utilization')}
        shellVariant={SPACE_INSTANT_UTILIZATION_COMBINED_SHELL_VARIANTS.advanced}
        advancedSurface={ADVANCED_COMBINED_SURFACE}
        titleStyle={chartHeaderStyle}
        instantTabLabel="Trends Over Time"
        areaTabLabel="Split By Area"
        instantTrendToolbarRight={
          <Box sx={{ position: 'relative' }}>
            <ChartExportButton
              size={isLargeScreen ? 'large' : 'medium'}
              onClick={() =>
                setShowExportDropdown((prev) => ({
                  ...prev,
                  instant: !prev.instant,
                }))
              }
            />
            <ExportDropdown
              isOpen={showExportDropdown.instant}
              onClose={() =>
                setShowExportDropdown((prev) => ({ ...prev, instant: false }))
              }
              chartTitle={api.getWidgetTitle('instant_occupancy_count', 'Instant Occupancy Count')}
              dropdownKey="instant"
            />
          </Box>
        }
        instantTrendDateNav={
          typeof isWidgetVisible === 'function' &&
          isWidgetVisible('instant_utilization_combined')
            ? spaceChartsDurationFilterElement
            : null
        }
        instantSection={
          <SpaceWidgetRenderer
            widgetKey="instant_occupancy_count"
            context={{ ...widgetRenderContext, selectorMode: 'active' }}
            chartLoaderHeight="clamp(200px, 36vh, 300px)"
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
                <ChartExportButton
                  size={isLargeScreen ? 'large' : 'medium'}
                  onClick={() =>
                    setShowExportDropdown((prev) => ({
                      ...prev,
                      table: !prev.table,
                    }))
                  }
                />
                <ExportDropdown
                  isOpen={showExportDropdown.table}
                  onClose={() =>
                    setShowExportDropdown((prev) => ({ ...prev, table: false }))
                  }
                  chartTitle={api.getWidgetTitle('utilization_by_area', 'Utilization By Area')}
                  dropdownKey="table"
                />
              </Box>
            </Box>
            <SpaceWidgetRenderer
              widgetKey="utilization_by_area"
              context={{ ...widgetRenderContext, selectorMode: 'active' }}
            />
          </>
        }
      />
    );
  }

  if (slotId === 'peak_and_minimum_utilization') {
    return (
      <Box className="chart-card-animated" sx={SLOT_CARD_SX.peak_and_minimum_utilization} {...chartEventHandlers}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: { xs: 1.5, sm: 2, md: 2.5, lg: 3, xl: 3.5 },
          }}
        >
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

  return (
    <Box className="chart-card-animated" sx={SLOT_CARD_SX[slotId]} {...chartEventHandlers}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom:
            slotId === 'utilization_by_area_group'
              ? { xs: 1.5, sm: 2, md: 2.5, lg: 3, xl: 3.5 }
              : { xs: 2, sm: 2.5, md: 3, lg: 4, xl: 5 },
        }}
      >
        <Box component="h3" sx={chartHeaderStyle}>
          {title}
        </Box>
        {exportMeta ? (
          <Box sx={{ position: 'relative' }}>
            <ChartExportButton
              size={isLargeScreen ? 'large' : 'medium'}
              onClick={() =>
                setShowExportDropdown((prev) => ({
                  ...prev,
                  [exportMeta.dropdownKey]: !prev[exportMeta.dropdownKey],
                }))
              }
            />
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
        chartLoaderHeight={SLOT_CHART_LOADER_HEIGHT[slotId]}
      />
    </Box>
  );
}

export function createAdvancedSpaceLayoutAdapterStyles() {
  return {
    resolveFullSectionSx: () => ({}),
    resolveSplitSectionSx: () => ({
      display: 'flex',
      gap: { xs: 2, sm: 3, md: 4, lg: 5.5, xl: 6 },
      flexWrap: 'wrap',
      flexDirection: { xs: 'column', lg: 'row' },
      width: '100%',
    }),
    resolveSplitLeftColumnSx: () => ({
      width: { xs: '100%', lg: '48%' },
      display: 'flex',
      flexDirection: 'column',
      gap: { xs: 2, sm: 3, md: 4, lg: 5, xl: 6 },
    }),
    resolveSplitRightColumnSx: () => ({
      width: { xs: '100%', lg: '48%' },
      display: 'flex',
      flexDirection: 'column',
      gap: { xs: 2, sm: 3, md: 4, lg: 5, xl: 6 },
    }),
  };
}
