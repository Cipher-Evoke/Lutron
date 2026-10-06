/** Phase 5.3 — thin wrapper over SharedMainLayout + SharedAppShell */
import React from "react";
import * as themeSlice from "../redux/slice/theme/themeSlice";
import * as homeSlice from "../redux/slice/home/homeSlice";
import TopbarComponent from "../components/TopbarComponent";
import Footer from "../components/Footer";
import HeatmapControls from "../screens/heatmap/HeatmapControls";
import HeatMap from "../screens/heatmap/HeatMap";
import * as scheduleFormLayout from "../utils/scheduleFormLayout";
import { useSyncPanelToTopbar } from "../utils/useSyncPanelToTopbar";
import { bindAppLayoutModule } from "../../../shared/layout/app/bindAppLayoutModule";
import SharedMainLayout from "../../../shared/layout/app/SharedMainLayout";
import { customizedMainLayoutAdapter } from "../../../shared/layout/app/adapters/customizedMainLayoutAdapter";

bindAppLayoutModule({
  themeSlice,
  themeUtils: {},
  breadcrumbUtils: {},
  homeSlice,
  scheduleFormLayout,
  hooks: { useSyncPanelToTopbar },
  components: {
    TopbarComponent,
    Footer,
    HeatmapControls,
    HeatMap,
    ScheduleHeaderDropdown: null,
  },
});

const MainLayout = () => <SharedMainLayout adapter={customizedMainLayoutAdapter} />;

export default MainLayout;
