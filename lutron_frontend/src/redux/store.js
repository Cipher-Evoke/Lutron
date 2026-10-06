import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slice/auth/userlogin";
import usersReducer from './slice/settingsslice/user/usersSlice'
import themeReducer from "./slice/theme/themeSlice";
import createUserReducer from "./slice/settingsslice/createUserSlice";
import floorReducer from './slice/floor/floorSlice';
import processorReducer from './slice/processor/processorSlice';
import heatmapReducer from '../redux/slice/settingsslice/heatmap/HeatmapSlice'
import quickControlReducer from './slice/quickcontrols/quickControlSlice';
import homeSlice from "./slice/home/homeSlice";
import groupOccupancyReducer from '../redux/slice/settingsslice/heatmap/groupOccupancySlice'
import scheduleReducer from './slice/schedule/scheduleSlice';
import areaSettingsReducer from '../redux/slice/settingsslice/heatmap/areaSettingsSlice'
import { combineReducers } from 'redux';
import dashboardReducer from './slice/dashboard/dashboardSlice'
import alertsReducer from './slice/dashboard/alertsSlice'
import sensorsReducer from './slice/sensors/sensorsSlice'
import modulesReducer from './slice/modules/modulesSlice'
import unifiedEnergyReducer from './slice/dashboard/unifiedEnergySlice'
import alertsDisplayReducer from './slice/settingsslice/alerts/alertsDisplaySlice'

export const store = configureStore({
  reducer: {
    user: userReducer,   // state.user
    users: usersReducer,  // state.users
    theme: themeReducer,
    createUser: createUserReducer,
    processor: processorReducer,
    floor: floorReducer,
    heatmap: heatmapReducer,
    quickControl: quickControlReducer,
    home: homeSlice,
    schedule: scheduleReducer,
    groupOccupancy: groupOccupancyReducer,
    areaSettings: areaSettingsReducer,
    dashboard: dashboardReducer,
    unifiedEnergy: unifiedEnergyReducer,
    alerts: alertsReducer,
    sensors: sensorsReducer,
    modules: modulesReducer,
    alertsDisplay: alertsDisplayReducer,

  },
});

export default store;