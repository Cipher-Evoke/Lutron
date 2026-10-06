/** Phase 5.3 — thin wrapper over SharedMainLayout + SharedAppShell */
import React from "react";
import * as themeSlice from "../redux/slice/theme/themeSlice";
import {
  DEFAULT_APP_BACKGROUND,
  DEFAULT_APP_CONTENT,
  isWhiteAreaPickerChrome,
} from "../utils/themeOnSurface";
import { getSettingsUsersActionSuffixFromSearch } from "../utils/settingsUsersBreadcrumbParams";
import * as homeSlice from "../redux/slice/home/homeSlice";
import TopbarComponent from "../components/TopbarComponent";
import Footer from "../components/Footer";
import HeatmapControls from "../screens/heatmap/HeatmapControls";
import HeatMap from "../screens/heatmap/HeatMap";
import ScheduleHeaderDropdown from "../components/ScheduleHeaderDropdown";
import { bindAppLayoutModule } from "../../../shared/layout/app/bindAppLayoutModule";
import SharedMainLayout from "../../../shared/layout/app/SharedMainLayout";
import { basicMainLayoutAdapter } from "../../../shared/layout/app/adapters/basicMainLayoutAdapter";

bindAppLayoutModule({
  themeSlice,
  themeUtils: {
    DEFAULT_APP_BACKGROUND,
    DEFAULT_APP_CONTENT,
    isWhiteAreaPickerChrome,
  },
  breadcrumbUtils: {
    getSettingsUsersActionSuffixFromSearch,
  },
  homeSlice,
  components: {
    TopbarComponent,
    Footer,
    HeatmapControls,
    HeatMap,
    ScheduleHeaderDropdown,
  },
});

const MainLayout = () => <SharedMainLayout adapter={basicMainLayoutAdapter} />;

export default MainLayout;
