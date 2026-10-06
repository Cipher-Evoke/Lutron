import React from 'react';
import { SPACE_TAB_IDS } from '../spaceLayoutTypes';
import {
  buildSpaceContainerLayoutContext,
  buildSpaceContainerWidgetContext,
} from '../spaceContainerResolvers';
import {
  DEFAULT_SPACE_EXPORT_DROPDOWN_BASIC,
  DEFAULT_SPACE_EXPORT_DROPDOWN_STANDARD,
  SPACE_EXPORT_OUTSIDE_CLICK_PROFILES,
  createSpaceExportOutsideClickProfile,
} from '../../export/spaceExportMenuState';
import {
  buildSharedSpaceWidgetOptionsBase,
  resolveSharedSpaceExportOptionsCore,
} from './spaceAdapterResolvers';

export const ADVANCED_SPACE_EXPORT_PANEL_CLASS = 'chart-export-dropdown';

export function buildSpaceWidgetOptions(runtime, variant) {
  if (variant === 'basic') {
    return buildBasicSpaceWidgetOptions(runtime);
  }
  if (variant === 'advanced') {
    return buildAdvancedSpaceWidgetOptions(runtime);
  }
  return buildCustomizedSpaceWidgetOptions(runtime);
}

export function buildBasicSpaceWidgetOptions(runtime) {
  return {
    ...buildSharedSpaceWidgetOptionsBase(runtime, 'basic'),
    shell: {
      spaceShell: runtime.spaceShell,
      chartSurface: runtime.spaceUtilLight ? 'light' : 'dark',
      colorPalette: runtime.colorPalette,
      isLargeScreen: runtime.isLargeScreen,
      utilizationByAreaLayoutMode: 'scroll',
    },
  };
}

export function buildAdvancedSpaceWidgetOptions(runtime) {
  return {
    ...buildSharedSpaceWidgetOptionsBase(runtime, 'advanced'),
    shell: {
      lineSeriesColor: runtime.occupancyLineColor,
      stackedBarColors: runtime.stackedBarColors,
      colorPalette: runtime.chartPalette,
      cardBackground: runtime.cardBackground,
      cardBorder: runtime.cardBorder,
      cardShadow: runtime.cardShadow,
      metricPanelBorder: runtime.metricPanelBorder,
      isLargeScreen: runtime.isLargeScreen,
      utilizationByAreaLayoutMode: 'fill',
      chartSurface: runtime.spaceUtilLight ? 'light' : 'dark',
    },
  };
}

export function buildCustomizedSpaceWidgetOptions(runtime) {
  return {
    ...buildSharedSpaceWidgetOptionsBase(runtime, 'customized'),
    shouldShowWidget: runtime.shouldShowWidget,
    shell: {
      colorPalette: runtime.colorPalette,
      resolveGroupLabel: runtime.resolveOccupancyGroupLabel,
      requireAreaGroupName: false,
      isUtilizationFullscreen: runtime.isUtilizationFullscreen,
      isInstantOccupancyFullscreen: runtime.isInstantOccupancyFullscreen,
      customizedTheme: runtime.theme,
      isLargeScreen: runtime.isLargeScreen,
      utilizationByAreaLayoutMode: 'flex',
      processOptions: {
        strictOccupiedType: false,
        selectedGroupIds: runtime.selectedGroupIds,
        areaGroups: runtime.areaGroups,
      },
    },
  };
}

export function buildBasicSpaceLayoutOptions(runtime) {
  return {
    showChartsTab: runtime.showChartsTab,
    showOnlyInstantChart: runtime.showOnlyInstantChart,
    spaceChartsVisibleOrder: runtime.spaceChartsVisibleOrder || [],
    spaceMainVisibleOrder: runtime.spaceMainVisibleOrder || [],
    showSpaceChartsStandaloneDurationFilter: runtime.showSpaceChartsStandaloneDurationFilter,
  };
}

export function buildAdvancedSpaceLayoutOptions(runtime) {
  return {
    showChartsTab: runtime.showChartsTab,
    showOnlyInstantChart: runtime.showOnlyInstantChart,
  };
}

