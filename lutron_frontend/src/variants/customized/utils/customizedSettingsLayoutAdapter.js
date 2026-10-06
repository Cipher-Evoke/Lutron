import {
  settingsSidebarGridItemSx,
  settingsTitleTypographySx,
} from './settingsPageLayout';

/** Customized settings chrome — Settings title in sidebar column (Area Size & Load reference). */
export const customizedSettingsLayoutAdapter = {
  variant: 'customized',
  showContentHeader: false,
  headingInSidebar: true,
  getRootGridSx: () => ({ ml: '18px', alignItems: 'flex-start' }),
  getHeadingSx: () => ({
    ...settingsTitleTypographySx,
    color: '#fff',
  }),
  getSidebarGridSx: () => ({
    ...settingsSidebarGridItemSx,
    md: 3,
    contentMd: 9,
    p: 2,
  }),
  getSidebarClassName: () => 'settings-sidebar-column',
  getContentInnerClassName: () =>
    'settings-main-inner-panel settings-help-content-column',
  getContentOuterSx: (ctx) => ({
    backgroundColor: ctx.isDefaultWhiteTheme ? '#ffffff' : ctx.contentColor,
    p: 3,
    borderTopRightRadius: '10px',
    borderBottomRightRadius: '10px',
  }),
  getContentInnerSx: () => ({
    width: '100%',
    minWidth: 0,
    maxWidth: '100%',
    maxHeight: { xs: 'none', md: 'calc(100vh - 200px)' },
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    overflowY: { xs: 'visible', md: 'auto' },
    overflowX: 'hidden',
  }),
};

export default customizedSettingsLayoutAdapter;
