import { BaseUrl } from "../../../BaseUrl";
import { getToken } from "../auth/userlogin";
import { createThemeModule } from "../../../../../shared/theme/redux/createThemeModule";

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
