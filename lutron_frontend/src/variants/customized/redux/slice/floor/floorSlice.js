import { BaseUrl } from "../../../BaseUrl";
import { fetchAreaOccupancyStatus, fetchAreaEnergyConsumption } from "../settingsslice/heatmap/HeatmapSlice";
import { createFloorModule } from "../../../../../shared/redux/slices/createFloorModule";

const _module = createFloorModule({
  BaseUrl,
  fetchAreaOccupancyStatus,
  fetchAreaEnergyConsumption,
  includeFloorIdInFetchDetails: true,
});

export default _module.reducer;
export const fetchFloors = _module.fetchFloors;
export const setFloorSortMode = _module.setFloorSortMode;
export const reorderFloors = _module.reorderFloors;
export const createAreaGroup = _module.createAreaGroup;
export const updateFloor = _module.updateFloor;
export const deleteFloor = _module.deleteFloor;
export const fetchLightStatus = _module.fetchLightStatus;
export const fetchOccupancyStatus = _module.fetchOccupancyStatus;
export const fetchEnergyStatus = _module.fetchEnergyStatus;
export const fetchSingleFloor = _module.fetchSingleFloor;
export const getLeafByFloorID = _module.getLeafByFloorID;
export const updateAreaFloorAndProcessor = _module.updateAreaFloorAndProcessor;
export const createFloorWithAreas = _module.createFloorWithAreas;
export const correctCoordinates = _module.correctCoordinates;
export const calculateAreaWithReferenceLength = _module.calculateAreaWithReferenceLength;
export const fetchExistingCalculatedAreas = _module.fetchExistingCalculatedAreas;
export const selectFloors = _module.selectFloors;
export const selectManualSortEnabled = _module.selectManualSortEnabled;
export const uniqueFloor = _module.uniqueFloor;
export const selectFloorLoading = _module.selectFloorLoading;
export const fetchLeafDataByID = _module.fetchLeafDataByID;
export const addSelectedProcessor = _module.addSelectedProcessor;
export const removeSelectedProcessor = _module.removeSelectedProcessor;
export const clearSelectedProcessors = _module.clearSelectedProcessors;
export const clearProcessorAreaIds = _module.clearProcessorAreaIds;
export const setProcessorAreaIds = _module.setProcessorAreaIds;
