import React from 'react';
import { Box } from '@mui/material';
import { EXPORT_MENU_OUTSIDE_CLICK_PROFILES } from '../helpers/exportMenuUtils';
import {
  createAdvancedGroupExportKeys,
  createBasicGroupExportKeys,
  DEFAULT_CONSUMPTION_EXPORT_KEYS,
  DEFAULT_SAVINGS_EXPORT_KEYS,
} from '../hooks/exportMenuState';
import {
  buildAdvancedEnergyWidgetRenderContext,
  buildBasicEnergyWidgetRenderContext,
} from '../dashboardContainerResolvers';
import {
  resolveDashboardDatesOptions,
  resolveDashboardExportsOptionsCore,
  resolveDashboardWidgetsOptions,
} from './dashboardAdapterResolvers';
import {
  EnergyLayoutRenderer,
  BASIC_LAYOUT_MODE,
  BASIC_ENERGY_SLOT_REGISTRY,
  getBasicEnergySlotMeta,
  resolveBasicRowSx,
  resolveBasicSlotColumnSx,
  ADVANCED_LAYOUT_MODE,
  ADVANCED_ENERGY_FIXED_ROWS,
  ADVANCED_ENERGY_SLOT_REGISTRY,
  ADVANCED_GRID_SPACING,
  ADVANCED_GRID_ITEM_PROPS,
  resolveAdvancedGridRowSx,
  getAdvancedEnergySlotMeta,
} from '../layout';

export const BASIC_TOTAL_CONSUMPTION_BY_GROUP_EXPORT_KEY = 'total_consumption_by_group';

export function buildDashboardWidgetOptions(ctx, variant) {
  return resolveDashboardWidgetsOptions(ctx, variant);
}

export function buildDashboardDatesOptions(ctx) {
  return resolveDashboardDatesOptions(ctx);
}

export function buildDashboardExportOptions(ctx, overrides = {}) {
  return resolveDashboardExportsOptionsCore(ctx, overrides);
}

export function buildBasicDashboardExportOptions(ctx) {
  return buildDashboardExportOptions(ctx, {
    keys: {
      consumption: DEFAULT_CONSUMPTION_EXPORT_KEYS,
      savings: DEFAULT_SAVINGS_EXPORT_KEYS,
      totalConsumptionByGroup: createBasicGroupExportKeys(BASIC_TOTAL_CONSUMPTION_BY_GROUP_EXPORT_KEY),
    },
    // Match basic Space Utilization export outside-click selectors.
    outsideClickProfile: {
      buttonSelector: 'button[data-export-menu]',
      panelSelector: '[data-export-dropdown-panel]',
    },
  });
}

export function buildAdvancedDashboardExportOptions(ctx) {
  return buildDashboardExportOptions(ctx, {
    keys: {
      consumption: DEFAULT_CONSUMPTION_EXPORT_KEYS,
      savings: DEFAULT_SAVINGS_EXPORT_KEYS,
      totalConsumptionByGroup: createAdvancedGroupExportKeys(),
    },
    outsideClickProfile: ctx.outsideClickProfile || EXPORT_MENU_OUTSIDE_CLICK_PROFILES.advanced,
  });
}

export function buildCustomizedDashboardExportOptions(ctx) {
  return buildDashboardExportOptions(ctx, {
    keys: {
      consumption: DEFAULT_CONSUMPTION_EXPORT_KEYS,
      savings: DEFAULT_SAVINGS_EXPORT_KEYS,
      totalConsumptionByGroup: createAdvancedGroupExportKeys(),
    },
    outsideClickProfile: EXPORT_MENU_OUTSIDE_CLICK_PROFILES.basic,
    enableCustomGraphExport: true,
  });
}

