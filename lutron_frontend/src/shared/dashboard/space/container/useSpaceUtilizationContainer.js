import { useMemo } from 'react';
import { useSpaceExports } from '../export/useSpaceExports';

export function useSpaceUtilizationContainer(adapter, runtime) {
  const widgetOptions = useMemo(
    () => adapter.resolveWidgetOptions(runtime),
    [adapter, runtime]
  );

  const layoutOptions = useMemo(
    () => adapter.resolveLayoutOptions(runtime),
    [adapter, runtime]
  );

  const exportOptions = useMemo(
    () => adapter.resolveExportOptions(runtime),
    [adapter, runtime]
  );

  const exports = useSpaceExports(exportOptions);

  const loading = useMemo(
    () => adapter.buildLoadingState(widgetOptions, layoutOptions),
    [adapter, widgetOptions, layoutOptions]
  );

  const widgetContext = useMemo(
    () => adapter.buildWidgetContext({ runtime, widgetOptions, loading, exports }),
    [adapter, runtime, widgetOptions, loading, exports]
  );

  const visibility = useMemo(
    () => adapter.buildVisibility({ runtime, layoutOptions }),
    [adapter, runtime, layoutOptions]
  );

  const layoutContexts = useMemo(
    () => adapter.buildLayoutContexts({ runtime, widgetContext, layoutOptions, visibility }),
    [adapter, runtime, widgetContext, layoutOptions, visibility]
  );

  return {
    exports,
    widgetContext,
    layoutContext: layoutContexts.layoutContext,
    chartsLayoutContext: layoutContexts.chartsLayoutContext,
    mainLayoutContext: layoutContexts.mainLayoutContext,
    loading,
    visibility,
  };
}

export default useSpaceUtilizationContainer;