export function buildCustomizedSpaceLayoutOptions(runtime) {
  return {
    showChartsTab: runtime.showChartsTab,
    showOnlyInstantChart: runtime.showOnlyInstantChart,
    spaceMergedOrder: runtime.spaceMergedOrder || [],
    shouldShowWidget: runtime.shouldShowWidget,
  };
}

export function buildBasicSpaceExportOptions(runtime) {
  return resolveSharedSpaceExportOptionsCore(runtime, {
    messagePreset: 'basic',
    defaultDropdownState: DEFAULT_SPACE_EXPORT_DROPDOWN_BASIC,
    outsideClickProfile: SPACE_EXPORT_OUTSIDE_CLICK_PROFILES.basic,
  });
}

export function buildAdvancedSpaceExportOptions(runtime) {
  return resolveSharedSpaceExportOptionsCore(runtime, {
    messagePreset: 'advanced',
    defaultDropdownState: DEFAULT_SPACE_EXPORT_DROPDOWN_STANDARD,
    outsideClickProfile: createSpaceExportOutsideClickProfile(ADVANCED_SPACE_EXPORT_PANEL_CLASS),
  });
}

export function buildCustomizedSpaceExportOptions(runtime) {
  return resolveSharedSpaceExportOptionsCore(runtime, {
    messagePreset: 'customized',
    defaultDropdownState: DEFAULT_SPACE_EXPORT_DROPDOWN_STANDARD,
    outsideClickProfile: SPACE_EXPORT_OUTSIDE_CLICK_PROFILES.customized,
  });
}

export function buildSpaceLoadingState(widgetOptions) {
  return widgetOptions.loading;
}

export function buildSpaceWidgetContext({ widgetOptions }) {
  return buildSpaceContainerWidgetContext(widgetOptions);
}

export function buildBasicSpaceVisibility({ layoutOptions }) {
  return {
    spaceChartsVisibleOrder: layoutOptions.spaceChartsVisibleOrder,
    spaceMainVisibleOrder: layoutOptions.spaceMainVisibleOrder,
    showSpaceChartsStandaloneDurationFilter: layoutOptions.showSpaceChartsStandaloneDurationFilter,
    showOnlyInstantChart: layoutOptions.showOnlyInstantChart,
  };
}

export function buildAdvancedSpaceVisibility({ layoutOptions }) {
  return {
    showChartsTab: layoutOptions.showChartsTab,
    showOnlyInstantChart: layoutOptions.showOnlyInstantChart,
  };
}

export function buildCustomizedSpaceVisibility({ layoutOptions }) {
  return {
    showChartsTab: layoutOptions.showChartsTab,
    showOnlyInstantChart: layoutOptions.showOnlyInstantChart,
    spaceMergedOrder: layoutOptions.spaceMergedOrder,
    shouldShowWidget: layoutOptions.shouldShowWidget,
  };
}

export function buildBasicSpaceLayoutContexts({ widgetContext, layoutOptions }) {
  const chartsLayoutContext = buildSpaceContainerLayoutContext({
    variant: 'basic',
    showChartsTab: true,
    visibleSlotOrder: layoutOptions.spaceChartsVisibleOrder,
    showTabChrome: layoutOptions.showSpaceChartsStandaloneDurationFilter,
    widgetRenderContext: widgetContext,
    chartLoaderHeights: {
      instant_occupancy_count: 'clamp(200px, 36vh, 300px)',
      utilization_by_area_group: 'clamp(200px, 42vh, 340px)',
    },
  });

  const mainLayoutContext = buildSpaceContainerLayoutContext({
    variant: 'basic',
    showChartsTab: false,
    visibleSlotOrder: layoutOptions.spaceMainVisibleOrder,
    widgetRenderContext: widgetContext,
    chartLoaderHeights: {
      utilization: '350px',
      utilization_by_area_group: '400px',
    },
  });

  return {
    chartsLayoutContext,
    mainLayoutContext,
    layoutContext: layoutOptions.showChartsTab ? chartsLayoutContext : mainLayoutContext,
  };
}