export function buildBasicDashboardVisibilityOptions(runtime) {
  return {
    variant: 'basic',
    visibilityMap: runtime.visibilityMap,
    isWidgetVisible: runtime.isWidgetVisible,
    energyReflowLocked: runtime.energyReflowLocked,
    dispatch: runtime.dispatch,
    saveDashboardChartOrder: runtime.saveDashboardChartOrder,
    dashboardChartOrder: runtime.dashboardChartOrder,
    dashboardChartOrderStatus: runtime.dashboardChartOrderStatus,
    widgetList: runtime.widgetList,
    dragTranslateKeys: runtime.energyDragTranslateKeys,
  };
}

export function buildAdvancedDashboardVisibilityOptions(runtime) {
  return {
    variant: 'advanced',
    showOverviewTab: runtime.showOverviewTab,
    widgetConfiguration: runtime.widgetConfiguration,
    widgetConfigurationStatus: runtime.widgetConfigurationStatus,
    widgetList: runtime.widgetList,
    role: runtime.role,
    dispatch: runtime.dispatch,
    saveWidgetVisibility: runtime.saveWidgetVisibility,
    saveDashboardChartOrder: runtime.saveDashboardChartOrder,
    layoutLocked: runtime.energyLayoutLocked === true,
  };
}

export function buildCustomizedDashboardVisibilityOptions(runtime) {
  return {
    variant: 'customized',
    locationPathname: runtime.locationPathname,
    getEffectiveBuiltinDashboardPage: runtime.getEffectiveBuiltinDashboardPage,
    dispatch: runtime.dispatch,
    fetchRenameWidgets: runtime.fetchRenameWidgets,
    fetchCustomGraphs: runtime.fetchCustomGraphs,
    fetchWidgetConfiguration: runtime.fetchWidgetConfiguration,
    widgetConfiguration: runtime.widgetConfiguration,
    widgetConfigurationStatus: runtime.widgetConfigurationStatus,
    saveDashboardChartOrder: runtime.saveDashboardChartOrder,
    layoutLocked: runtime.energyLayoutLocked === true,
  };
}

export function buildTabbedDashboardOverviewSection({
  DashboardOverview,
  overviewData,
  overviewLoading,
  overviewError,
  handleTabChange,
  navigate,
}) {
  return (
    <DashboardOverview
      data={overviewData}
      loading={overviewLoading}
      error={overviewError}
      onNavigateToEnergy={() => handleTabChange('energy')}
      onNavigateToAlerts={() => handleTabChange('alerts')}
      onNavigateToSpaceUtilization={() => handleTabChange('charts')}
      onNavigateToSchedule={() => navigate('/schedule')}
      onNavigateToFloor={() => navigate('/heatmap')}
      onNavigateToQuickControls={() => navigate('/quickcontrols')}
    />
  );
}

export function buildCustomizedDashboardOverviewSection({
  DashboardOverview,
  overviewData,
  overviewLoading,
  overviewError,
  navigate,
  handleNavigateToEnergy,
  handleNavigateToSpace,
}) {
  return (
    <DashboardOverview
      data={overviewData}
      loading={overviewLoading}
      error={overviewError}
      onNavigateToAlerts={() => navigate('/dashboard/alerts')}
      onNavigateToEnergy={handleNavigateToEnergy}
      onNavigateToSpaceUtilization={handleNavigateToSpace}
      onNavigateToSchedule={() => navigate('/schedule')}
      onNavigateToFloor={() => navigate('/heatmap')}
      onNavigateToQuickControls={() => navigate('/quickcontrols')}
    />
  );
}

export function buildStandardDashboardChartsSection({
  SpaceUtilization,
  widgets,
  instantOccupancyCount,
  instantOccupancyCountLoading,
  globalLoading,
  pinChartsDurationFilterInHeader = false,
  onChartsDurationFilterPinnedChange,
  getCurrentPeriodText,
  handlePrevious,
  handleNext,
}) {
  return (
    <div style={{ padding: '0px' }}>
      <SpaceUtilization
        title={widgets.getWidgetTitle('instant_occupancy_count', 'Instant Occupancy Count')}
        data={instantOccupancyCount}
        isLoading={instantOccupancyCountLoading || globalLoading}
        globalLoadingProp={globalLoading}
        showChartsTab={true}
        pinChartsDurationFilterInHeader={pinChartsDurationFilterInHeader}
        onChartsDurationFilterPinnedChange={onChartsDurationFilterPinnedChange}
        getCurrentPeriodText={getCurrentPeriodText}
        handlePrevious={handlePrevious}
        handleNext={handleNext}
      />
    </div>
  );
}

