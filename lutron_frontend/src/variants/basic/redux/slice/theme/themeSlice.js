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
  includeUpdateApplicationThemeFulfilled: true,
  initialState: {
    applicationTheme: {
      application_theme: {
        background: "#ffffff",
        content: "#f5f5f5",
        button: "#232323",
      },
    },
    heatMapTheme: {
      application_theme: {
        light: "#f2ff00",
        occupancy: "#4318d1",
        energy: "#006400",
      },
    },
  },
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
