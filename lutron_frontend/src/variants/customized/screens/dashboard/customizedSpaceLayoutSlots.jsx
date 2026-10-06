import React from 'react';
import { Box } from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { SpaceWidgetRenderer } from '../../../../shared/dashboard/space/container';
import { SpaceChartExportMenu } from '../../../../shared/dashboard/export/components';
import SpaceInstantUtilizationCombinedChart from '../../../basic/screens/dashboard/SpaceInstantUtilizationCombinedChart';
import {
  SPACE_INSTANT_UTILIZATION_COMBINED_SHELL_VARIANTS,
} from '../../../../shared/dashboard/widgets/space/spaceInstantUtilizationCombinedChrome';
import {
  BUILTIN_CHART_HEADER_ROW,
} from '../../utils/advancedBuiltinChartStyles';

/** Survives parent remounts when export loading updates Space Utilization. */
const CUSTOMIZED_COMBINED_TAB_MEMORY = { tab: 'instant' };

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
  instant_occupancy_count: {
    dropdownKey: 'instant',
    titleKey: 'instant_occupancy_count',
    fallback: 'Instant Occupancy Count',
  },
  utilization: { dropdownKey: 'line', titleKey: 'utilization', fallback: 'Utilization' },
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

const SLOT_CHART_LOADER_HEIGHT = {
  instant_occupancy_count: '350px',
  utilization: '350px',
  utilization_by_area_group: '400px',
};

/** Combined card — match standalone customized instant occupancy chart chrome. */
const COMBINED_INSTANT_TRENDS_CHART_OVERRIDES = {
  shellVariant: 'customized',
  chartSurface: 'dark',
};

function CustomizedCombinedSpaceWidgetSlot({ layoutContext, api }) {
  const {
    chartHeaderStyle,
    isLargeScreen,
    shouldShowWidget,
    exportLoading = {},
    handleExport,
  } = api;
  const widgetRenderContext = layoutContext.widgetRenderContext;
  const [combinedExportOpen, setCombinedExportOpen] = React.useState({
    instant: false,
    table: false,
  });
  const [activeTab, setActiveTab] = React.useState(CUSTOMIZED_COMBINED_TAB_MEMORY.tab);

  if (!widgetRenderContext) return null;

  const combinedTitle =
    typeof api.getWidgetTitle === 'function'
      ? api.getWidgetTitle('instant_utilization_combined', 'Space Utilization (Combined)')
      : 'Space Utilization (Combined)';
  const displayTitle = api.generateDynamicChartTitle
    ? api.generateDynamicChartTitle(combinedTitle)
    : combinedTitle;

  const instantExportTitle = api.generateDynamicChartTitle
    ? api.generateDynamicChartTitle(
        api.getWidgetTitle('instant_occupancy_count', 'Instant Occupancy Count')
      )
    : api.getWidgetTitle('instant_occupancy_count', 'Instant Occupancy Count');
  const areaExportTitle = api.generateDynamicChartTitle
    ? api.generateDynamicChartTitle(
        api.getWidgetTitle('utilization_by_area', 'Utilization By Area')
      )
    : api.getWidgetTitle('utilization_by_area', 'Utilization By Area');

  const handleTabChange = (next) => {
    CUSTOMIZED_COMBINED_TAB_MEMORY.tab = next;
    setActiveTab(next);
  };

  const toggleCombinedExport = (key) => (event) => {
    if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
    setCombinedExportOpen((prev) => ({
      instant: key === 'instant' ? !prev.instant : false,
      table: key === 'table' ? !prev.table : false,
    }));
  };

  const runCombinedExport = (dropdownKey, chartTitle) => (action, nextTitle, nextKey) => {
    // Keep Split By Area selected across the parent re-render from exportLoading.
    CUSTOMIZED_COMBINED_TAB_MEMORY.tab = activeTab;
    setCombinedExportOpen({ instant: false, table: false });
    if (typeof handleExport === 'function') {
      handleExport(action, nextTitle || chartTitle, nextKey || dropdownKey);
    }
  };

  const exportButtonStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: isLargeScreen ? '16px' : '14px',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    padding: isLargeScreen ? '8px 12px' : '6px 10px',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
  };

  return (
    <SpaceInstantUtilizationCombinedChart
      cardTitle={displayTitle}
      shellVariant={SPACE_INSTANT_UTILIZATION_COMBINED_SHELL_VARIANTS.customized}
      titleStyle={chartHeaderStyle}
      instantTabLabel="Trends Over Time"
      areaTabLabel="Split By Area"
      activeTab={activeTab}
      onTabChange={handleTabChange}
      instantTrendToolbarRight={
        <Box sx={{ position: 'relative' }}>
          <button type="button" onClick={toggleCombinedExport('instant')} style={exportButtonStyle}>
            <FileUploadIcon fontSize="small" /> Export
          </button>
          <SpaceChartExportMenu
            isOpen={combinedExportOpen.instant}
            chartTitle={instantExportTitle}
            dropdownKey="instant"
            exportLoading={exportLoading}
            onExport={runCombinedExport('instant', instantExportTitle)}
            shellVariant="customized"
            isLargeScreen={isLargeScreen}
          />
        </Box>
      }
      instantTrendDateNav={
        typeof shouldShowWidget === 'function' && shouldShowWidget('instant_utilization_combined')
          ? api.spaceChartsDurationFilterElement
          : null
      }
      instantSection={
        <SpaceWidgetRenderer
          widgetKey="instant_occupancy_count"
          context={{ ...widgetRenderContext, selectorMode: 'active' }}
          visible
          overrides={COMBINED_INSTANT_TRENDS_CHART_OVERRIDES}
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
              <button type="button" onClick={toggleCombinedExport('table')} style={exportButtonStyle}>
                <FileUploadIcon fontSize="small" /> Export
              </button>
              <SpaceChartExportMenu
                isOpen={combinedExportOpen.table}
                chartTitle={areaExportTitle}
                dropdownKey="table"
                exportLoading={exportLoading}
                onExport={runCombinedExport('table', areaExportTitle)}
                shellVariant="customized"
                isLargeScreen={isLargeScreen}
              />
            </Box>
          </Box>
          <Box sx={{ minHeight: 'clamp(280px, 36vh, 360px)' }}>
            <SpaceWidgetRenderer
              widgetKey="utilization_by_area"
              context={{ ...widgetRenderContext, selectorMode: 'active' }}
              visible
              chartLoaderHeight="clamp(200px, 36vh, 300px)"
            />
          </Box>
        </>
      }
    />
  );
}

