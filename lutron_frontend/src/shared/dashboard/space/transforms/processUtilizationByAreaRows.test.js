/**
 * @jest-environment node
 */
import { processUtilizationByAreaRows } from './processUtilizationByAreaRows';

const basicPayload = {
  utilized_area: [
    { name: 'Area B', occupied: 80 },
    { name: 'Area A', occupied: 40 },
    { name: 'Area C', occupied: 150 },
    { name: 'Bad', occupied: 'x' },
    { name: null, occupied: 10 },
  ],
};

describe('processUtilizationByAreaRows', () => {
  it('basic/advanced: sorts descending and caps percentage at 100', () => {
    const rows = processUtilizationByAreaRows(basicPayload);
    expect(rows).toEqual([
      { name: 'Area C', percentage: 100 },
      { name: 'Area B', percentage: 80 },
      { name: 'Area A', percentage: 40 },
    ]);
  });

  it('returns empty array for error status', () => {
    expect(processUtilizationByAreaRows({ status: 'error', utilized_area: [] })).toEqual([]);
  });

  it('returns empty array for missing payload', () => {
    expect(processUtilizationByAreaRows(null)).toEqual([]);
    expect(processUtilizationByAreaRows(undefined)).toEqual([]);
  });

  it('returns empty when utilized_area is missing', () => {
    expect(processUtilizationByAreaRows({ status: 'ok' })).toEqual([]);
  });

  it('customized: accepts data array and percentage field', () => {
    const rows = processUtilizationByAreaRows(
      {
        data: [
          { name: 'Zone 1', percentage: 55 },
          { name: 'Zone 2', occupied: 12 },
        ],
      },
      { strictOccupiedType: false }
    );
    expect(rows).toEqual([
      { name: 'Zone 1', percentage: 55 },
      { name: 'Zone 2', percentage: 12 },
    ]);
  });

  it('customized: filters by selected area groups', () => {
    const rows = processUtilizationByAreaRows(
      {
        utilized_area: [
          { name: 'Lobby', occupied: 70 },
          { name: 'Office', occupied: 30 },
        ],
      },
      {
        strictOccupiedType: false,
        selectedGroupIds: [1],
        areaGroups: {
          user_area_groups: [
            {
              group_id: 1,
              areas: [{ name: 'Lobby' }],
            },
          ],
          special_area_groups: [],
        },
      }
    );
    expect(rows).toEqual([{ name: 'Lobby', percentage: 70 }]);
  });

  it('customized: no group filter when selected groups do not match', () => {
    const rows = processUtilizationByAreaRows(
      {
        utilized_area: [{ name: 'Lobby', occupied: 70 }],
      },
      {
        strictOccupiedType: false,
        selectedGroupIds: [99],
        areaGroups: { user_area_groups: [], special_area_groups: [] },
      }
    );
    expect(rows).toEqual([{ name: 'Lobby', percentage: 70 }]);
  });
});
