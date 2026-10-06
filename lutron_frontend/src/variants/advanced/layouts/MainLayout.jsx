/** Phase 5.3 — thin wrapper over SharedMainLayout + SharedAppShell */
import React from "react";
import * as themeSlice from "../redux/slice/theme/themeSlice";
import { buildAppPageBackground } from "../utils/themePageBackground";
import * as homeSlice from "../redux/slice/home/homeSlice";
import TopbarComponent from "../components/TopbarComponent";
import Footer from "../components/Footer";
import HeatmapControls from "../screens/heatmap/HeatmapControls";
import HeatMap from "../screens/heatmap/HeatMap";
import { bindAppLayoutModule } from "../../../shared/layout/app/bindAppLayoutModule";
import SharedMainLayout from "../../../shared/layout/app/SharedMainLayout";
import { advancedMainLayoutAdapter } from "../../../shared/layout/app/adapters/advancedMainLayoutAdapter";

bindAppLayoutModule({
  themeSlice,
  themeUtils: { buildAppPageBackground },
  breadcrumbUtils: {},
  homeSlice,
  components: {
    TopbarComponent,
    Footer,
    HeatmapControls,
    HeatMap,
    ScheduleHeaderDropdown: null,
  },
});

const MainLayout = () => <SharedMainLayout adapter={advancedMainLayoutAdapter} />;

export default MainLayout;
