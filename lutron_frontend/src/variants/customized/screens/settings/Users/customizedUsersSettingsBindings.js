import React from 'react';
import * as usersSlice from '../../../redux/slice/settingsslice/user/usersSlice';
import * as createUserSlice from '../../../redux/slice/settingsslice/createUserSlice';
import * as floorSlice from '../../../redux/slice/floor/floorSlice';
import { ConfirmDialog } from '../../../utils/FeedbackUI';
import { SidebarItems, getVisibleSidebarItems } from '../../../utils/sidebarItems';
import { getVisibleSidebarItemsWithPaths, UseAuth } from '../../../customhooks/UseAuth';
import * as userlogin from '../../../redux/slice/auth/userlogin';
import * as themeSlice from '../../../redux/slice/theme/themeSlice';
import SettingsSidebar from '../../../components/SettingsSidebar';
import CustomizedSettingsPageShell from '../../../components/CustomizedSettingsPageShell';
import * as settingsUsersBreadcrumbParams from '../../../utils/settingsUsersBreadcrumbParams';
import * as settingsSidebarTabStyles from '../../../utils/settingsSidebarTabStyles';
import { bindUsersSettingsModule } from '../../../../../shared/settings/users/bindUsersSettingsModule';
import { customizedUsersDialogChrome } from '../../../utils/customizedDialogChrome';

function CustomizedSettingsSidebarNav(props) {
  return <SettingsSidebar {...props} embedded />;
}

bindUsersSettingsModule({
  usersSlice,
  createUserSlice,
  floorSlice,
  ConfirmDialog,
  SidebarItems,
  getVisibleSidebarItems,
  getVisibleSidebarItemsWithPaths,
  UseAuth,
  userlogin,
  themeSlice,
  settingsSidebarTabStyles,
  SettingsSidebarNav: CustomizedSettingsSidebarNav,
  SettingsPageShell: CustomizedSettingsPageShell,
  settingsUsersBreadcrumbParams,
  usersDialogChrome: customizedUsersDialogChrome,
  /** Customized-only: scroll the users table when the list is long. */
  usersListScrollEnabled: true,
});
