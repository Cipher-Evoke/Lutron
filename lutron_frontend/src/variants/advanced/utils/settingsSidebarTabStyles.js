export {
  SETTINGS_SIDEBAR_TAB_BLUE,
  getSettingsSidebarNavDisplayLabel,
  getSettingsSidebarNavItemSx,
  isSettingsSidebarNavActive,
  getSettingsSidebarActiveLabel,
  settingsSidebarColumnDividerSx,
  settingsSidebarHeadingSx,
  usesThemedSettingsSidebarChrome,
  applySettingsSidebarTypographyVars,
  SETTINGS_SIDEBAR_TAB_TYPOGRAPHY_SX,
  settingsSidebarMainContentColumnStackingSx,
  settingsSidebarNavRowDividerSx,
  settingsSidebarNavItemBridgeSx,
} from '../../../shared/theme/registry/settingsSidebarTabStyles';

/** Advanced variant: sidebar label is "Widgets" (not "Rename Widget"). */
export const SETTINGS_SIDEBAR_ITEM_ORDER = [
  'Home',
  'Theme',
  'Widgets',
  'Manage Area Groups',
  'Area Size & Load',
  'Email Server',
  'Users',
  'Floor',
  'Alerts',
  'Processors',
  'Maintenance',
  'Application Monitoring',
  'FOFP',
  'Help',
  'Manage Sensors',
  'Manage Modules',
];

/** Sort `{ label, path }[]` or canonical label strings to SETTINGS_SIDEBAR_ITEM_ORDER. */
export function sortSettingsSidebarNavItems(items) {
  if (!Array.isArray(items) || items.length === 0) return items;
  const rank = new Map(SETTINGS_SIDEBAR_ITEM_ORDER.map((label, index) => [label, index]));
  return [...items].sort((a, b) => {
    const labelA = a?.label != null ? a.label : a;
    const labelB = b?.label != null ? b.label : b;
    return (rank.get(labelA) ?? 999) - (rank.get(labelB) ?? 999);
  });
}
