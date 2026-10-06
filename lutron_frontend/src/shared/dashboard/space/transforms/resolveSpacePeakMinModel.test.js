/**
 * @jest-environment node
 */
import {
  resolveSpacePeakMinDataSource,
  resolveSpacePeakMinModel,
} from './resolveSpacePeakMinModel';

const samplePayload = {
  'x-axis': ['Mon 0', 'Tue 0', 'Wed 0'],
  'y-axis': { data: [2, 9, 4] },
};

describe('resolveSpacePeakMinModel', () => {
  it('returns formatted peak and minimum values', () => {
    const model = resolveSpacePeakMinModel({
      dataSource: samplePayload,
      selectedDuration: 'this-day',
      currentDate: 'Wed Jan 15 2025',
    });
    expect(model.peakValue).toBe(9);
    expect(model.minimumValue).toBe(2);
    expect(model.peakTime).toBe('Tue 0');
    expect(model.minimumTime).toBe('Mon 0');
  });

  it('returns null model for error payload', () => {
    expect(
      resolveSpacePeakMinModel({
        dataSource: { status: 'error' },
        selectedDuration: 'this-day',
        currentDate: 'Wed Jan 15 2025',
      })
    ).toEqual({
      peakValue: null,
      peakTime: null,
      minimumValue: null,
      minimumTime: null,
    });
  });

  it('returns null model when axes are missing', () => {
    expect(
      resolveSpacePeakMinModel({
        dataSource: { status: 'ok' },
        selectedDuration: 'this-day',
        currentDate: 'Wed Jan 15 2025',
      })
    ).toEqual({
      peakValue: null,
      peakTime: null,
      minimumValue: null,
      minimumTime: null,
    });
  });

  it('resolveSpacePeakMinDataSource matches variant tab routing', () => {
    const instant = { id: 'instant' };
    const occupancy = { id: 'occupancy' };
    expect(
      resolveSpacePeakMinDataSource({
        showChartsTab: true,
        instantOccupancyCount: instant,
        occupancyCount: occupancy,
      })
    ).toBe(instant);
    expect(
      resolveSpacePeakMinDataSource({
        showChartsTab: false,
        instantOccupancyCount: instant,
        occupancyCount: occupancy,
      })
    ).toBe(occupancy);
  });

  it('parity: legacy peak/min shape can be derived from model', () => {
    const model = resolveSpacePeakMinModel({
      dataSource: samplePayload,
      selectedDuration: 'this-day',
      currentDate: 'Wed Jan 15 2025',
    });
    const legacy = {
      peak: model.peakValue,
      min: model.minimumValue,
      peakTime: model.peakTime,
      minTime: model.minimumTime,
    };
    expect(legacy.peak).toBe(9);
    expect(legacy.min).toBe(2);
  });
});