/** Basic Space Utilization (charts tab) — optional pinned duration filter in Dashboard header. */
export function buildBasicDashboardChartsSection(runtime) {
  const {
    SpaceUtilization,
    widgets,
    instantOccupancyCount,
    instantOccupancyCountLoading,
    globalLoading,
    pinChartsDurationFilterInHeader,
    onChartsDurationFilterPinnedChange,
  } = runtime;

  return buildStandardDashboardChartsSection({
    SpaceUtilization,
    widgets,
    instantOccupancyCount,
    instantOccupancyCountLoading,
    globalLoading,
    pinChartsDurationFilterInHeader,
    onChartsDurationFilterPinnedChange,
  });
}

export function buildCustomizedDashboardChartsSection({
  SpaceUtilization,
  globalLoading,
  apiParams,
}) {
  return (
    <div style={{ padding: '0px' }}>
      <SpaceUtilization
        globalLoadingProp={globalLoading}
        showChartsTab={true}
        dashboardApiParams={apiParams}
      />
    </div>
  );
}

export function buildStandardDashboardAlertsSection({
  Alerts,
  filterKey,
  selectedAlertTypes,
  focusAlertFromLocation,
}) {
  return (
    <Alerts
      key={`alerts-${filterKey}`}
      selectedTypes={selectedAlertTypes}
      focusAlert={focusAlertFromLocation}
    />
  );
}

export function buildCustomizedDashboardAlertsSection({
  Alerts,
  filterKey,
  selectedAlertTypes,
  focusAlertFromLocation,
  alertsShellClassName,
}) {
  return (
    <Box
      className={alertsShellClassName}
      sx={{
        width: '100%',
        maxWidth: '100%',
        mx: 'auto',
        boxSizing: 'border-box',
      }}
    >
      <Alerts
        key={`alerts-${filterKey}`}
        selectedTypes={selectedAlertTypes}
        focusAlert={focusAlertFromLocation}
      />
    </Box>
  );
}

export function buildBasicDashboardEnergySection({ orchestration, runtime }) {
  const { visibility } = orchestration;
  const { theme, energyLayoutAdapter, energyLayoutRuntime } = runtime;
  const energyWidgetRenderContext = buildBasicEnergyWidgetRenderContext(orchestration, runtime);

  const layout = (
    <EnergyLayoutRenderer
      variant="basic"
      layoutMode={BASIC_LAYOUT_MODE}
      rows={visibility.energyDashboardRows}
      context={energyWidgetRenderContext}
      adapter={
        energyLayoutAdapter || {
          SLOT_REGISTRY: BASIC_ENERGY_SLOT_REGISTRY,
          resolveRowSx: resolveBasicRowSx,
          resolveSlotColumnSx: resolveBasicSlotColumnSx,
          getSlotMeta: getBasicEnergySlotMeta,
        }
      }
      adapterRuntime={energyLayoutRuntime}
      theme={theme}
    />
  );

  const wrappedLayout =
    typeof runtime.wrapEnergyLayout === 'function' ? runtime.wrapEnergyLayout(layout) : layout;

  return (
    <>
      {visibility.energyVisibleSlotOrder.length === 0 && (
        <Box
          sx={{
            width: '100%',
            py: 4,
            px: 2,
            textAlign: 'center',
            color: 'text.secondary',
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'action.hover',
          }}
        >
          <Box component="p" sx={{ m: 0, mb: 1, fontWeight: 600, color: 'text.primary' }}>
            No Energy widgets are visible
          </Box>
          <Box component="p" sx={{ m: 0, fontSize: 14 }}>
            Turn charts back on under Settings → Rename Widget (Energy section), or open
            /rename-widget/ and re-enable those widgets.
          </Box>
        </Box>
      )}
      {wrappedLayout}
    </>
  );
}

