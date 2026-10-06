import {
  buildBasicSpaceExportOptions,
  buildBasicSpaceLayoutContexts,
  buildBasicSpaceLayoutOptions,
  buildBasicSpaceSections,
  buildBasicSpaceVisibility,
  buildBasicSpaceWidgetOptions,
  buildSpaceLoadingState,
  buildSpaceWidgetContext,
  resolveDualTabSpaceLayoutContext,
} from './spaceAdapterHelpers';

export const basicSpaceContainerAdapter = {
  variant: 'basic',

  resolveWidgetOptions(runtime) {
    return buildBasicSpaceWidgetOptions(runtime);
  },

  resolveLayoutOptions(runtime) {
    return buildBasicSpaceLayoutOptions(runtime);
  },

  resolveExportOptions(runtime) {
    return buildBasicSpaceExportOptions(runtime);
  },

  buildLoadingState(widgetOptions) {
    const loading = buildSpaceLoadingState(widgetOptions);
    return { ...loading, anyLoading: false };
  },

  buildWidgetContext(params) {
    return buildSpaceWidgetContext(params);
  },

  buildVisibility(params) {
    return buildBasicSpaceVisibility(params);
  },

  buildLayoutContexts(params) {
    return buildBasicSpaceLayoutContexts(params);
  },

  resolveLayoutContextForTab(activeTab, orchestration) {
    return resolveDualTabSpaceLayoutContext(activeTab, orchestration);
  },

  buildSections(params) {
    return buildBasicSpaceSections(params);
  },
};
