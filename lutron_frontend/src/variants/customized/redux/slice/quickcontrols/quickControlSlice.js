import { BaseUrl } from "../../../BaseUrl";
import { createQuickControlModule } from "../../../../../shared/redux/slices/createQuickControlModule";

const _module = createQuickControlModule({ BaseUrl });

export default _module.reducer;
export const fetchFloors = _module.fetchFloors;
export const fetchQuickControls = _module.fetchQuickControls;
export const createQuickControl = _module.createQuickControl;
export const fetchQuickControlDetails = _module.fetchQuickControlDetails;
export const updateQuickControl = _module.updateQuickControl;
export const triggerQuickControl = _module.triggerQuickControl;
export const deleteQuickControl = _module.deleteQuickControl;
export const clearSelectedControl = _module.clearSelectedControl;
export const setShouldRefresh = _module.setShouldRefresh;