export function buildAdvancedDashboardEnergySection({ orchestration, runtime }) {
  if (typeof runtime.renderEnergySection === 'function') {
    return runtime.renderEnergySection(orchestration);
  }

  const { energyLayoutAdapter, energyLayoutRuntime } = runtime;
  const energyWidgetRenderContext = buildAdvancedEnergyWidgetRenderContext(orchestration, runtime);

  return (
    <EnergyLayoutRenderer
      variant="advanced"
      layoutMode={ADVANCED_LAYOUT_MODE}
      rows={ADVANCED_ENERGY_FIXED_ROWS}
      context={energyWidgetRenderContext}
      adapter={
        energyLayoutAdapter || {
          SLOT_REGISTRY: ADVANCED_ENERGY_SLOT_REGISTRY,
          GRID_SPACING: ADVANCED_GRID_SPACING,
          GRID_ITEM_PROPS: ADVANCED_GRID_ITEM_PROPS,
          resolveGridRowSx: resolveAdvancedGridRowSx,
          getSlotMeta: getAdvancedEnergySlotMeta,
        }
      }
      adapterRuntime={energyLayoutRuntime}
    />
  );
}

export function buildCustomizedDashboardEnergySection({ orchestration, runtime }) {
  return typeof runtime.renderEnergySection === 'function'
    ? runtime.renderEnergySection(orchestration)
    : null;
}

export function buildBasicDashboardSections({ orchestration, runtime }) {
  const { widgets } = orchestration;

  return {
    overview: buildTabbedDashboardOverviewSection(runtime),
    energy: buildBasicDashboardEnergySection({ orchestration, runtime }),
    charts: buildBasicDashboardChartsSection({ ...runtime, widgets }),
    alerts: buildStandardDashboardAlertsSection(runtime),
  };
}

export function buildAdvancedDashboardChartsSection({
  SpaceUtilization,
  widgets,
  instantOccupancyCount,
  instantOccupancyCountLoading,
  pinChartsDurationFilterInHeader = false,
  onChartsDurationFilterPinnedChange,
  getCurrentPeriodText,
  handlePrevious,
  handleNext,
}) {
  return (
    <div style={{ padding: '0px' }}>
      <SpaceUtilization
        title={widgets.getWidgetTitle('instant_occupancy_count', 'Instant Occupancy Count')}
        data={instantOccupancyCount}
        // Do not OR globalLoading into isLoading — that forces every widget to
        // show a loader when any one Space chart API is fetching.
        isLoading={Boolean(instantOccupancyCountLoading)}
        globalLoadingProp={false}
        showChartsTab={true}
        pinChartsDurationFilterInHeader={pinChartsDurationFilterInHeader}
        onChartsDurationFilterPinnedChange={onChartsDurationFilterPinnedChange}
        getCurrentPeriodText={getCurrentPeriodText}
        handlePrevious={handlePrevious}
        handleNext={handleNext}
      />
    </div>
  );
}

export function buildAdvancedDashboardSections({ orchestration, runtime }) {
  const { widgets, dates } = orchestration;

  return {
    overview: buildTabbedDashboardOverviewSection(runtime),
    energy: buildAdvancedDashboardEnergySection({ orchestration, runtime }),
    charts: buildAdvancedDashboardChartsSection({
      ...runtime,
      widgets,
      getCurrentPeriodText: dates?.getCurrentPeriodText,
      handlePrevious: dates?.handlePrevious,
      handleNext: dates?.handleNext,
    }),
    alerts: buildStandardDashboardAlertsSection(runtime),
  };
}

export function buildCustomizedDashboardSections({ orchestration, runtime }) {
  return {
    overview: buildCustomizedDashboardOverviewSection(runtime),
    energy: buildCustomizedDashboardEnergySection({ orchestration, runtime }),
    charts: buildCustomizedDashboardChartsSection(runtime),
    alerts: buildCustomizedDashboardAlertsSection(runtime),
  };
}