function resolveTitle(slotId, layoutContext, exportMeta, api) {
  const getWidgetTitle =
    layoutContext?.getWidgetTitle ||
    layoutContext?.widgetRenderContext?.getWidgetTitle;
  const { selectorMode } = layoutContext;
  let title;
  if (slotId === 'utilization_by_area_group') {
    const fallback =
      selectorMode === 'main' ? exportMeta.fallbackMain : exportMeta.fallbackCharts;
    title =
      typeof getWidgetTitle === 'function'
        ? getWidgetTitle(exportMeta.titleKey, fallback)
        : fallback;
  } else {
    title =
      typeof getWidgetTitle === 'function'
        ? getWidgetTitle(exportMeta.titleKey, exportMeta.fallback)
        : exportMeta.fallback;
  }
  if (selectorMode === 'active' && api.generateDynamicChartTitle) {
    return api.generateDynamicChartTitle(title);
  }
  return title;
}

function cardSx(slotId, theme) {
  const base = {
    backgroundColor: 'rgba(128, 120, 100, 0.6)',
    borderRadius: '8px',
    padding: { xs: 2, sm: 2.5, md: 3, lg: 4, xl: 5 },
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    border: '1px solid #ccc',
  };
  if (slotId === 'utilization_by_area' && theme === 'default_white') {
    return { ...base, backgroundColor: '#fff', border: '1px solid #000' };
  }
  if (slotId === 'utilization' || slotId === 'instant_occupancy_count') {
    return { ...base, minHeight: { xs: '400px', sm: '430px', md: '450px', lg: '470px', xl: '500px' } };
  }
  if (slotId === 'utilization_by_area_group') {
    return { ...base, minHeight: { xs: '350px', sm: '380px', md: '400px', lg: '420px', xl: '450px' } };
  }
  if (slotId === 'peak_and_minimum_utilization') {
    return {
      ...base,
      minWidth: 0,
      minHeight: { xs: '200px', sm: '220px', md: '240px', lg: '260px', xl: '280px' },
      display: 'flex',
      flexDirection: 'column',
    };
  }
  if (slotId === 'utilization_by_area') {
    return {
      ...base,
      minWidth: 0,
      height: { xs: '600px', sm: '650px', md: '700px', lg: '850px', xl: '900px' },
      display: 'flex',
      flexDirection: 'column',
    };
  }
  return base;
}

