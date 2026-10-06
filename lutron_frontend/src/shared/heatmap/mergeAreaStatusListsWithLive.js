/**
 * Sidebar click: scene/zone lists from DB cache (live=0), active status from LEAP (live=1).
 */

function overlayLiveZoneLevelsOnCachedZones(cachedZones, liveZones) {
  if (!Array.isArray(cachedZones) || cachedZones.length === 0) {
    return Array.isArray(liveZones) ? liveZones : [];
  }
  if (!Array.isArray(liveZones) || liveZones.length === 0) {
    return cachedZones;
  }

  const liveById = new Map(liveZones.map((z) => [String(z?.id), z]));
  return cachedZones.map((cz) => {
    const live = liveById.get(String(cz?.id));
    if (!live) return cz;
    return {
      ...cz,
      ...(live.brightness != null ? { brightness: live.brightness } : {}),
      ...(live.level != null ? { level: live.level } : {}),
      ...(live.temperature != null ? { temperature: live.temperature } : {}),
      ...(live.status != null ? { status: live.status } : {}),
    };
  });
}

/**
 * @param {Record<string, unknown>|null|undefined} cached live=0 / DB cache payload
 * @param {Record<string, unknown>|null|undefined} live live=1 / LEAP payload
 */
export function mergeCachedAreaListsWithLiveStatus(cached, live) {
  if (!live || typeof live !== "object") {
    return cached || live;
  }
  if (!cached || typeof cached !== "object") {
    return live;
  }

  const merged = { ...live };

  if (Array.isArray(cached.area_scenes) && cached.area_scenes.length > 0) {
    merged.area_scenes = cached.area_scenes;
  }

  merged.zones = overlayLiveZoneLevelsOnCachedZones(cached.zones, live.zones);

  return merged;
}
