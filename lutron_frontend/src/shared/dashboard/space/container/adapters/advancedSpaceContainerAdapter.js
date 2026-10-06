import {
  buildAdvancedSpaceExportOptions,
  buildAdvancedSpaceLayoutContexts,
  buildAdvancedSpaceLayoutOptions,
  buildAdvancedSpaceSections,
  buildAdvancedSpaceVisibility,
  buildAdvancedSpaceWidgetOptions,
  buildSpaceLoadingState,
  buildSpaceWidgetContext,
  resolveAdvancedSpaceLayoutContext,
} from './spaceAdapterHelpers';

export const advancedSpaceContainerAdapter = {
  variant: 'advanced',

  resolveWidgetOptions(runtime) {
    return buildAdvancedSpaceWidgetOptions(runtime);
  },

  resolveLayoutOptions(runtime) {
    return buildAdvancedSpaceLayoutOptions(runtime);
  },

  resolveExportOptions(runtime) {
    return buildAdvancedSpaceExportOptions(runtime);
  },

  buildLoadingState(widgetOptions) {
    const loading = buildSpaceLoadingState(widgetOptions);
    // Per-widget loaders only — anyLoading would force every Space widget to
    // flash together when one chart API is in flight (tab switch flicker).
    return { ...loading, anyLoading: false };
  },

  buildWidgetContext(params) {
    return buildSpaceWidgetContext(params);
  },

  buildVisibility(params) {
    return buildAdvancedSpaceVisibility(params);
  },

  buildLayoutContexts(params) {
    return buildAdvancedSpaceLayoutContexts(params);
  },

  resolveLayoutContextForTab(activeTab, orchestration) {
    return resolveAdvancedSpaceLayoutContext(activeTab, orchestration);
  },

  buildSections(params) {
    return buildAdvancedSpaceSections(params);
  },
};
