import React, { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { getLutronDataClient } from './redux/slice/home/homeSlice';
import { selectProfile } from './redux/slice/auth/userlogin';
import { store } from './redux/store';
import { dispatchFetchClientOnce } from '../../shared/utils/bootstrapFetchGuards';
import Login from './screens/auth/Login';
import ChangePassword from './screens/auth/ChangePassword';
import MainLayout from './layouts/MainLayout';
import AuthGuard from './customhooks/AuthGuard';
import Dashboard from './screens/dashboard/Dashboard';
import {
  DASHBOARD_DEFAULT_PATH,
  DASHBOARD_OVERVIEW_ENABLED,
} from './utils/dashboardLanding';
import UsersComponent from './screens/settings/Users/UsersComponent';
import CreateUser from './screens/settings/Users/CreateUser';
import FloorComponent from './screens/settings/floor/FloorComponent';
import CreateFloor from './screens/settings/floor/CreateFloor';
import LutronWebsiteComponent from './screens/lutronwebsite page/LutronWebsiteComponent'
import EditFloor from './screens/settings/floor/EditFloor';
import CreateAreaModelComponent from './screens/create-area-model/CreateAreaModelComponent';
import HomeComponent from './screens/settings/home/HomeComponent';
import ScheduleComponent from './screens/schedule/ScheduleComponent';
import UpdatePreconfigurdEvent from './screens/schedule/UpdatePreconfigurdEvent';
import QuickControls from './screens/quickcontrols/QuickControls';
import CreateQuickControl from './screens/quickcontrols/CreateQuickControl';
import AddEvent from './screens/schedule/AddEvent';
import QuickControlDetails from './screens/quickcontrols/QuickControlDetails';
import ChangeThemeDetails from './screens/settings/changetheme/ThemeChange'
import ScheduleDetails from './screens/schedule/ScheduleDetails';
import ManageAreaGroupDetails from './screens/manageAreaGroup/ManageAreaGroup'
import UpdateAreaGroupDetails from './screens/manageAreaGroup/UpdateAreaGroup'
import UpdateUserAreaGroupDetails from './screens/userAreaGroup/UpdateUserAreaGroup'
import AddAreaGroupDetails from './screens/manageAreaGroup/CreateAreaGroup'
import CreateAreaGroup from './screens/manageAreaGroup/CreateAreaGroup';
import CreateUserAreaGroup from './screens/userAreaGroup/CreateUserAreaGroup'
import EmailServerDetails from './screens/emailServer/EmailServer'
import AreaSizeLoadDetails from './screens/area-size-load/AreaSizeLoad'
import CreateHelpDetails from './screens/settings/help/CreateHelp'
import GetHelpDetails from './screens/settings/help/GetHelp'
import ActivityReport from './screens/activityReport/ActivityReport'

import CorrectCoordinate from './screens/settings/floor/CorrectCoordinate';

import AreaCalculationPage from './screens/settings/floor/AreaCalculationPage';


import RenameWidgetDetails from './screens/settings/widgets/Widgets'
import ManageSensors from './screens/settings/sensors/ManageSensors'
import ManageModules from './screens/settings/modules/ManageModules'
import AlertsComponent from './screens/settings/alerts/AlertsComponent'
import ProcessorsSettings from './screens/settings/processors/ProcessorsSettings'
import Maintenance from './screens/settings/maintenance/Maintenance'
import ApplicationMonitoring from './screens/settings/applicationMonitoring/ApplicationMonitoring'


const HeatMap = lazy(() => import('./screens/heatmap/HeatMap'));
const FOFPComponent = lazy(() => import('./screens/settings/fofp/FOFPComponent'));
const App = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const profile = useSelector(selectProfile);

  useEffect(() => {
    // Only call this if user is authenticated and client data is not already loaded
    const token = localStorage.getItem("lutron");
    if (token && profile) {
      const state = store.getState();
      const clientData = state.home?.homeClient;
      if (!clientData || !clientData.name) {
        dispatchFetchClientOnce(dispatch, getLutronDataClient).catch(() => {
          // Silently handle errors - endpoint might not be available
        });
      }
    }
  }, [dispatch, profile]);

  return (
    <Suspense
      fallback={
        <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      }
    >
      <Routes>
          {/* Public routes */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/change_password" element={<ChangePassword />} />
          {/* Protected routes with layout */}
          <Route element={<MainLayout />}>
            <Route
              path="/dashboard"
              element={
                DASHBOARD_OVERVIEW_ENABLED ? (
                  <Dashboard />
                ) : (
                  <Navigate to={DASHBOARD_DEFAULT_PATH} replace />
                )
              }
            />
            <Route path="/dashboard/alerts" element={<Dashboard />} />
            <Route path="/dashboard/energy" element={<Dashboard />} />
            <Route path="/dashboard/space-utilization" element={<Dashboard />} />
            <Route path="/users" element={<Navigate to="/setting/users" replace />} />
            <Route path="/createusers" element={<CreateUser />} />
            <Route path="/heatmap" element={<Suspense fallback={<div>Loading...</div>}><HeatMap /></Suspense>} />
            <Route path="/create-area-model" element={<CreateAreaModelComponent />} />
            <Route path="/main" element={<Navigate to="/setting/main" replace />} />
            <Route path="/floor" element={<Navigate to="/setting/floor" replace />} />
            <Route path="/createfloor" element={<CreateFloor />} />
            <Route path="/lutron" element={<LutronWebsiteComponent />} />
            <Route path="/editfloor/:floorId" element={<EditFloor />} />
            <Route path='/schedule' element={<ScheduleComponent />} />
            <Route path='/schedule/update-preconfigured-event' element={<UpdatePreconfigurdEvent />} />
            <Route path="/schedule/add-event" element={<AddEvent />} />
            <Route path="/quickcontrols" element={<AuthGuard><QuickControls /></AuthGuard>} />
            <Route path="/quickcontrols/create" element={<AuthGuard><CreateQuickControl /></AuthGuard>} />
            <Route path="/quickcontrols/:id" element={<AuthGuard><QuickControlDetails /></AuthGuard>} />
            <Route path="/theme-change" element={<Navigate to="/setting/theme-change" replace />} />
            <Route path="/schedule/details/:id" element={<ScheduleDetails />} />
            <Route path="/manage-area-groups" element={<Navigate to="/setting/manage-area-groups" replace />} />
            <Route path="/update-area-groups/:id" element={<UpdateAreaGroupDetails />} />
            <Route path="/update-area-group/:id" element={<UpdateUserAreaGroupDetails />} />
            <Route path="/create-area-groups/" element={<CreateAreaGroup />} />
            <Route path="/create-area-group/" element={<CreateUserAreaGroup />} />
            <Route path="/email-server" element={<Navigate to="/setting/email-server/" replace />} />
            <Route path="/email-server/" element={<Navigate to="/setting/email-server/" replace />} />
            <Route path="/area-size-load/" element={<Navigate to="/setting/area-size-load" replace />} />
            <Route path="/area-size-load" element={<Navigate to="/setting/area-size-load" replace />} />
            <Route path="/create-help/" element={<Navigate to="/setting/create-help/" replace />} />
            <Route path="/get-help/" element={<GetHelpDetails />} />
            <Route path="/activity-report" element={<AuthGuard allowedRoles={["Superadmin", "Admin", "Operator"]}><ActivityReport /></AuthGuard>} />

            <Route path="/correct-coordinate/:floorId" element={<CorrectCoordinate />} />

            <Route path="/area-calculation/:floorId" element={<AreaCalculationPage />} />

            <Route path="/widgets/" element={<Navigate to="/setting/widgets/" replace />} />
            <Route path="/manage-sensors" element={<Navigate to="/setting/manage-sensors" replace />} />
            <Route path="/manage-modules" element={<Navigate to="/setting/manage-modules" replace />} />
            <Route path="/alerts" element={<Navigate to="/setting/alerts" replace />} />
            <Route path="/processors" element={<Navigate to="/setting/processors" replace />} />
            <Route path="/maintenance" element={<Navigate to="/setting/maintenance" replace />} />
            <Route path="/fofp" element={<Navigate to="/setting/fofp" replace />} />

            <Route path="/setting/main" element={<HomeComponent />} />
            <Route path="/setting/users" element={<UsersComponent />} />
            <Route path="/setting/floor" element={<FloorComponent />} />
            <Route path="/setting/theme-change" element={<ChangeThemeDetails />} />
            <Route path="/setting/manage-area-groups" element={<ManageAreaGroupDetails />} />
            <Route path="/setting/email-server/" element={<EmailServerDetails />} />
            <Route path="/setting/area-size-load" element={<AreaSizeLoadDetails />} />
            <Route path="/setting/create-help/" element={<CreateHelpDetails />} />
            <Route
              path="/setting/widgets/"
              element={<AuthGuard allowedRoles={["Superadmin"]}><RenameWidgetDetails /></AuthGuard>}
            />
            <Route path="/setting/manage-sensors" element={<AuthGuard allowedRoles={["Superadmin"]}><ManageSensors /></AuthGuard>} />
            <Route path="/setting/manage-modules" element={<AuthGuard allowedRoles={["Superadmin"]}><ManageModules /></AuthGuard>} />
            <Route path="/setting/alerts" element={<AuthGuard allowedRoles={["Superadmin"]}><AlertsComponent /></AuthGuard>} />
            <Route path="/setting/processors" element={<AuthGuard allowedRoles={["Superadmin"]}><ProcessorsSettings /></AuthGuard>} />
            <Route path="/setting/maintenance" element={<AuthGuard allowedRoles={["Superadmin"]}><Maintenance /></AuthGuard>} />
            <Route path="/setting/application-monitoring" element={<AuthGuard allowedRoles={["Superadmin"]}><ApplicationMonitoring /></AuthGuard>} />
            <Route
              path="/setting/fofp"
              element={
                <AuthGuard allowedRoles={["Superadmin"]}>
                  <Suspense fallback={<Box sx={{ display: 'flex', height: '50vh', alignItems: 'center', justifyContent: 'center' }}><CircularProgress /></Box>}>
                    <FOFPComponent />
                  </Suspense>
                </AuthGuard>
              }
            />


          </Route>
        </Routes>
    </Suspense>
  );
};
export default App;