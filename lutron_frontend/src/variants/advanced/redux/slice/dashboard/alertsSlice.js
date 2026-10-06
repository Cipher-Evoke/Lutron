import { BaseUrl } from "../../../BaseUrl";
import { createAlertsModule } from "../../../../../shared/redux/slices/createAlertsModule";

const _module = createAlertsModule({ BaseUrl });

export default _module.reducer;
export const fetchAlertTypes = _module.fetchAlertTypes;
export const fetchActiveAlerts = _module.fetchActiveAlerts;
export const sendAlertsByEmail = _module.sendAlertsByEmail;
export const downloadAlerts = _module.downloadAlerts;
export const selectAlertTypes = _module.selectAlertTypes;
export const selectAlerts = _module.selectAlerts;
export const selectSelectedAlertType = _module.selectSelectedAlertType;
export const selectAlertsLoading = _module.selectAlertsLoading;
export const selectAlertsError = _module.selectAlertsError;
export const selectEmailLoading = _module.selectEmailLoading;
export const selectDownloadLoading = _module.selectDownloadLoading;
export const selectEmailError = _module.selectEmailError;
export const selectDownloadError = _module.selectDownloadError;
export const selectEmailSuccess = _module.selectEmailSuccess;
export const selectDownloadSuccess = _module.selectDownloadSuccess;
export const setSelectedAlertType = _module.setSelectedAlertType;
export const clearAlertsState = _module.clearAlertsState;
export const resetEmailState = _module.resetEmailState;
export const resetDownloadState = _module.resetDownloadState;
