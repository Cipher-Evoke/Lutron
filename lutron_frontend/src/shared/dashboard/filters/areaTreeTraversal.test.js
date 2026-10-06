/**
 * @jest-environment node
 */
import {
  flattenAreaTree,
  getAllAreaIds,
  getAllChildAreaIds,
  getAllAreaIdsFromFloor,
  getAreasForFloor,
  getDirectChildAreaIdsFromFloor,
  findGroupInTree,
  getAllAreasFromGroup,
  traverseAreaNodes,
  getTreeRoots,
  addDescendantAreaIds,
  removeDescendantAreaIds,
  mergeAreaSelections,
} from './areaTreeTraversal';

const nestedFloorTree = {
  tree: [
    {
      name: 'Building',
      children: [
        { area_id: 1, name: 'Lobby', area_code: 'L1' },
        {
          name: 'Wing',
          children: [
            { area_id: 2, name: 'Office A', area_code: 'A1' },
            { area_id: 3, name: 'Office B', area_code: 'B1' },
          ],
        },
      ],
    },
    {
      group_id: 10,
      name: 'Group Node',
      areas: [{ area_id: 4, name: 'Group Area' }, { area_id: 5, name: 'Group Area 2' }],
    },
  ],
};

const areasShapeTree = {
  areas: [{ area_id: 11, name: 'Root Area', children: [{ area_id: 12, name: 'Child Area' }] }],
};

describe('areaTreeTraversal', () => {
  it('getTreeRoots prefers tree array then areas array', () => {
    expect(getTreeRoots(nestedFloorTree)).toHaveLength(2);
    expect(getTreeRoots(areasShapeTree)).toHaveLength(1);
    expect(getTreeRoots(null)).toEqual([]);
  });

  it('traverseAreaNodes visits nested descendants', () => {
    const ids = [];
    traverseAreaNodes(nestedFloorTree, (node) => {
      if (node.area_id) ids.push(node.area_id);
    });
    expect(ids).toEqual([1, 2, 3, 4, 5]);
  });

  it('getAllAreaIdsFromFloor collects all area ids', () => {
    expect(getAllAreaIdsFromFloor(nestedFloorTree)).toEqual([1, 2, 3, 4, 5]);
    expect(getAllAreaIdsFromFloor(areasShapeTree)).toEqual([11, 12]);
  });

  it('getAreasForFloor mirrors floor payload traversal', () => {
    expect(getAreasForFloor(nestedFloorTree)).toEqual([1, 2, 3, 4, 5]);
  });

  it('getDirectChildAreaIdsFromFloor returns only direct children with area_id', () => {
    expect(getDirectChildAreaIdsFromFloor(nestedFloorTree)).toEqual([1, 4, 5]);
    expect(getDirectChildAreaIdsFromFloor(areasShapeTree)).toEqual([12]);
  });

  it('getAllChildAreaIds walks descendants without including parent', () => {
    const wing = nestedFloorTree.tree[0].children[1];
    expect(getAllChildAreaIds(wing)).toEqual([2, 3]);
  });

  it('getAllChildAreaIds resolves intermediate parent group via callback', () => {
    const intermediate = {
      name: 'Parent',
      children: [{ name: 'marker' }, { group_id: 10, name: 'group ref' }],
    };
    const ids = getAllChildAreaIds(intermediate, (gid) => (gid === 10 ? [4, 5] : []));
    expect(ids).toEqual([4, 5]);
  });

  it('findGroupInTree collects group area ids', () => {
    const collector = [];
    findGroupInTree(nestedFloorTree.tree, 10, collector);
    expect(collector).toEqual([4, 5]);
  });

  it('getAllAreasFromGroup with searchTree reads tree groups', () => {
    expect(
      getAllAreasFromGroup(10, { areaTree: nestedFloorTree, searchTree: true })
    ).toEqual([4, 5]);
  });

  it('getAllAreasFromGroup without searchTree preserves basic/advanced legacy empty result', () => {
    expect(getAllAreasFromGroup(10)).toEqual([]);
    expect(getAllAreasFromGroup(10, { areaTree: nestedFloorTree, searchTree: false })).toEqual([]);
  });

  it('getAllAreasFromGroup falls back to areaGroups record resolver', () => {
    const areaGroups = {
      special_area_groups: [{ group_id: 99, floors: [{ area_ids: [70, 71] }] }],
      user_area_groups: [],
    };
    expect(
      getAllAreasFromGroup(99, {
        areaTree: null,
        areaGroups,
        searchTree: true,
        resolveGroupRecordAreas: (g) => g.floors.flatMap((f) => f.area_ids),
      })
    ).toEqual([70, 71]);
  });

  it('flattenAreaTree returns leaf areas and applies 100 to 15 cap', () => {
    const manyLeaves = {
      tree: Array.from({ length: 120 }, (_, i) => ({
        area_id: i + 1,
        name: `Area ${i + 1}`,
        area_code: `C${i + 1}`,
      })),
    };
    const capped = flattenAreaTree(manyLeaves);
    expect(capped).toHaveLength(15);
    expect(capped[0]).toEqual({ id: 1, name: 'Area 1', area_code: 'C1' });
  });

  it('flattenAreaTree includeAreaName adds area_name field', () => {
    const payload = {
      tree: [{ area_id: 8, name: 'Named', area_name: 'Display', area_code: 'N8' }],
    };
    expect(flattenAreaTree(payload, { includeAreaName: true })[0].area_name).toBe('Display');
  });

  it('getAllAreaIds applies 20 to 15 cap on large descendant sets', () => {
    const wide = {
      area_id: 1,
      children: Array.from({ length: 25 }, (_, i) => ({ area_id: i + 2 })),
    };
    expect(getAllAreaIds(wide)).toHaveLength(15);
  });

  it('mergeAreaSelections addDescendantAreaIds removeDescendantAreaIds are pure', () => {
    const node = nestedFloorTree.tree[0].children[1];
    const merged = mergeAreaSelections([1], [2, 3, 2]);
    expect(merged).toEqual([1, 2, 3]);

    const added = addDescendantAreaIds([1], node, getAllChildAreaIds);
    expect(added).toEqual([1, 2, 3]);

    const removed = removeDescendantAreaIds([1, 2, 3, 9], node, getAllChildAreaIds);
    expect(removed).toEqual([1, 9]);
  });
});
