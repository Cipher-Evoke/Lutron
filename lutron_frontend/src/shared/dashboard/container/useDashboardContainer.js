import {
  useDashboardExports,
  useDashboardDates,
  useDashboardWidgets,
} from './hooks';
import { useMemo } from 'react';

export function useDashboardContainer(adapter, runtime) {
  const visibilityOptions = adapter.resolveVisibilityOptions(runtime);
  const useVisibility = adapter.useVisibility;
  const visibility = useVisibility(visibilityOptions);

  const widgets = useDashboardWidgets(
    adapter.resolveWidgetsOptions({
      ...runtime,
      visibility,
    })
  );

  const dates = useDashboardDates(
    adapter.resolveDatesOptions({
      ...runtime,
      widgets,
      setChartLoading: widgets.setChartLoading,
      setAllEnergyChartsReady: widgets.setAllEnergyChartsReady,
    })
  );

  const exports = useDashboardExports(
    adapter.resolveExportsOptions({
      ...runtime,
      dates,
      calculateDateParameters: dates.calculateDateParameters,
    })
  );

  return useMemo(
    () => ({
      visibility,
      widgets,
      dates,
      exports,
    }),
    [visibility, widgets, dates, exports]
  );
}
