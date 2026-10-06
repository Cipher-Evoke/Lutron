/**
 * @jest-environment node
 */
import { transformDataForCharts } from './transforms/transformDataForCharts';
import { calculatePeakMinFromChartData } from './transforms/calculatePeakMinFromChartData';
import {
  getEnergyLineChartConfig,
  resolveEnergyLineSeriesNames,
  resolveEnergyLineSeriesColors,
} from './config/energyLineChartConfig';
import {
  generateEnergyLineColorPalette,
  resolveEnergyLineChartKind,
} from './config/energyLineColorPalette';
import { resolveEnergyChartTheme } from './themes/energyChartTheme';
import {
  createEnergyExportActionMap,
  ENERGY_EXPORT_WIDGET_KEYS,
} from '../export/energyExportActionMap';

const areaTree = {
  tree: [
    { area_id: 1, name: 'Area One' },
    { area_id: 2, name: 'Area Two' },
  ],
};

const transformOptions = {
  selectedDuration: 'this-week',
  selectedAreas: [1, 2],
  areaTree,
};

const consumptionPayload = {
  'x-axis': Array.from({ length: 29 }, (_, i) => (i === 0 || i === 28 ? 'Sun 0' : `Mon ${i}`)),
  'y-axis': { 'Combined Areas': Array.from({ length: 29 }, (_, i) => i * 10) },
  unit: 'kWh',
  max_limit: 500,
};

const savingsPayload = {
  'x-axis': ['Mon 0', 'Tue 0', 'Wed 0'],
  'y-axis': { 'Combined Areas': [5, 15, 0] },
  unit: 'kWh',
};

function buildEnergyLineDataset({ title, data, colors, shellVariant, legendSeriesName }) {
  const chartKind = resolveEnergyLineChartKind({ title, legendSeriesName });
  const chartType = chartKind === 'consumption' ? 'consumption' : 'other';
  const chartData = transformDataForCharts(data, chartType, transformOptions);
  const seriesNames = resolveEnergyLineSeriesNames(chartData);
  const paletteKind = chartKind === 'savings' ? 'savings' : chartKind;
  const seriesColors = resolveEnergyLineSeriesColors(seriesNames, colors, (count) =>
    generateEnergyLineColorPalette(count, {
      chartKind: paletteKind,
      selectedAreaCount: transformOptions.selectedAreas.length,
    })
  );
  const strokeWidthProfile = shellVariant === 'customized-builtin' ? 'bold' : 'standard';
  const chartConfig = getEnergyLineChartConfig(chartData, { strokeWidthProfile });
  const dynamicUnit =
    data?.unit || (chartKind === 'consumption' && shellVariant === 'customized-builtin' ? 'W' : '');
  return { chartData, seriesNames, seriesColors, chartConfig, dynamicUnit, yAxisLimit: data?.max_limit };
}

