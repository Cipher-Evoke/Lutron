export function getQuickControlActionShortLabel(action) {
  if (!action || typeof action !== 'object') return 'Action';

  switch (action.type) {
    case 'set_scene':
      return action.scene_name ? `Scene: ${action.scene_name}` : 'Scene';
    case 'area_status':
      return `Area ${action.area_status || 'Status'}`;
    case 'zone_status': {
      const name = action.zone_name || 'Zone';
      const status = action.zone_status || '';
      const brightness = action.zone_brightness ? ` ${action.zone_brightness}` : '';
      return `${name}${status ? `: ${status}` : ''}${brightness}`.trim();
    }
    case 'occupancy':
      return `Occupancy: ${action.occupancy_setting || ''}`.trim();
    case 'shade_group_status':
      return action.shade_group_name
        ? `Shade: ${action.shade_group_name}`
        : 'Shade';
    default:
      return action.type || 'Action';
  }
}