export function buildAdvancedSpaceLayoutContexts({ widgetContext, layoutOptions }) {
  const layoutContext = buildSpaceContainerLayoutContext({
    variant: 'advanced',
    showChartsTab: layoutOptions.showChartsTab,
    showOnlyInstantChart: layoutOptions.showOnlyInstantChart,
    widgetRenderContext: widgetContext,
  });

  return {
    layoutContext,
    chartsLayoutContext: layoutContext,
    mainLayoutContext: layoutContext,
  };
}

export function buildCustomizedSpaceLayoutContexts({ widgetContext, layoutOptions }) {
  const chartsLayoutContext = buildSpaceContainerLayoutContext({
    variant: 'customized',
    showChartsTab: true,
    mergedSlotOrder: layoutOptions.spaceMergedOrder,
    widgetRenderContext: widgetContext,
  });

  const mainLayoutContext = buildSpaceContainerLayoutContext({
    variant: 'customized',
    showChartsTab: false,
    shouldShowWidget: layoutOptions.shouldShowWidget,
    widgetRenderContext: widgetContext,
  });

  return {
    chartsLayoutContext,
    mainLayoutContext,
    layoutContext: layoutOptions.showChartsTab ? chartsLayoutContext : mainLayoutContext,
  };
}

export function resolveDualTabSpaceLayoutContext(activeTab, orchestration) {
  return activeTab === SPACE_TAB_IDS.CHARTS
    ? orchestration.chartsLayoutContext
    : orchestration.mainLayoutContext;
}

export function resolveAdvancedSpaceLayoutContext(_activeTab, orchestration) {
  return orchestration.layoutContext;
}

export function buildBasicSpaceSections({ orchestration, runtime, activeTab }) {
  const layoutContext = resolveDualTabSpaceLayoutContext(activeTab, orchestration);
  const SpaceLayoutRenderer = runtime.SpaceLayoutRenderer;

  const layout = (
    <SpaceLayoutRenderer
      activeTab={activeTab}
      layoutContext={layoutContext}
      adapter={runtime.layoutAdapter}
      runtime={runtime.layoutRuntime}
    />
  );

  if (typeof runtime.wrapSpaceLayout === 'function') {
    return runtime.wrapSpaceLayout(layout, { activeTab, orchestration });
  }
  return layout;
}

export function buildAdvancedSpaceSections({ orchestration, runtime, activeTab }) {
  const renderSpaceSection =
    runtime.renderSpaceSection || runtime.layoutRuntime?.renderSpaceSection;
  if (typeof renderSpaceSection === 'function') {
    return renderSpaceSection({ orchestration, runtime, activeTab });
  }

  const SpaceLayoutRenderer = runtime.SpaceLayoutRenderer;

  return (
    <SpaceLayoutRenderer
      activeTab={activeTab}
      layoutContext={orchestration.layoutContext}
      adapter={runtime.layoutAdapter}
      runtime={runtime.layoutRuntime}
    />
  );
}

export function buildCustomizedSpaceSections({ orchestration, runtime, activeTab }) {
  const layoutContext = resolveDualTabSpaceLayoutContext(activeTab, orchestration);
  const SpaceLayoutRenderer = runtime.SpaceLayoutRenderer;
  const adapter =
    activeTab === SPACE_TAB_IDS.UTILIZATION && runtime.mainLayoutAdapter
      ? runtime.mainLayoutAdapter
      : runtime.layoutAdapter;
  const layoutRuntime =
    activeTab === SPACE_TAB_IDS.CHARTS
      ? runtime.chartsLayoutRuntime || runtime.layoutRuntime
      : runtime.mainLayoutRuntime || runtime.layoutRuntime;

  return (
    <SpaceLayoutRenderer
      activeTab={activeTab}
      layoutContext={layoutContext}
      adapter={adapter}
      runtime={layoutRuntime}
    />
  );
}
