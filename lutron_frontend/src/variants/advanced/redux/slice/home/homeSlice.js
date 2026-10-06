import { BaseUrl } from "../../../BaseUrl";
import { createHomeModule } from "../../../../../shared/redux/slices/createHomeModule";

const _module = createHomeModule({ BaseUrl });

export default _module.reducer;
export const getLutronData = _module.getLutronData;
export const getLutronDataClient = _module.getLutronDataClient;
export const getLutronDataProject = _module.getLutronDataProject;
export const saveLutronData = _module.saveLutronData;
export const saveClientData = _module.saveClientData;
export const saveProjectData = _module.saveProjectData;
export const getDashboardOverview = _module.getDashboardOverview;
export const homeSlice = _module.homeSlice;
export const homeDataList = _module.homeDataList;
export const homeDataClient = _module.homeDataClient;
export const homeDataProject = _module.homeDataProject;
export const selectDashboardOverview = _module.selectDashboardOverview;
export const selectDashboardOverviewLoading = _module.selectDashboardOverviewLoading;
export const selectDashboardOverviewError = _module.selectDashboardOverviewError;
export const clearSaveError = _module.clearSaveError;
