/**
 * @jest-environment node
 */
import { BaseUrl } from '../../../BaseUrl';
import { fetchSpaceUtilizationPerFromLogs } from './dashboardSlice';

jest.mock('../floor/floorSlice', () => ({
  fetchFloors: {
    pending: { type: 'floor/fetchFloors/pending' },
    fulfilled: { type: 'floor/fetchFloors/fulfilled' },
    rejected: { type: 'floor/fetchFloors/rejected' },
  },
  getLeafByFloorID: {
    pending: { type: 'floor/getLeafByFloorID/pending' },
    fulfilled: { type: 'floor/getLeafByFloorID/fulfilled' },
    rejected: { type: 'floor/getLeafByFloorID/rejected' },
  },
}));

jest.mock('../../../BaseUrl', () => ({
  BaseUrl: {
    get: jest.fn(),
  },
}));

const dispatchThunk = (payload, floors = [{ id: 2 }]) => {
  BaseUrl.get.mockResolvedValueOnce({ data: { status: 'success', utilized_area: [] } });
  return fetchSpaceUtilizationPerFromLogs(payload)(
    jest.fn(),
    () => ({ floor: { floors } }),
    undefined
  );
};

const basePayload = {
  areaIds: null,
  floorIds: null,
  groupIds: [7],
  timeRange: 'this-day',
  startDate: '2026-07-18',
  endDate: '2026-07-18',
  isNavigating: false,
};

describe('customized fetchSpaceUtilizationPerFromLogs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not inject a default floor or unsupported group scope', async () => {
    await dispatchThunk(basePayload);

    const url = BaseUrl.get.mock.calls[0][0];
    expect(url).toContain('/dashboard/space_utilization_per_from_logs?');
    expect(url).toContain('time_range=this_day');
    expect(url).not.toContain('floor_ids=');
    expect(url).not.toContain('area_ids=');
    expect(url).not.toContain('group_ids=');
  });

  it('still sends an explicitly selected floor', async () => {
    await dispatchThunk({ ...basePayload, floorIds: [4] });

    const url = BaseUrl.get.mock.calls[0][0];
    expect(url).toContain('floor_ids=4');
    expect(url).not.toContain('area_ids=');
  });

  it('still sends explicitly selected areas when no floor is selected', async () => {
    await dispatchThunk({ ...basePayload, areaIds: [10, 11] });

    const url = BaseUrl.get.mock.calls[0][0];
    expect(url).toContain('area_ids=10');
    expect(url).toContain('area_ids=11');
    expect(url).not.toContain('floor_ids=');
  });
});