describe('EnergyLineChart dataset parity across variants', () => {
  const colors = ['#e57373', '#64b5f6', '#81c784', '#ffd54f'];

  it('consumption widget renders identical datasets (basic/advanced/customized)', () => {
    const basic = buildEnergyLineDataset({
      title: 'Consumption',
      data: consumptionPayload,
      colors,
      shellVariant: 'basic-energy',
    });
    const advanced = buildEnergyLineDataset({
      title: 'Consumption',
      data: consumptionPayload,
      colors,
      shellVariant: 'advanced-card',
    });
    const customized = buildEnergyLineDataset({
      title: 'Consumption',
      data: consumptionPayload,
      colors,
      shellVariant: 'customized-builtin',
      legendSeriesName: 'Energy Consumption',
    });

    expect(advanced.chartData).toEqual(basic.chartData);
    expect(customized.chartData).toEqual(basic.chartData);
    expect(advanced.seriesNames).toEqual(basic.seriesNames);
    expect(customized.seriesNames).toEqual(basic.seriesNames);
    expect(advanced.seriesColors).toEqual(basic.seriesColors);
    expect(customized.seriesColors).toEqual(basic.seriesColors);
    expect(advanced.dynamicUnit).toBe('kWh');
    expect(customized.dynamicUnit).toBe('kWh');
    expect(advanced.yAxisLimit).toBe(500);
  });

  it('savings widget renders identical datasets across variants', () => {
    const basic = buildEnergyLineDataset({
      title: 'Savings',
      data: savingsPayload,
      colors,
      shellVariant: 'basic-energy',
    });
    const advanced = buildEnergyLineDataset({
      title: 'Savings',
      data: savingsPayload,
      colors,
      shellVariant: 'advanced-card',
    });
    const customized = buildEnergyLineDataset({
      title: 'Savings',
      data: savingsPayload,
      colors,
      shellVariant: 'customized-builtin',
      legendSeriesName: 'Energy Savings',
    });

    expect(advanced.chartData).toEqual(basic.chartData);
    expect(customized.chartData).toEqual(basic.chartData);
    expect(advanced.seriesNames).toEqual(basic.seriesNames);
    expect(customized.seriesNames).toEqual(basic.seriesNames);
  });

  it('customized uses bold stroke profile only', () => {
    const basic = buildEnergyLineDataset({
      title: 'Consumption',
      data: consumptionPayload,
      colors,
      shellVariant: 'basic-energy',
    });
    const customized = buildEnergyLineDataset({
      title: 'Consumption',
      data: consumptionPayload,
      colors,
      shellVariant: 'customized-builtin',
      legendSeriesName: 'Energy Consumption',
    });
    expect(customized.chartConfig.strokeWidth).toBeGreaterThan(basic.chartConfig.strokeWidth);
  });
});

describe('Peak/min overlay parity (consumption chart data)', () => {
  it('calculatePeakMinFromChartData matches across variant transforms', () => {
    const chartData = transformDataForCharts(consumptionPayload, 'consumption', transformOptions);
    const peakMin = calculatePeakMinFromChartData(chartData);
    expect(peakMin.peak.value).toBe(270);
    expect(peakMin.min.value).toBe(0);
    expect(peakMin.peak.time).toBeTruthy();
    expect(peakMin.min.time).toBeTruthy();
  });
});

describe('Energy line chart shell themes', () => {
  it('empty state message variant uses theme emptyText per surface', () => {
    const dark = resolveEnergyChartTheme({ chartSurface: 'dark' });
    const light = resolveEnergyChartTheme({ chartSurface: 'light' });
    expect(dark.emptyText).toBe('#fff');
    expect(light.emptyText).toContain('0, 0, 0');
  });

  it('loading state themes resolve for all shell variants', () => {
    expect(resolveEnergyChartTheme({ chartSurface: 'dark' }).header).toBe('#ffffff');
    expect(resolveEnergyChartTheme({ preset: 'advanced' }).useCssTooltipVars).toBe(true);
    expect(resolveEnergyChartTheme({ preset: 'customized' }).dropdownBg).toBe('#CDC0A0');
  });
});

describe('Energy export actions unchanged for line chart widgets', () => {
  const thunks = {
    sendEnergyConsumptionEmail: 'c-email',
    downloadEnergyConsumption: 'c-dl',
    sendEnergySavingsEmail: 's-email',
    downloadEnergySavings: 's-dl',
  };

  it('consumption export email/download thunks resolve', () => {
    const map = createEnergyExportActionMap(thunks);
    expect(map[ENERGY_EXPORT_WIDGET_KEYS.CONSUMPTION].emailThunk).toBe('c-email');
    expect(map[ENERGY_EXPORT_WIDGET_KEYS.CONSUMPTION].downloadThunk).toBe('c-dl');
  });

  it('savings export email/download thunks resolve', () => {
    const map = createEnergyExportActionMap(thunks);
    expect(map[ENERGY_EXPORT_WIDGET_KEYS.SAVINGS].emailThunk).toBe('s-email');
    expect(map[ENERGY_EXPORT_WIDGET_KEYS.SAVINGS].downloadThunk).toBe('s-dl');
  });
});
