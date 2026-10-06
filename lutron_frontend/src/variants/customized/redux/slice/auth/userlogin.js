import { BaseUrl } from "../../../BaseUrl";
import { clearDashboardData } from "../dashboard/dashboardSlice";
import { clearUserData as clearHeatmapUserData } from "../settingsslice/heatmap/HeatmapSlice";
import { clearAlertsState } from "../dashboard/alertsSlice";
import { createUserLoginModule } from "../../../../../shared/redux/slices/createUserLoginModule";

const _module = createUserLoginModule({
  BaseUrl,
  clearDashboardData,
  clearHeatmapUserData,
  clearAlertsState,
});

export default _module.reducer;
export const getToken = _module.getToken;
export const validateToken = _module.validateToken;
export const getValidToken = _module.getValidToken;
export const getAuthHeaders = _module.getAuthHeaders;
export const signIn = _module.signIn;
export const fetchProfile = _module.fetchProfile;
export const logout = _module.logout;
export const changePassword = _module.changePassword;
export const selectSigninData = _module.selectSigninData;
export const selectLoading = _module.selectLoading;
export const selectError = _module.selectError;
export const selectProfile = _module.selectProfile;
export const selectProfileLoading = _module.selectProfileLoading;
export const selectProfileError = _module.selectProfileError;
export const selectLogoutLoading = _module.selectLogoutLoading;
export const selectLogoutError = _module.selectLogoutError;
export const selectChangePasswordLoading = _module.selectChangePasswordLoading;
export const selectChangePasswordError = _module.selectChangePasswordError;
export const selectChangePasswordSuccess = _module.selectChangePasswordSuccess;
export const resetChangePasswordState = _module.resetChangePasswordState;
