import { BaseUrl } from "../../../BaseUrl";
import { createSensorsModule } from "../../../../../shared/redux/slices/createSensorsModule";

const _module = createSensorsModule({ BaseUrl });

export default _module.reducer;
export const fetchSensors = _module.fetchSensors;
export const discoverSensors = _module.discoverSensors;
export const clearError = _module.clearError;
export const clearDiscoverError = _module.clearDiscoverError;
export const clearDiscoverSuccess = _module.clearDiscoverSuccess;
export const resetSensorsState = _module.resetSensorsState;
