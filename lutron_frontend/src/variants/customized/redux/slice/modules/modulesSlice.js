import { BaseUrl } from "../../../BaseUrl";
import { createModulesModule } from "../../../../../shared/redux/slices/createModulesModule";

const _module = createModulesModule({ BaseUrl });

export default _module.reducer;
export const fetchModules = _module.fetchModules;
export const uploadDeviceAlerts = _module.uploadDeviceAlerts;
export const clearError = _module.clearError;
export const clearUploadError = _module.clearUploadError;
export const clearUploadSuccess = _module.clearUploadSuccess;
export const resetModulesState = _module.resetModulesState;
