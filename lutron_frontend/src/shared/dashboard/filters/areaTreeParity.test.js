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
  getAllAreasFromGroup,
  checkIfChildrenSelected,
  checkIfAllChildrenSelected,
} from './index';

const BASIC_FIXTURE = {
  tree: [
    {
      name: 'Floor Root',
      children: [
        { area_id: 101, name: 'Hall', area_code: 'H' },
        {
          name: 'Zone',
          children: [{ area_id: 102, name: 'Room', area_code: 'R' }],
        },
      ],
    },
    { group_id: 7, name: 'G7', areas: [{ area_id: 201 }, { area_id: 202 }] },
  ],
};

const ADVANCED_FIXTURE = {
  areas: [
    { area_id: 301, name: 'Open', area_code: 'O' },
    { area_id: 302, name: 'Closed', area_code: 'C', children: [{ area_id: 303 }] },
  ],
};

const CUSTOMIZED_FIXTURE = {
  tree: [{ area_id: 401, name: 'C1', area_name: 'Custom One', area_code: 'C1' }],
};

function legacyFlattenBasic(treeData) {
  const areas = [];
  const processNode = (node) => {
    if (node.children && node.children.length > 0) {
      node.children.forEach(processNode);
    } else if (node.area_id) {
      areas.push({ id: node.area_id, name: node.name, area_code: node.area_code });
    }
  };
  if (treeData?.tree) treeData.tree.forEach(processNode);
  else if (treeData?.areas) treeData.areas.forEach(processNode);
  if (areas.length > 100) return areas.slice(0, 15);
  return areas;
}

function legacyFlattenCustomized(treeData) {
  const areas = [];
  const processNode = (node) => {
    if (node.children && node.children.length > 0) {
      node.children.forEach(processNode);
    } else if (node.area_id) {
      areas.push({
        id: node.area_id,
        name: node.name,
        area_name: node.area_name,
        area_code: node.area_code,
      });
    }
  };
  if (treeData?.tree) treeData.tree.forEach(processNode);
  else if (treeData?.areas) treeData.areas.forEach(processNode);
  if (areas.length > 100) return areas.slice(0, 15);
  return areas;
}

function legacyGetAllAreaIdsFromFloor(floorData) {
  const allAreaIds = [];
  const traverseNode = (node) => {
    if (node.area_id) allAreaIds.push(node.area_id);
    if (node.children) node.children.forEach(traverseNode);
    if (node.areas) node.areas.forEach(traverseNode);
  };
  const nodes = Array.isArray(floorData?.tree)
    ? floorData.tree
    : Array.isArray(floorData?.areas)
      ? floorData.areas
      : [];
  nodes.forEach(traverseNode);
  return allAreaIds;
}

function legacyGetAreasForFloor(areaTree) {
  const allAreaIds = [];
  const traverseNode = (node) => {
    if (node.area_id) allAreaIds.push(node.area_id);
    if (node.children) node.children.forEach(traverseNode);
    if (node.areas) node.areas.forEach(traverseNode);
  };
  const nodes = Array.isArray(areaTree?.tree)
    ? areaTree.tree
    : Array.isArray(areaTree?.areas)
      ? areaTree.areas
      : [];
  nodes.forEach(traverseNode);
  return allAreaIds;
}

function legacyBasicGetAllAreasFromGroup() {
  return [];
}

function legacyCustomizedGetAllAreasFromGroup(groupId, areaTree, areaGroups, resolveGroupRecordAreas) {
  const groupAreas = [];
  const findGroupInTree = (nodes) => {
    if (!Array.isArray(nodes)) return false;
    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue;
      const gid = node.group_id;
      if (gid != null && (gid === groupId || String(gid) === String(groupId))) {
        if (node.areas) {
          node.areas.forEach((area) => {
            if (area.area_id) groupAreas.push(area.area_id);
          });
        }
        return true;
      }
      if (node.children && findGroupInTree(node.children)) return true;
      if (node.areas) {
        for (const area of node.areas) {
          if (area.children && findGroupInTree(area.children)) return true;
        }
      }
    }
    return false;
  };
  if (areaTree && (areaTree.tree || areaTree.areas)) {
    findGroupInTree(areaTree.tree || areaTree.areas);
  }
  if (groupAreas.length > 0) return groupAreas;
  const lists = [
    ...(areaGroups?.special_area_groups || []),
    ...(areaGroups?.user_area_groups || []),
  ];
  const g = lists.find((x) => x && (x.group_id === groupId || String(x.group_id) === String(groupId)));
  if (g) return resolveGroupRecordAreas(g);
  return [];
}

function legacyCheckIfChildrenSelected(node, state) {
  if (!node) return false;
  if (node.children) {
    for (const child of node.children) {
      if (child.area_id && state.localSelectedAreas.includes(child.area_id)) return true;
      if (child.floor_id && state.localSelectedFloorIds.includes(child.floor_id)) return true;
      if (child.group_id && state.localSelectedGroups.includes(child.group_id)) return true;
      if (legacyCheckIfChildrenSelected(child, state)) return true;
    }
  }
  if (node.areas) {
    for (const area of node.areas) {
      if (area.area_id && state.localSelectedAreas.includes(area.area_id)) return true;
      if (legacyCheckIfChildrenSelected(area, state)) return true;
    }
  }
  return false;
}

