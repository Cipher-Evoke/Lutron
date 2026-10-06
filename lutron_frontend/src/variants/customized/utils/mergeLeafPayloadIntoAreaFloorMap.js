/**
 * Walks a floor area_tree payload and records area_id -> floor_id in `intoMap`.
 * Used so widget `area_ids` can be grouped by floor before energy bucket requests.
 */
export function mergeLeafPayloadIntoAreaFloorMap(payload, floorId, intoMap) {
  const m = intoMap instanceof Map ? intoMap : new Map(intoMap);
  const fid = Number(payload?.floor_id ?? floorId);
  if (!Number.isFinite(fid)) return m;

  const walk = (nodes) => {
    if (!Array.isArray(nodes)) return;
    for (const node of nodes) {
      if (!node) continue;
      let aid = null;
      if (node.area_id != null) {
        aid = Number(node.area_id);
      } else if (
        node.id != null &&
        (node.name != null || node.area_name != null) &&
        !node.children?.length &&
        !node.areas?.length
      ) {
        // Some area_tree payloads use `id` as the leaf area id without `area_id`
        const n = Number(node.id);
        if (Number.isFinite(n)) aid = n;
      }
      if (aid != null && Number.isFinite(aid)) {
        m.set(aid, fid);
        m.set(String(aid), fid);
      }
      if (node.children?.length) walk(node.children);
      if (node.areas?.length) walk(node.areas);
    }
  };

  walk(payload?.tree);
  walk(payload?.areas);
  return m;
}
