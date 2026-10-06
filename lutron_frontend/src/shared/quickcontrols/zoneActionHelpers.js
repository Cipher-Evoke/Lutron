export const ALL_ZONES_VALUE = '__ALL_ZONES__';

export function buildAllZonesProxy(zones = []) {
  const nonShade = (zones || []).filter(
    (z) => String(z?.type || z?.zone_type || '').toLowerCase() !== 'shade'
  );
  return {
    id: ALL_ZONES_VALUE,
    zone_id: ALL_ZONES_VALUE,
    name: 'All Zones',
    type: resolveAllZonesControlProfile(nonShade),
  };
}

export function resolveAllZonesControlProfile(zones = []) {
  const types = new Set(
    (zones || []).map((z) => String(z?.type || z?.zone_type || '').toLowerCase()).filter(Boolean)
  );
  if (types.has('whitetune')) return 'whitetune';
  if (types.has('dimmed')) return 'dimmed';
  if (types.has('switched')) return 'switched';
  return 'switched';
}

function toPercent(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const text = String(value);
  return text.includes('%') ? text : `${text}%`;
}

function toKelvin(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const text = String(value);
  return text.includes('K') ? text : `${text}K`;
}

/**
 * Convert one Action.jsx payload into API action object(s).
 * Does not expand All Zones — use expandQuickControlActionData for that.
 */
export function buildZoneStatusFromAction(actionData) {
  if (!actionData || actionData.type !== 'zone' || !actionData.zone) return null;

  if (
    actionData.zone.type === 'switched' &&
    (!actionData.zone.id || actionData.zone.id === null) &&
    actionData.values?.on_off &&
    actionData.values.brightness === undefined &&
    actionData.values.cct === undefined
  ) {
    return {
      type: 'area_status',
      area_status: actionData.values.on_off,
    };
  }

  const action = {
    type: 'zone_status',
    zone_id: Number(actionData.zone.id || actionData.zone.zone_id),
    zone_type: actionData.zone.type,
    zone_name: actionData.zone.name,
    zone_status: actionData.values?.on_off || 'Off',
  };

  if (actionData.values?.brightness !== undefined && actionData.values?.brightness !== null) {
    action.zone_brightness = toPercent(actionData.values.brightness);
  }
  if (actionData.values?.cct !== undefined && actionData.values?.cct !== null) {
    action.zone_temperature = toKelvin(actionData.values.cct);
  }
  if (actionData.zone.type === 'dimmed' || actionData.zone.type === 'whitetune') {
    action.fade_time = actionData.values?.fadeTime || '02';
    action.delay_time = actionData.values?.delayTime || '00';
  }
  return action;
}

function convertUiActionToApiActions(actionData) {
  if (!actionData?.type) return [];

  if (actionData.type === 'scene' && actionData.scene) {
    return [
      {
        type: 'set_scene',
        scene_code: Number(actionData.scene.id),
        scene_name: actionData.scene.name,
      },
    ];
  }

  if (actionData.type === 'zone' && actionData.zone) {
    const zoneId = actionData.zone.id ?? actionData.zone.zone_id;
    const isAllZones =
      actionData.applyToAllZones === true ||
      String(zoneId) === ALL_ZONES_VALUE;

    if (isAllZones && Array.isArray(actionData.zones) && actionData.zones.length > 0) {
      return actionData.zones
        .filter((z) => String(z?.type || z?.zone_type || '').toLowerCase() !== 'shade')
        .map((z) =>
          buildZoneStatusFromAction({
            ...actionData,
            applyToAllZones: false,
            zone: {
              id: z.id ?? z.zone_id,
              name: z.name || z.zone_name,
              type: z.type || z.zone_type,
            },
          })
        )
        .filter(Boolean);
    }

    const one = buildZoneStatusFromAction(actionData);
    return one ? [one] : [];
  }

  if (actionData.type === 'occupancy' && actionData.action) {
    return [{ type: 'occupancy', occupancy_setting: actionData.action }];
  }

  if (actionData.type === 'shade' && actionData.shade) {
    return [
      {
        type: 'shade_group_status',
        shade_group_id: Number(actionData.shade.id || actionData.shade.zone_id),
        shade_group_name: actionData.shade.name,
        shade_level: toPercent(actionData.value) || '0%',
      },
    ];
  }

  // Already API-shaped
  if (
    ['set_scene', 'area_status', 'zone_status', 'occupancy', 'shade_group_status'].includes(
      actionData.type
    )
  ) {
    return [actionData];
  }

  return [];
}