describe('areaTreeParity', () => {
  it('basic flattenAreaTree matches legacy output', () => {
    expect(flattenAreaTree(BASIC_FIXTURE)).toEqual(legacyFlattenBasic(BASIC_FIXTURE));
  });

  it('advanced flattenAreaTree matches legacy output on areas shape', () => {
    expect(flattenAreaTree(ADVANCED_FIXTURE)).toEqual(legacyFlattenBasic(ADVANCED_FIXTURE));
  });

  it('customized flattenAreaTree matches legacy output with area_name', () => {
    expect(flattenAreaTree(CUSTOMIZED_FIXTURE, { includeAreaName: true })).toEqual(
      legacyFlattenCustomized(CUSTOMIZED_FIXTURE)
    );
  });

  it('getAllAreaIdsFromFloor matches legacy advanced traversal', () => {
    expect(getAllAreaIdsFromFloor(BASIC_FIXTURE)).toEqual(legacyGetAllAreaIdsFromFloor(BASIC_FIXTURE));
    expect(getAllAreaIdsFromFloor(ADVANCED_FIXTURE)).toEqual(
      legacyGetAllAreaIdsFromFloor(ADVANCED_FIXTURE)
    );
  });

  it('getAreasForFloor matches legacy advanced traversal', () => {
    expect(getAreasForFloor(BASIC_FIXTURE)).toEqual(legacyGetAreasForFloor(BASIC_FIXTURE));
    expect(getAreasForFloor(ADVANCED_FIXTURE)).toEqual(legacyGetAreasForFloor(ADVANCED_FIXTURE));
  });

  it('basic/advanced getAllAreasFromGroup legacy empty parity', () => {
    expect(getAllAreasFromGroup(7)).toEqual(legacyBasicGetAllAreasFromGroup());
    expect(getAllAreasFromGroup(7, { areaTree: BASIC_FIXTURE, searchTree: false })).toEqual(
      legacyBasicGetAllAreasFromGroup()
    );
  });

  it('customized getAllAreasFromGroup tree + record fallback parity', () => {
    const areaGroups = {
      special_area_groups: [{ group_id: 88, floors: [{ area_ids: [901, 902] }] }],
      user_area_groups: [],
    };
    const resolve = (g) => g.floors.flatMap((f) => f.area_ids);

    expect(
      getAllAreasFromGroup(7, { areaTree: BASIC_FIXTURE, searchTree: true })
    ).toEqual(legacyCustomizedGetAllAreasFromGroup(7, BASIC_FIXTURE, {}, resolve));

    expect(
      getAllAreasFromGroup(88, {
        areaTree: BASIC_FIXTURE,
        areaGroups,
        searchTree: true,
        resolveGroupRecordAreas: resolve,
      })
    ).toEqual(legacyCustomizedGetAllAreasFromGroup(88, BASIC_FIXTURE, areaGroups, resolve));
  });

  it('selection helpers match legacy partial and full states', () => {
    const node = BASIC_FIXTURE.tree[0];
    const partial = { localSelectedAreas: [101], localSelectedFloorIds: [], localSelectedGroups: [] };
    const full = { localSelectedAreas: [101, 102], localSelectedFloorIds: [], localSelectedGroups: [] };

    expect(checkIfChildrenSelected(node, partial)).toBe(
      legacyCheckIfChildrenSelected(node, partial)
    );
    expect(checkIfAllChildrenSelected(node, full)).toBe(
      checkIfAllChildrenSelected(node, full)
    );
  });

  it('getAllChildAreaIds nested parity with group resolver', () => {
    const wing = BASIC_FIXTURE.tree[0].children[1];
    const resolver = (gid) => (gid === 7 ? [201, 202] : []);
    const intermediate = {
      children: [{ name: 'x' }, { group_id: 7 }],
    };
    expect(getAllChildAreaIds(wing)).toEqual([102]);
    expect(getAllChildAreaIds(intermediate, resolver)).toEqual([201, 202]);
  });

  it('getDirectChildAreaIdsFromFloor parity', () => {
    expect(getDirectChildAreaIdsFromFloor(BASIC_FIXTURE)).toEqual([101, 201, 202]);
    expect(getDirectChildAreaIdsFromFloor(ADVANCED_FIXTURE)).toEqual([303]);
  });

  it('getAllAreaIds cap parity', () => {
    const node = { area_id: 1, children: Array.from({ length: 25 }, (_, i) => ({ area_id: i + 2 })) };
    const legacy = (() => {
      let areaIds = [1];
      node.children.forEach((child) => {
        areaIds = areaIds.concat(child.area_id);
      });
      if (areaIds.length > 20) return areaIds.slice(0, 15);
      return areaIds;
    })();
    expect(getAllAreaIds(node)).toEqual(legacy);
  });
});
