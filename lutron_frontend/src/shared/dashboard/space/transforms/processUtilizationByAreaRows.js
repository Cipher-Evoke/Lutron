/**
 * Normalize space utilization-by-area API payload into sorted row list.
 * Extracted from variant SpaceUtilization.jsx processAreaData() implementations.
 */

function resolveUtilizedAreaArray(payload) {
  if (!payload || payload.status === 'error') {
    return null;
  }

  if (Array.isArray(payload.utilized_area)) {
    return payload.utilized_area;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  return null;
}

function filterBySelectedAreaGroups(areas, selectedGroupIds, areaGroups) {
  if (!Array.isArray(selectedGroupIds) || selectedGroupIds.length === 0 || !areaGroups) {
    return areas;
  }

  const allGroups = [
    ...(areaGroups.user_area_groups || []),
    ...(areaGroups.special_area_groups || []),
  ];
  const validAreaNames = new Set();
  let anyGroupProcessed = false;

  for (const gid of selectedGroupIds) {
    const gr = allGroups.find((g) => g && String(g.group_id || g.id) === String(gid));
    if (gr) {
      anyGroupProcessed = true;
      const groupAreas = Array.isArray(gr.areas) ? gr.areas : [];
      for (const a of groupAreas) {
        if (a && a.name) {
          validAreaNames.add(String(a.name).toLowerCase().trim());
        }
      }
    }
  }

  if (!anyGroupProcessed) {
    return areas;
  }

  return areas.filter((area) => {
    const normName = String(area.name ?? '').toLowerCase().trim();
    return validAreaNames.has(normName);
  });
}

/**
 * @param {object|null|undefined} activeSpaceUtilizationPerArea
 * @param {object} [options]
 * @param {boolean} [options.strictOccupiedType=true] — basic/advanced require numeric `occupied`
 * @param {number[]} [options.selectedGroupIds]
 * @param {object} [options.areaGroups]
 * @returns {{ name: string, percentage: number }[]}
 */
export function processUtilizationByAreaRows(activeSpaceUtilizationPerArea, options = {}) {
  const {
    strictOccupiedType = true,
    selectedGroupIds,
    areaGroups,
  } = options;

  try {
    const utilizedArea = resolveUtilizedAreaArray(activeSpaceUtilizationPerArea);
    if (!utilizedArea) {
      return [];
    }

    let filteredAreas = utilizedArea.filter((area) => {
      if (!area || typeof area !== 'object' || !area.name) {
        return false;
      }
      if (strictOccupiedType) {
        return typeof area.occupied === 'number';
      }
      return true;
    });

    filteredAreas = filterBySelectedAreaGroups(filteredAreas, selectedGroupIds, areaGroups);

    return filteredAreas
      .map((area) => ({
        name: area.name || 'Unknown Area',
        percentage: Math.min(
          strictOccupiedType
            ? area.occupied || 0
            : Number(area.occupied || area.percentage) || 0,
          100
        ),
      }))
      .sort((a, b) => b.percentage - a.percentage);
  } catch {
    return [];
  }
}
