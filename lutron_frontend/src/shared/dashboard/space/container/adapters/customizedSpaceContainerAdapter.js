import {
  buildCustomizedSpaceExportOptions,
  buildCustomizedSpaceLayoutContexts,
  buildCustomizedSpaceLayoutOptions,
  buildCustomizedSpaceSections,
  buildCustomizedSpaceVisibility,
  buildCustomizedSpaceWidgetOptions,
  buildSpaceLoadingState,
  buildSpaceWidgetContext,
  resolveDualTabSpaceLayoutContext,
} from './spaceAdapterHelpers';

export const customizedSpaceContainerAdapter = {
  variant: 'customized',

  resolveWidgetOptions(runtime) {
    return buildCustomizedSpaceWidgetOptions(runtime);
  },

  resolveLayoutOptions(runtime) {
    return buildCustomizedSpaceLayoutOptions(runtime);
  },

  resolveExportOptions(runtime) {
    return buildCustomizedSpaceExportOptions(runtime);
  },

  buildLoadingState(widgetOptions) {
    const loading = buildSpaceLoadingState(widgetOptions);
    return { ...loading, anyLoading: false };
  },

  buildWidgetContext(params) {
    return buildSpaceWidgetContext(params);
  },

  buildVisibility(params) {
    return buildCustomizedSpaceVisibility(params);
  },

  buildLayoutContexts(params) {
    return buildCustomizedSpaceLayoutContexts(params);
  },

  resolveLayoutContextForTab(activeTab, orchestration) {
    return resolveDualTabSpaceLayoutContext(activeTab, orchestration);
  },

  buildSections(params) {
    return buildCustomizedSpaceSections(params);
  },
};
