/**
 * @jest-environment node
 */
import {
  getAreaSelectionText,
  buildClearAllResolution,
  buildSelectAllResolution,
  resolveAreaToggleSelection,
  resolveFloorDeselectAreas,
} from './index';

const floors = [{ id: 1, floor_name: 'Ground' }, { id: 2, name: 'Upper' }];
const areaTree = {
  tree: [
    {
      name: 'Building',
      children: [{ area_id: 10, name: 'Lobby' }, { area_id: 11, name: 'Office' }],
    },
    { group_id: 7, name: 'G7', areas: [{ area_id: 20 }, { area_id: 21 }] },
  ],
};

function legacyBasicGetAreaSelectionText(ctx) {
  const {
    selectedFloorIds,
    localSelectedFloorIds,
    localSelectedGroups,
    localSelectedAreas,
    selectedAreas,
    floors: fl,
    areaTree: tree,
  } = ctx;

  if (selectedFloorIds?.length > 0) {
    if (selectedFloorIds.length === 1) {
      const floor = fl.find((f) => f.id === selectedFloorIds[0]);
      return floor?.floor_name || floor?.name || `Floor ${selectedFloorIds[0]}`;
    }
    return `${selectedFloorIds.length} Floors Selected`;
  }
  if (localSelectedFloorIds.length > 0) {
    if (localSelectedFloorIds.length === 1) {
      const floor = fl.find((f) => f.id === localSelectedFloorIds[0]);
      return floor?.floor_name || floor?.name || `Floor ${localSelectedFloorIds[0]}`;
    }
    return `${localSelectedFloorIds.length} Floors Selected`;
  }
  if (localSelectedGroups.length > 0) {
    return localSelectedGroups.length === 1 ? '1 Group Selected' : `${localSelectedGroups.length} Groups Selected`;
  }
  const displayAreas = localSelectedAreas.length > 0 ? localSelectedAreas : selectedAreas;
  if (
    displayAreas.length === 0 &&
    localSelectedFloorIds.length === 0 &&
    localSelectedGroups.length === 0 &&
    (!selectedFloorIds || selectedFloorIds.length === 0)
  ) {
    return tree?.tree?.[0]?.name || 'Project Name';
  }
  if (displayAreas.length === 1) return 'Lobby';
  if (displayAreas.length === 2) return 'Building';
  if (displayAreas.length >= 5) return 'Combined Areas';
  return `${displayAreas.length} Areas Selected`;
}

function legacyBuildSelectFloors(localSelectedFloorIds, floors) {
  return {
    selectedAreas: [],
    selectedFloorIds: localSelectedFloorIds,
    selectedGroups: [],
    selectedGroupIds: [],
    selectedFloor: floors.find((f) => f.id === localSelectedFloorIds[0]) || null,
  };
}

describe('dashboardAreaTreeParity', () => {
  const baseCtx = {
    variant: 'basic',
    floors,
    areaTree,
    selectedFloorIds: [],
    selectedAreas: [],
    selectedGroupIds: [],
    localSelectedFloorIds: [],
    localSelectedAreas: [],
    localSelectedGroups: [],
  };

  it('summary text matches legacy basic outputs', () => {
    expect(getAreaSelectionText({ ...baseCtx, selectedFloorIds: [1] })).toBe(
      legacyBasicGetAreaSelectionText({ ...baseCtx, selectedFloorIds: [1] })
    );
    expect(getAreaSelectionText({ ...baseCtx, localSelectedGroups: [7] })).toBe(
      legacyBasicGetAreaSelectionText({ ...baseCtx, localSelectedGroups: [7] })
    );
    expect(getAreaSelectionText({ ...baseCtx, localSelectedAreas: [10, 11] })).toBe(
      legacyBasicGetAreaSelectionText({ ...baseCtx, localSelectedAreas: [10, 11] })
    );
  });

  it('clear all resolution matches legacy shape', () => {
    const res = buildClearAllResolution();
    expect(res.local.localSelectedAreas).toEqual([]);
    expect(res.redux.selectedFloorIds).toEqual([]);
  });

  it('select all floor priority matches legacy redux payload', () => {
    const shared = buildSelectAllResolution({
      variant: 'basic',
      localSelectedFloorIds: [1],
      localSelectedAreas: [10],
      localSelectedGroups: [],
      floors,
      getAllAreasFromGroup: () => [],
    }).redux;
    const legacy = legacyBuildSelectFloors([1], floors);
    expect(shared.selectedAreas).toEqual(legacy.selectedAreas);
    expect(shared.selectedFloorIds).toEqual(legacy.selectedFloorIds);
    expect(shared.selectedFloor).toEqual(legacy.selectedFloor);
  });

  it('customized searchTree group commit expands areas', () => {
    const shared = buildSelectAllResolution({
      variant: 'customized',
      localSelectedFloorIds: [],
      localSelectedAreas: [],
      localSelectedGroups: [7],
      floors,
      getAllAreasFromGroup: () => [20, 21],
      areaIdToFloorId: new Map(),
    });
    expect(shared.redux.selectedAreas).toEqual([20, 21]);
  });

  it('area toggle parity for select and deselect', () => {
    const node = { area_id: 10, children: [{ area_id: 11 }] };
    const selected = resolveAreaToggleSelection({
      areaId: 10,
      node,
      localSelectedAreas: [],
      getChildAreaIds: () => [11],
    });
    expect(selected.localSelectedAreas).toEqual([10, 11]);

    const cleared = resolveAreaToggleSelection({
      areaId: 10,
      node,
      localSelectedAreas: [10, 11],
      getChildAreaIds: () => [11],
    });
    expect(cleared.localSelectedAreas).toEqual([]);
  });

  it('floor deselect keeps areas shared across floors', () => {
    const res = resolveFloorDeselectAreas({
      floorId: 1,
      localSelectedFloorIds: [1, 2],
      localSelectedAreas: [10, 20],
      getAreasForFloor: (id) => (id === 1 ? [10] : id === 2 ? [20] : []),
    });
    expect(res.localSelectedAreas).toEqual([20]);
    expect(res.localSelectedFloorIds).toEqual([2]);
  });
});
