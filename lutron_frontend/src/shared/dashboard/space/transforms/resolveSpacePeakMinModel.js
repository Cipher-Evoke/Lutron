import { calculatePeakMinFromOccupancyPayload } from '../../charts/transforms/calculatePeakMinFromOccupancyPayload';
import { formatPeakMinTimeLabel } from '../../charts/transforms/formatPeakMinTimeLabel';

const EMPTY_MODEL = {
  peakValue: null,
  peakTime: null,
  minimumValue: null,
  minimumTime: null,
};

/**
 * Resolve display-ready peak/min model from occupancy chart payload.
 *
 * @param {object} params
 * @param {object|null|undefined} params.dataSource — occupancy or instant occupancy API payload
 * @param {string} [params.selectedDuration]
 * @param {string|Date} [params.currentDate]
 * @returns {{ peakValue: number|null, peakTime: string|null, minimumValue: number|null, minimumTime: string|null }}
 */
export function resolveSpacePeakMinModel({ dataSource, selectedDuration, currentDate }) {
  try {
    if (!dataSource || dataSource.status === 'error') {
      return { ...EMPTY_MODEL };
    }
    if (!dataSource['x-axis'] || !dataSource['y-axis']) {
      return { ...EMPTY_MODEL };
    }

    const raw = calculatePeakMinFromOccupancyPayload(dataSource);

    return {
      peakValue: raw.peak ?? null,
      peakTime: raw.peakTime
        ? formatPeakMinTimeLabel(raw.peakTime, selectedDuration, currentDate)
        : null,
      minimumValue: raw.min ?? null,
      minimumTime: raw.minTime
        ? formatPeakMinTimeLabel(raw.minTime, selectedDuration, currentDate)
        : null,
    };
  } catch {
    return { ...EMPTY_MODEL };
  }
}

/**
 * Pick occupancy payload for peak/min cards by active tab mode.
 *
 * @param {object} params
 * @param {boolean} params.showChartsTab
 * @param {object|null|undefined} params.instantOccupancyCount
 * @param {object|null|undefined} params.occupancyCount
 */
export function resolveSpacePeakMinDataSource({
  showChartsTab,
  instantOccupancyCount,
  occupancyCount,
}) {
  return showChartsTab ? instantOccupancyCount : occupancyCount;
}
