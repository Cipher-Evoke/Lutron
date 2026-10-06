/**
 * @jest-environment node
 */
import { formatPeakMinTimeLabel } from '../../charts/transforms/formatPeakMinTimeLabel';
import {
  resolveSpacePeakMinDataSource,
  resolveSpacePeakMinModel,
} from '../transforms/resolveSpacePeakMinModel';
import {
  resolveSpacePeakMinLoading,
  resolveSpacePeakMinTheme,
  SPACE_PEAK_MIN_THEME_PRESETS,
} from './spacePeakMinTheme';
import {
  legacySpacePeakMinLoading,
  sharedSpacePeakMinLoading,
  spacePeakMinCardsPropsAreEqual,
} from './spacePeakMinMemoCompare';

const occupancyPayload = {
  status: 'ok',
  'x-axis': ['Mon 0', 'Mon 1', 'Mon 2'],
  'y-axis': { Occupancy: [10, 50, 30] },
};

const instantPayload = {
  status: 'ok',
  'x-axis': ['Mon 0', 'Mon 1', 'Mon 2'],
  'y-axis': { Instant: [5, 80, 20] },
};

function legacyMetricDisplay(value, time, selectedDuration, currentDate) {
  const valueText = value !== null && value !== undefined ? value : 'No data';
  let timeText = 'No data';
  if (time) {
    timeText = `at ${formatPeakMinTimeLabel(time, selectedDuration, currentDate)}`;
  }
  return { valueText, timeText };
}

function legacyPeakMinPipeline({
  showChartsTab,
  instantOccupancyCount,
  occupancyCount,
  selectedDuration,
  currentDate,
}) {
  const model = resolveSpacePeakMinModel({
    dataSource: resolveSpacePeakMinDataSource({
      showChartsTab,
      instantOccupancyCount,
      occupancyCount,
    }),
    selectedDuration,
    currentDate,
  });
  return {
    peak: legacyMetricDisplay(model.peakValue, model.peakTime, selectedDuration, currentDate),
    min: legacyMetricDisplay(model.minimumValue, model.minimumTime, selectedDuration, currentDate),
  };
}

describe('SpacePeakMinCards loading parity', () => {
  const readyProps = {
    instantOccupancyCountLoading: false,
    anyLoading: false,
    isLoading: false,
    globalLoadingProp: false,
    includeInstantLoading: true,
  };

  it('legacy loading matches shared resolver on charts tab', () => {
    expect(sharedSpacePeakMinLoading(readyProps)).toBe(legacySpacePeakMinLoading(readyProps));
    expect(resolveSpacePeakMinLoading(readyProps)).toBe(false);
  });

  it('loading when instant occupancy fetch in flight (charts tab)', () => {
    const loading = { ...readyProps, instantOccupancyCountLoading: true };
    expect(resolveSpacePeakMinLoading(loading)).toBe(true);
    expect(legacySpacePeakMinLoading(loading)).toBe(true);
  });

  it('space tab can omit instant loading flag', () => {
    const props = {
      ...readyProps,
      instantOccupancyCountLoading: true,
      includeInstantLoading: false,
    };
    expect(resolveSpacePeakMinLoading(props)).toBe(false);
  });

  it('explicit isLoading prop overrides resolver', () => {
    expect(sharedSpacePeakMinLoading({ isLoading: true })).toBe(true);
  });
});

describe('SpacePeakMinCards peak/min values', () => {
  const displayOptions = {
    selectedDuration: 'this-week',
    currentDate: '2024-06-10',
  };

  it('main tab uses occupancyCount payload', () => {
    const pipeline = legacyPeakMinPipeline({
      showChartsTab: false,
      instantOccupancyCount: instantPayload,
      occupancyCount: occupancyPayload,
      ...displayOptions,
    });
    expect(pipeline.peak.valueText).toBe(50);
    expect(pipeline.min.valueText).toBe(10);
  });

  it('charts tab uses instantOccupancyCount payload', () => {
    const pipeline = legacyPeakMinPipeline({
      showChartsTab: true,
      instantOccupancyCount: instantPayload,
      occupancyCount: occupancyPayload,
      ...displayOptions,
    });
    expect(pipeline.peak.valueText).toBe(80);
    expect(pipeline.min.valueText).toBe(5);
  });

  it('empty payload yields No data display', () => {
    const pipeline = legacyPeakMinPipeline({
      showChartsTab: false,
      instantOccupancyCount: null,
      occupancyCount: { status: 'error' },
      ...displayOptions,
    });
    expect(pipeline.peak.valueText).toBe('No data');
    expect(pipeline.min.valueText).toBe('No data');
    expect(pipeline.peak.timeText).toBe('No data');
  });
});

describe('SpacePeakMinCards theme presets', () => {
  it('basic stretch theme uses blue panel', () => {
    const theme = resolveSpacePeakMinTheme({
      preset: SPACE_PEAK_MIN_THEME_PRESETS.basic,
      chartSurface: 'light',
    });
    expect(theme.panelLayout).toBe('basic-stretch');
    expect(theme.panelBg).toBe('#1565C0');
  });

  it('advanced theme uses loading min height', () => {
    const theme = resolveSpacePeakMinTheme({
      preset: SPACE_PEAK_MIN_THEME_PRESETS.advanced,
      metricPanelBorder: '1px solid #444',
    });
    expect(theme.panelLayout).toBe('centered');
    expect(theme.loadingMinHeight).toBe('120px');
    expect(theme.panelBorder).toBe('1px solid #444');
  });

  it('customized theme uses centered-fixed layout with compact row height', () => {
    const theme = resolveSpacePeakMinTheme({
      preset: SPACE_PEAK_MIN_THEME_PRESETS.customized,
    });
    expect(theme.panelLayout).toBe('centered-fixed');
    expect(theme.rowGap).toBe('15px');
    expect(theme.rowHeight).toBe('120px');
    expect(theme.panelBg).toBe('#232323');
  });
});

describe('SpacePeakMinCards memo compare', () => {
  it('detects duration changes', () => {
    const base = {
      isLoading: false,
      shellVariant: 'basic',
      chartSurface: 'light',
      metricPanelBorder: null,
      isLargeScreen: true,
      showChartsTab: false,
      selectedDuration: 'this-week',
      currentDate: '2024-06-10',
      includeInstantLoading: true,
      occupancyCount: occupancyPayload,
      instantOccupancyCount: instantPayload,
    };
    expect(spacePeakMinCardsPropsAreEqual(base, { ...base, selectedDuration: 'today' })).toBe(
      false
    );
    expect(spacePeakMinCardsPropsAreEqual(base, { ...base })).toBe(true);
  });
});
