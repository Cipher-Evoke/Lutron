/**
 * @jest-environment node
 */
import {
  resolveSelectedAreaIds,
  resolveSelectedFloorIds,
  resolveSelectedGroupIds,
  resolveAreaToggleSelection,
  resolveGroupToggleSelection,
  resolveIntermediateParentToggle,
  resolveFloorDeselectAreas,
  resolveFloorSelectAreas,
} from './areaTreeSelectionResolvers';

const node = {
  area_id: 1,
  children: [{ area_id: 2 }, { area_id: 3 }],
};

describe('areaTreeSelectionResolvers', () => {
  it('resolveSelectedFloorIds prefers local when requested', () => {
    expect(resolveSelectedFloorIds({ localSelectedFloorIds: [2], committedSelectedFloorIds: [1] })).toEqual(
      [2]
    );
  });

  it('resolveSelectedGroupIds returns committed when local empty', () => {
    expect(
      resolveSelectedGroupIds({
        localSelectedGroups: [],
        committedSelectedGroupIds: [9],
        preferLocal: true,
      })
    ).toEqual([9]);
  });

  it('resolveSelectedAreaIds merges group expansion', () => {
    expect(
      resolveSelectedAreaIds({
        localSelectedAreas: [1],
        localSelectedGroups: [7],
        getAllAreasFromGroup: () => [8],
      })
    ).toEqual([1, 8]);
  });

  it('resolveAreaToggleSelection adds and removes descendants', () => {
    const add = resolveAreaToggleSelection({
      areaId: 1,
      node,
      localSelectedAreas: [],
      getChildAreaIds: () => [2, 3],
    });
    expect(add.localSelectedAreas).toEqual([1, 2, 3]);
    expect(add.clearFloorSelection).toBe(true);

    const remove = resolveAreaToggleSelection({
      areaId: 1,
      node,
      localSelectedAreas: [1, 2, 3],
      getChildAreaIds: () => [2, 3],
    });
    expect(remove.localSelectedAreas).toEqual([]);
  });

  it('resolveGroupToggleSelection toggles group areas', () => {
    const add = resolveGroupToggleSelection({
      groupId: 5,
      localSelectedGroups: [],
      localSelectedAreas: [1],
      getAllAreasFromGroup: () => [10, 11],
    });
    expect(add.localSelectedGroups).toEqual([5]);
    expect(add.localSelectedAreas).toEqual([1, 10, 11]);
  });

  it('resolveIntermediateParentToggle selects all descendants', () => {
    const res = resolveIntermediateParentToggle({
      node: { children: [{ area_id: 4 }, { area_id: 5 }] },
      localSelectedAreas: [],
      getChildAreaIds: () => [4, 5],
    });
    expect(res.localSelectedAreas).toEqual([4, 5]);
  });

  it('resolveFloorDeselectAreas keeps shared multi-floor areas', () => {
    const res = resolveFloorDeselectAreas({
      floorId: 1,
      localSelectedFloorIds: [1, 2],
      localSelectedAreas: [10, 20],
      getAreasForFloor: (fid) => (fid === 1 ? [10] : [20]),
    });
    expect(res.localSelectedFloorIds).toEqual([2]);
    expect(res.localSelectedAreas).toEqual([20]);
  });

  it('resolveFloorSelectAreas merges unique ids', () => {
    expect(resolveFloorSelectAreas({ localSelectedAreas: [1], floorAreaIds: [2, 1] })).toEqual([
      1, 2,
    ]);
  });
});