export function renderCustomizedSpaceWidgetSlot(slotId, meta, layoutContext, api) {
  const {
    chartHeaderStyle,
    isLargeScreen,
    ExportDropdown,
    showExportDropdown,
    setShowExportDropdown,
    theme,
  } = api;
  const widgetRenderContext = layoutContext.widgetRenderContext;
  if (!widgetRenderContext) return null;

  if (slotId === 'instant_utilization_combined') {
    return <CustomizedCombinedSpaceWidgetSlot layoutContext={layoutContext} api={api} />;
  }

  if (slotId === 'peak_and_minimum_utilization') {
    return (
      <Box sx={cardSx(slotId, theme)} {...chartEventHandlers}>
        <Box sx={BUILTIN_CHART_HEADER_ROW}>
          <Box component="h3" sx={chartHeaderStyle}>
            {api.generateDynamicChartTitle(
              api.getWidgetTitle('peak_and_minimum_utilization', 'Peak & Minimum Utilization')
            )}
          </Box>
        </Box>
        <Box sx={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', flexDirection: 'column' }}>
          <SpaceWidgetRenderer
            widgetKey="peak_and_minimum_utilization"
            context={{ ...widgetRenderContext, selectorMode: meta.selectorMode }}
          />
        </Box>
      </Box>
    );
  }

  const exportMeta = SLOT_EXPORT[slotId];
  const title = exportMeta ? resolveTitle(slotId, layoutContext, exportMeta, api) : slotId;
  const exportChartTitle =
    layoutContext.selectorMode === 'main' && slotId === 'utilization'
      ? api.getWidgetTitle('utilization', 'Utilization')
      : exportMeta && layoutContext.selectorMode === 'active'
        ? api.generateDynamicChartTitle(
            api.getWidgetTitle(exportMeta.titleKey, exportMeta.fallback)
          )
        : title;

  return (
    <Box sx={cardSx(slotId, theme)} {...chartEventHandlers}>
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
            <button
              onClick={() =>
                setShowExportDropdown((prev) => ({
                  ...prev,
                  [exportMeta.dropdownKey]: !prev[exportMeta.dropdownKey],
                }))
              }
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: isLargeScreen ? '16px' : '14px',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                padding: isLargeScreen ? '8px 12px' : '6px 10px',
                borderRadius: '4px',
                transition: 'background-color 0.2s',
              }}
            >
              <FileUploadIcon fontSize="small" /> Export
            </button>
            <ExportDropdown
              isOpen={showExportDropdown[exportMeta.dropdownKey]}
              onClose={() =>
                setShowExportDropdown((prev) => ({ ...prev, [exportMeta.dropdownKey]: false }))
              }
              chartTitle={exportChartTitle}
              dropdownKey={exportMeta.dropdownKey}
            />
          </Box>
        ) : null}
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <SpaceWidgetRenderer
          widgetKey={meta.widgetKey}
          context={{ ...widgetRenderContext, selectorMode: meta.selectorMode }}
          chartLoaderHeight={
            slotId === 'utilization' || slotId === 'instant_occupancy_count'
              ? '100%'
              : SLOT_CHART_LOADER_HEIGHT[slotId]
          }
        />
      </Box>
    </Box>
  );
}

export { createAdvancedSpaceLayoutAdapterStyles as createCustomizedSpaceLayoutAdapterStyles } from '../../../advanced/screens/dashboard/advancedSpaceLayoutSlots';
