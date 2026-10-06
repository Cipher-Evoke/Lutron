/**
 * Pure AreaTree traversal helpers (Phase 6.2C.7B.1).
 * No React state, Redux, or dispatch.
 */

const DEFAULT_AREA_ID_CAP = 20;
const DEFAULT_AREA_ID_LIMIT = 15;
const DEFAULT_FLATTEN_CAP = 100;
const DEFAULT_FLATTEN_LIMIT = 15;

/**
 * @param {object|null|undefined} treeData
 * @returns {object[]}
 */
export function getTreeRoots(treeData) {
  if (!treeData) {
    return [];
  }
  if (Array.isArray(treeData.tree)) {
    return treeData.tree;
  }
  if (Array.isArray(treeData.areas)) {
    return treeData.areas;
  }
  return [];
}

/**
 * @param {object|null|undefined} treeData
 * @param {(node: object) => void} visitor
 */
export function traverseAreaNodes(treeData, visitor) {
  const roots = getTreeRoots(treeData);
  const walk = (node) => {
    if (!node || typeof node !== 'object') {
      return;
    }
    visitor(node);
    if (node.children && node.children.length > 0) {
      node.children.forEach(walk);
    }
    if (node.areas && node.areas.length > 0) {
      node.areas.forEach(walk);
    }
  };
  roots.forEach(walk);
}

/**
 * @param {object|null|undefined} treeData
 * @param {{ includeAreaName?: boolean, flattenCap?: number, flattenLimit?: number }} [options]
 */
export function flattenAreaTree(treeData, options = {}) {
  const {
    includeAreaName = false,
    flattenCap = DEFAULT_FLATTEN_CAP,
    flattenLimit = DEFAULT_FLATTEN_LIMIT,
  } = options;

  const areas = [];
  const processNode = (node) => {
    if (node.children && node.children.length > 0) {
      node.children.forEach(processNode);
    } else if (node.area_id) {
      const entry = {
        id: node.area_id,
        name: node.name,
        area_code: node.area_code,
      };
      if (includeAreaName) {
        entry.area_name = node.area_name;
      }
      areas.push(entry);
    }
  };

  const roots = getTreeRoots(treeData);
  roots.forEach(processNode);

  if (areas.length > flattenCap) {
    return areas.slice(0, flattenLimit);
  }

  return areas;
}

/**
 * @param {object} node
 * @param {{ areaIdCap?: number, areaIdLimit?: number }} [options]
 */
export function getAllAreaIds(node, options = {}) {
  const { areaIdCap = DEFAULT_AREA_ID_CAP, areaIdLimit = DEFAULT_AREA_ID_LIMIT } = options;
  let areaIds = [];

  if (node.area_id) {
    areaIds.push(node.area_id);
  }

  if (node.children && node.children.length > 0) {
    node.children.forEach((child) => {
      areaIds = areaIds.concat(getAllAreaIds(child, options));
    });
  }

  if (areaIds.length > areaIdCap) {
    return areaIds.slice(0, areaIdLimit);
  }

  return areaIds;
}

/**
 * @param {object} node
 * @param {(groupId: number|string) => number[]} [resolveGroupAreas]
 */
export function getAllChildAreaIds(node, resolveGroupAreas) {
  let childIds = [];

  if (node.children && node.children.length > 0) {
    node.children.forEach((child) => {
      if (child.area_id) {
        childIds.push(child.area_id);
      }
      const grandChildIds = getAllChildAreaIds(child, resolveGroupAreas);
      childIds = [...childIds, ...grandChildIds];
    });
  }

  if (node.areas && node.areas.length > 0) {
    node.areas.forEach((area) => {
      if (area.area_id) {
        childIds.push(area.area_id);
      }
      const grandChildIds = getAllChildAreaIds(area, resolveGroupAreas);
      childIds = [...childIds, ...grandChildIds];
    });
  }

  if (
    !node.area_id &&
    !node.floor_id &&
    !node.group_id &&
    node.children &&
    node.children.length > 0 &&
    typeof resolveGroupAreas === 'function'
  ) {
    const lastChild = node.children[node.children.length - 1];
    if (lastChild && lastChild.group_id) {
      const groupAreas = resolveGroupAreas(lastChild.group_id);
      childIds = [...childIds, ...groupAreas];
    }
  }

  return childIds;
}

/**
 * @param {object|null|undefined} floorData
 */
export function getAllAreaIdsFromFloor(floorData) {
  const allAreaIds = [];

  const traverseNode = (node) => {
    if (node.area_id) {
      allAreaIds.push(node.area_id);
    }

    if (node.children && node.children.length > 0) {
      node.children.forEach(traverseNode);
    }

    if (node.areas && node.areas.length > 0) {
      node.areas.forEach(traverseNode);
    }
  };

  const nodes = Array.isArray(floorData?.tree)
    ? floorData.tree
    : Array.isArray(floorData?.areas)
      ? floorData.areas
      : [];

  nodes.forEach(traverseNode);

  return allAreaIds;
}