/**
 * Expand Action.jsx payload (or API action) into API action array.
 * All Zones → one zone_status per non-shade zone.
 */
export function expandQuickControlActionData(actionData) {
  return convertUiActionToApiActions(actionData);
}

function actionMatchKey(action) {
  if (!action) return '';
  if (action.type === 'zone_status') {
    return `zone_status:${action.zone_id ?? ''}`;
  }
  return String(action.type || '');
}

/**
 * Merge expanded API actions into a location's actions list.
 * - editAllMode → replace all
 * - editingActionIdx → replace that row, upsert the rest
 * - else upsert (zone_status by zone_id; other types exclusive by type)
 */
export function mergeExpandedActionsIntoLocation(
  existing,
  expanded,
  { editingActionIdx = null, editAllMode = false, withSource = null } = {}
) {
  const incoming = (expanded || []).map((action) =>
    typeof withSource === 'function' ? withSource(action) : action
  );

  if (editAllMode) {
    return incoming;
  }

  const current = Array.isArray(existing) ? [...existing] : [];

  if (editingActionIdx != null && editingActionIdx >= 0 && editingActionIdx < current.length) {
    if (incoming.length === 0) return current;
    const [first, ...rest] = incoming;
    current[editingActionIdx] = first;
    for (const action of rest) {
      const key = actionMatchKey(action);
      const idx = current.findIndex((a) => actionMatchKey(a) === key);
      if (idx >= 0) current[idx] = action;
      else current.push(action);
    }
    return current;
  }

  let next = [...current];
  for (const action of incoming) {
    const key = actionMatchKey(action);
    if (action.type === 'zone_status') {
      const idx = next.findIndex((a) => actionMatchKey(a) === key);
      if (idx >= 0) next[idx] = action;
      else next.push(action);
    } else {
      next = next.filter((a) => a.type !== action.type);
      next.push(action);
    }
  }
  return next;
}

export function locationHasSceneAction(actions = []) {
  return (actions || []).some((a) => a?.type === 'set_scene');
}

/** True when location has a real Zone action (zone_status). Not area_status / common Light Status. */
export function locationHasZoneAction(actions = []) {
  return (actions || []).some((a) => a?.type === 'zone_status');
}

/** Prefill Light Status (common action) dialog from an area_status action. */
export function lightStatusSettingsFromAreaAction(action) {
  return {
    switched: { on_off: action?.area_status || 'Off' },
  };
}

export function convertApiActionToUiAction(action) {
  if (!action) return null;
  if (action.type === 'set_scene') {
    return {
      type: 'scene',
      scene: {
        id: action.scene_code || action.scene_id,
        name: action.scene_name,
      },
    };
  }
  if (action.type === 'area_status') {
    return {
      type: 'zone',
      zone: { id: null, name: 'Area', type: 'switched' },
      values: { on_off: action.area_status || 'Off' },
    };
  }
  if (action.type === 'zone_status') {
    return {
      type: 'zone',
      zone: {
        id: action.zone_id,
        name: action.zone_name,
        type: action.zone_type,
      },
      values: {
        on_off: action.zone_status || 'On',
        brightness: action.zone_brightness
          ? parseInt(String(action.zone_brightness).replace('%', ''), 10)
          : undefined,
        cct: action.zone_temperature
          ? parseInt(String(action.zone_temperature).replace('K', ''), 10)
          : undefined,
        fadeTime: action.fade_time || '02',
        delayTime: action.delay_time || '00',
      },
    };
  }
  if (action.type === 'occupancy') {
    return { type: 'occupancy', action: action.occupancy_setting };
  }
  if (action.type === 'shade_group_status') {
    return {
      type: 'shade',
      shade: {
        id: action.shade_group_id,
        name: action.shade_group_name,
      },
      value: parseInt(String(action.shade_level || '0').replace('%', ''), 10),
    };
  }
  return null;
}
