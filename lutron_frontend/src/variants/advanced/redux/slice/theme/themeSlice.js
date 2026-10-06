import { BaseUrl } from "../../../BaseUrl";
import { getToken } from "../auth/userlogin";
import { createThemeModule } from "../../../../../shared/theme/redux/createThemeModule";
import { getAdvancedApplicationThemeInitialState } from "../../../utils/advancedApplicationThemePersist";

export {
  selectThemeSettings,
  selectApplicationTheme,
  selectHeatMapTheme,
  selectBackgroundImage,
  selectThemeLoading,
  selectThemeError,
} from "../../../../../shared/theme/selectors/themeSelectors";

const {
  reducer,
  fetchThemeSettings,
  fetchApplicationTheme,
  updateApplicationTheme,
  fetchHeatMapTheme,
  updateHeatMapTheme,
  fetchBackgroundImage,
  updateBackgroundImage,
  clearBackgroundImage,
} = createThemeModule({
  BaseUrl,
  getToken,
  // Pin first paint so /theme/ settings cannot flash the wrong chrome on refresh.
  initialState: getAdvancedApplicationThemeInitialState(),
  includeUpdateApplicationThemeFulfilled: true,
});

export {
  fetchThemeSettings,
  fetchApplicationTheme,
  updateApplicationTheme,
  fetchHeatMapTheme,
  updateHeatMapTheme,
  fetchBackgroundImage,
  updateBackgroundImage,
  clearBackgroundImage,
};

export default reducer;
