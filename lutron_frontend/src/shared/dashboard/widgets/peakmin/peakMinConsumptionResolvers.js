import { calculatePeakMinFromChartData } from '../../charts/transforms/calculatePeakMinFromChartData';
import { formatPeakMinDisplay } from '../../charts/transforms/formatPeakMinDisplay';

export function resolvePeakMinConsumptionChartData(energyConsumption, transformDataForCharts) {
  if (!energyConsumption || typeof transformDataForCharts !== 'function') return [];
  return transformDataForCharts(energyConsumption, 'consumption');
}

export function resolvePeakMinConsumptionPeakMin(chartData) {
  if (!chartData || chartData.length === 0) {
    return { peak: { value: null, time: null }, min: { value: null, time: null } };
  }
  return calculatePeakMinFromChartData(chartData);
}

export function resolvePeakMinConsumptionDisplayEntry(entry, displayOptions = {}) {
  return formatPeakMinDisplay(entry, displayOptions);
}

export function resolvePeakMinConsumptionDisplayModel({
  energyConsumption,
  transformDataForCharts,
  displayOptions = {},
}) {
  const chartData = resolvePeakMinConsumptionChartData(energyConsumption, transformDataForCharts);
  const peakMin = resolvePeakMinConsumptionPeakMin(chartData);
  return {
    chartData,
    peakMin,
    peakDisplay: resolvePeakMinConsumptionDisplayEntry(peakMin.peak, displayOptions),
    minDisplay: resolvePeakMinConsumptionDisplayEntry(peakMin.min, displayOptions),
  };
}

export function resolvePeakMinConsumptionExportActions(thunks) {
  return {
    label: 'Peak & Minimum Consumption',
    emailThunk: thunks.sendPeakMinConsumptionEmail,
    downloadThunk: thunks.downloadPeakMinConsumption,
  };
}