/**
 * Legacy dashboards pass floorId but only read the current areaTree payload.
 * @param {object|null|undefined} areaTree
 */
export function getAreasForFloor(areaTree) {
  const allAreaIds = [];

  const traverseNode = (node) => {
    if (node.area_id) {
      allAreaIds.push(node.area_id);
    }

    if (node.children && node.children.length > 0) {
      node.children.forEach(traverseNode);
    }

    if (node.areas && node.areas.length > 0) {
      node.areas.forEach(traverseNode);
    }
  };

  getTreeRoots(areaTree).forEach(traverseNode);

  return allAreaIds;
}

/**
 * @param {object|null|undefined} floorData
 */
export function getDirectChildAreaIdsFromFloor(floorData) {
  const directChildAreaIds = [];

  const traverseDirectChildren = (node) => {
    if (node.children && node.children.length > 0) {
      node.children.forEach((child) => {
        if (child.area_id) {
          directChildAreaIds.push(child.area_id);
        }
      });
    }

    if (node.areas && node.areas.length > 0) {
      node.areas.forEach((area) => {
        if (area.area_id) {
          directChildAreaIds.push(area.area_id);
        }
      });
    }
  };

  if (floorData?.tree) {
    floorData.tree.forEach(traverseDirectChildren);
  } else if (floorData?.areas) {
    floorData.areas.forEach(traverseDirectChildren);
  }

  return directChildAreaIds;
}

/**
 * @param {object[]} nodes
 * @param {number|string} groupId
 * @param {number[]} [collector]
 * @returns {boolean}
 */
export function findGroupInTree(nodes, groupId, collector = []) {
  if (!Array.isArray(nodes)) {
    return false;
  }

  for (const node of nodes) {
    if (!node || typeof node !== 'object') {
      continue;
    }

    const gid = node.group_id;
    if (gid != null && (gid === groupId || String(gid) === String(groupId))) {
      if (node.areas && node.areas.length > 0) {
        node.areas.forEach((area) => {
          if (area.area_id) {
            collector.push(area.area_id);
          }
        });
      }
      return true;
    }

    if (node.children && findGroupInTree(node.children, groupId, collector)) {
      return true;
    }

    if (node.areas && node.areas.length > 0) {
      for (const area of node.areas) {
        if (area.children && findGroupInTree(area.children, groupId, collector)) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * @param {number|string} groupId
 * @param {{
 *   areaTree?: object|null,
 *   areaGroups?: object|null,
 *   resolveGroupRecordAreas?: (group: object) => number[],
 *   searchTree?: boolean,
 * }} [context]
 */
export function getAllAreasFromGroup(groupId, context = {}) {
  const {
    areaTree = null,
    areaGroups = null,
    resolveGroupRecordAreas = null,
    searchTree = false,
  } = context;

  const groupAreas = [];

  if (searchTree && areaTree && (areaTree.tree || areaTree.areas)) {
    const roots = areaTree.tree || areaTree.areas;
    findGroupInTree(roots, groupId, groupAreas);
    if (groupAreas.length > 0) {
      return groupAreas;
    }
  }

  if (!searchTree) {
    return groupAreas;
  }

  const lists = [
    ...(areaGroups?.special_area_groups || []),
    ...(areaGroups?.user_area_groups || []),
  ];

  const match = lists.find(
    (entry) =>
      entry &&
      (entry.group_id === groupId ||
        entry.group_id === Number(groupId) ||
        String(entry.group_id) === String(groupId) ||
        entry.id === groupId ||
        entry.id === Number(groupId) ||
        String(entry.id) === String(groupId))
  );

  if (match && typeof resolveGroupRecordAreas === 'function') {
    return resolveGroupRecordAreas(match);
  }

  return [];
}

/**
 * @param {number[]} currentAreas
 * @param {object} node
 * @param {(node: object) => number[]} getChildAreaIds
 */
export function addDescendantAreaIds(currentAreas, node, getChildAreaIds) {
  const next = [...currentAreas];
  const childIds = getChildAreaIds(node);
  childIds.forEach((childId) => {
    if (!next.includes(childId)) {
      next.push(childId);
    }
  });
  return next;
}

/**
 * @param {number[]} currentAreas
 * @param {object} node
 * @param {(node: object) => number[]} getChildAreaIds
 */
export function removeDescendantAreaIds(currentAreas, node, getChildAreaIds) {
  const childIds = getChildAreaIds(node);
  return currentAreas.filter((id) => !childIds.includes(id));
}

/**
 * @param {number[]} currentAreas
 * @param {number[]} additions
 */
export function mergeAreaSelections(currentAreas, additions) {
  const next = [...currentAreas];
  additions.forEach((areaId) => {
    if (!next.includes(areaId)) {
      next.push(areaId);
    }
  });
  return next;
}
