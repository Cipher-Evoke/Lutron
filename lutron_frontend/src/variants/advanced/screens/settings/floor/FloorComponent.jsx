import React from 'react';
import { Navigate } from 'react-router-dom';
import { ADVANCED_SETTINGS_HOME_PATH } from '../../../utils/advancedSettingsPaths';
import { useSelector } from 'react-redux';
import { selectApplicationTheme } from '../../../redux/slice/theme/themeSlice';
import { ConfirmDialog } from '../../../utils/FeedbackUI';
import { UseAuth } from '../../../customhooks/UseAuth';
import SettingsLayout from '../SettingsLayout';
import { getThemeButtonColor } from '../../../utils/themePageBackground';
import FloorSettingsContent from '../../../../../shared/settings/floor/FloorSettingsContent';
import {
  fetchFloors,
  deleteFloor,
  setFloorSortMode,
  reorderFloors,
  selectFloors,
  selectManualSortEnabled,
} from '../../../redux/slice/floor/floorSlice';

export default function FloorComponent() {
  const appTheme = useSelector(selectApplicationTheme);
  const buttonColor = getThemeButtonColor(
    appTheme?.application_theme?.button,
    appTheme?.application_theme?.background
  );
  const { role } = UseAuth();

  if (role !== 'Superadmin') return <Navigate to={ADVANCED_SETTINGS_HOME_PATH} replace />;

  return (
    <SettingsLayout>
      <FloorSettingsContent
        buttonColor={buttonColor}
        fetchFloors={fetchFloors}
        deleteFloor={deleteFloor}
        setFloorSortMode={setFloorSortMode}
        reorderFloors={reorderFloors}
        selectFloors={selectFloors}
        selectManualSortEnabled={selectManualSortEnabled}
        ConfirmDialog={ConfirmDialog}
      />
    </SettingsLayout>
  );
}
