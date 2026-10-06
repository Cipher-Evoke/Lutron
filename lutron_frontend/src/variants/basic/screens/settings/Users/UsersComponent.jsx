/** Phase 5.2 */
import * as usersSlice from '../../../redux/slice/settingsslice/user/usersSlice';
import * as createUserSlice from '../../../redux/slice/settingsslice/createUserSlice';
import * as floorSlice from '../../../redux/slice/floor/floorSlice';
import { ConfirmDialog } from '../../../utils/FeedbackUI';
import { SidebarItems, getVisibleSidebarItems } from '../../../utils/sidebarItems';
import { getVisibleSidebarItemsWithPaths, UseAuth } from '../../../customhooks/UseAuth';
import * as userlogin from '../../../redux/slice/auth/userlogin';
import * as themeSlice from '../../../redux/slice/theme/themeSlice';
import SettingsSidebarNav from '../../../components/SettingsSidebarNav';
import * as settingsUsersBreadcrumbParams from '../../../utils/settingsUsersBreadcrumbParams';
import * as settingsSidebarTabStyles from '../../../utils/settingsSidebarTabStyles';
import { bindUsersSettingsModule } from '../../../../../shared/settings/users/bindUsersSettingsModule';

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
  SettingsSidebarNav,
  settingsUsersBreadcrumbParams,
});

export { default } from "../../../../../shared/settings/users/UsersComponent";
