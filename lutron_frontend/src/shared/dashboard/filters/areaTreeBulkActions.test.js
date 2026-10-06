/**
 * @jest-environment node
 */
import {
  buildClearAllResolution,
  buildSelectAllResolution,
  loadAllAreasFromAllFloors,
  shouldSkipLoadAllAreas,
  processFloorPayloadForAreaLoad,
  buildAreaMappingsFromFloorPayload,
} from './areaTreeBulkActions';

const payload = {
  floor_id: 3,
  tree: [
    { area_id: 1, name: 'A1', area_code: 'A1' },
    {
      name: 'Zone',
      children: [{ area_id: 2, name: 'A2', area_name: 'Area Two', area_code: 'A2' }],
    },
  ],
};

describe('areaTreeBulkActions', () => {
  it('buildClearAllResolution clears local and redux state', () => {
    const res = buildClearAllResolution({ includeCustomWidgetFilters: true });
    expect(res.local.localSelectedAreas).toEqual([]);
    expect(res.redux.customWidgetFilters).toBeNull();
    expect(res.ui.showAreaDropdown).toBe(false);
  });

  it('buildSelectAllResolution floors case prioritizes floor ids', () => {
    const res = buildSelectAllResolution({
      variant: 'basic',
      localSelectedFloorIds: [1, 2],
      localSelectedAreas: [99],
      floors: [{ id: 1, name: 'F1' }],
    });
    expect(res.case).toBe('floors');
    expect(res.redux.selectedAreas).toEqual([]);
    expect(res.redux.selectedFloorIds).toEqual([1, 2]);
  });

  it('buildSelectAllResolution areas case merges group areas', () => {
    const res = buildSelectAllResolution({
      variant: 'advanced',
      localSelectedAreas: [1],
      localSelectedGroups: [7],
      getAllAreasFromGroup: (gid) => (gid === 7 ? [8, 9] : []),
    });
    expect(res.case).toBe('areas');
    expect(res.redux.selectedAreas).toEqual([1, 8, 9]);
    expect(res.redux.selectedGroupIds).toEqual([7]);
  });

  it('buildSelectAllResolution customized mixed scope sets customWidgetFilters', () => {
    const areaIdToFloorId = new Map([
      [5, 1],
      ['5', 1],
      [6, 2],
      ['6', 2],
    ]);
    const res = buildSelectAllResolution({
      variant: 'customized',
      localSelectedFloorIds: [1],
      localSelectedAreas: [5, 6],
      localSelectedGroups: [],
      floors: [{ id: 1, name: 'F1' }],
      areaIdToFloorId,
      getAllAreasFromGroup: () => [],
    });
    expect(res.redux.customWidgetFilters).toEqual({
      floor_ids: [1],
      area_ids: [6],
    });
  });

  it('shouldSkipLoadAllAreas respects variant guards', () => {
    expect(shouldSkipLoadAllAreas({ allAreasLoaded: true, selectedAreasLength: 0, variant: 'basic' })).toBe(
      true
    );
    expect(
      shouldSkipLoadAllAreas({
        allAreasLoaded: true,
        selectedAreasLength: 0,
        variant: 'customized',
        areaIdToFloorIdSize: 0,
      })
    ).toBe(false);
  });

  it('loadAllAreasFromAllFloors collects ids across floors', () => {
    const result = loadAllAreasFromAllFloors(
      [
        { payload, floorId: 3 },
        { payload: { areas: [{ area_id: 9, name: 'Solo' }] }, floorId: 4 },
      ],
      { variant: 'basic' }
    );
    expect(result.areaIds).toEqual([1, 2, 9]);
  });

  it('processFloorPayloadForAreaLoad builds customized mappings', () => {
    const result = processFloorPayloadForAreaLoad({
      payload,
      floorId: 3,
      variant: 'customized',
      flattenOptions: { includeAreaName: true },
    });
    expect(result.mappings.areaIdToFloorIdEntries.length).toBeGreaterThan(0);
    expect(result.selectableAreas[0].area_name).toBeUndefined();
  });

  it('buildAreaMappingsFromFloorPayload maps ids and names', () => {
    const mappings = buildAreaMappingsFromFloorPayload(payload, 3);
    expect(mappings.persistentAreaNameEntries).toEqual(
      expect.arrayContaining([[2, 'Area Two']])
    );
  });
});
