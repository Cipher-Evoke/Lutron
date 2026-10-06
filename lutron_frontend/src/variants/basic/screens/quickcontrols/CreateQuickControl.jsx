import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import AreaTreeDialog from "./AreaTreeDialog";
import Action from "./Action";
import { fetchFloors, selectFloors } from "../../redux/slice/floor/floorSlice";
import { dispatchFetchFloorsOnce } from "../../../../shared/utils/bootstrapFetchGuards";
import { selectAreaScenes } from "../../redux/slice/settingsslice/heatmap/areaSettingsSlice";
import { createQuickControl, fetchQuickControls } from "../../redux/slice/quickcontrols/quickControlSlice";
import { useNavigate } from "react-router-dom";
import { ConfirmDialog } from "../../utils/FeedbackUI";
import { UseAuth } from "../../customhooks/UseAuth";
import { selectProfile } from "../../redux/slice/auth/userlogin";
import { selectApplicationTheme } from "../../redux/slice/theme/themeSlice";
import { BaseUrl } from "../../BaseUrl";
import { DEFAULT_APP_CONTENT, isWhiteAreaPickerChrome, onContentColors } from "../../utils/themeOnSurface";
import {
  scheduleFixedActionBarStyle,
  schedulePageWithFixedActionBarStyle,
} from "../../../../utils/fixedActionBarStyles";
import {
  applyCommonActionToActions,
  stripActionSource,
  withIndividualSource,
} from "../../../../utils/scheduleActionPriority";
import ActionChooserModal from "../../../../shared/quickcontrols/ActionChooserModal";
import { getQuickControlActionShortLabel } from "../../../../shared/quickcontrols/quickControlActionLabels";
import {
  convertApiActionToUiAction,
  expandQuickControlActionData,
  lightStatusSettingsFromAreaAction,
  locationHasSceneAction,
  locationHasZoneAction,
  mergeExpandedActionsIntoLocation,
} from "../../../../shared/quickcontrols/zoneActionHelpers";
import { createSingleFlight } from "../../../../shared/utils/createSingleFlight";

const CreateQuickControl = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const floors = useSelector(selectFloors);
  const areaScenes = useSelector(selectAreaScenes);
  const appTheme = useSelector(selectApplicationTheme);
  const buttonColor = appTheme?.application_theme?.button || '#232323';
  const contentColor = appTheme?.application_theme?.content || DEFAULT_APP_CONTENT;
  const whiteChrome = isWhiteAreaPickerChrome(contentColor);
  const ACTION_BLUE = whiteChrome ? '#1565C0' : buttonColor;
  const onContent = onContentColors(contentColor);
  const dialogLabelColor = whiteChrome ? "#000000" : buttonColor;
  
  // Get user authentication and role
  const { role } = UseAuth();
  const userProfile = useSelector((state) => state.user?.profile);
  
  // Check if user has permission to create Quick Controls
  useEffect(() => {
    // Check if userProfile and role are loaded yet; if not, do not run logic
    if (role == null || userProfile == null) return;

    const canCreate = () => {
      // Superadmin and Admin can always create Quick Controls
      if (role === 'Superadmin' || role === 'Admin') {
        return true;
      }
      
      // For Operators, check if they have monitor_control_edit permission
      if (role === 'Operator' && userProfile && userProfile.floors) {
        const hasMonitorControlEdit = userProfile.floors.some(f => f.floor_permission === 'monitor_control_edit');
        return hasMonitorControlEdit;
      }
      
      return false;
    };
    
    if (!canCreate()) {
      navigate('/dashboard', { replace: true });
    }
  }, [role, userProfile, navigate]);

  const [quickControlName, setQuickControlName] = useState("");
  const [locations, setLocations] = useState([]);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [actionDialogIdx, setActionDialogIdx] = useState(null);
  const [selectedActionData, setSelectedActionData] = useState(null);
  const [editingActionIdx, setEditingActionIdx] = useState(null);
  const [editAllMode, setEditAllMode] = useState(false);
  const [actionChooser, setActionChooser] = useState(null); // { mode, locationIdx }
  
  // Add confirmation dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState(null);
  const [showDeleteActionDialog, setShowDeleteActionDialog] = useState(false);
  const [actionToDelete, setActionToDelete] = useState(null);

  // New state for common action functionality
  const [showCommonActionDialog, setShowCommonActionDialog] = useState(false);
  const [editingAreaStatus, setEditingAreaStatus] = useState(null);
  const [selectedCommonActionType, setSelectedCommonActionType] = useState('light_status');
  const [selectedOccupancySetting, setSelectedOccupancySetting] = useState(null);
  const [selectedZoneType, setSelectedZoneType] = useState('switched');
  const [lightStatusSettings, setLightStatusSettings] = useState({
    switched: { on_off: 'On' },
    dimmed: { brightness: 50, fadeTime: '02', delayTime: '00' },
    whitetune: { brightness: 50, cct: 2700, fadeTime: '02', delayTime: '00' }
  });

  const resetCommonActionDialog = () => {
    setShowCommonActionDialog(false);
    setEditingAreaStatus(null);
    setSelectedCommonActionType('light_status');
    setSelectedOccupancySetting(null);
    setSelectedZoneType('switched');
  };

  useEffect(() => {
    dispatchFetchFloorsOnce(dispatch, fetchFloors, Boolean(floors?.length));
  }, [dispatch, floors?.length]);

  // Add location(s) from dialog
  const handleAddLocations = (areas) => {
    setLocations(prev => [
      ...prev,
      ...areas.map(a => ({
        ...a,
        actions: []
      }))
    ]);
  };

  // Delete location - Updated to show confirmation first
  const handleDelete = (index) => {
    setLocationToDelete({ index, location: locations[index] });
    setShowDeleteDialog(true);
  };

  // Confirm delete location
  const confirmDeleteLocation = () => {
    if (locationToDelete) {
      setLocations(prev => prev.filter((_, i) => i !== locationToDelete.index));
      setShowDeleteDialog(false);
      setLocationToDelete(null);
    }
  };

  // Open action dialog
  const handleOpenActionDialog = (idx) => {
    setEditingActionIdx(null);
    setEditAllMode(false);
    setActionDialogIdx(idx);
    setSelectedActionData(null);
  };

  // Add / update action(s) on a location (supports All Zones expand + multi-action merge)
  const handleAddAction = (idx, actionData) => {
    const expanded = expandQuickControlActionData(actionData);
    setLocations((prev) =>
      prev.map((loc, i) => {
        if (i !== idx) return loc;
        return {
          ...loc,
          actions: mergeExpandedActionsIntoLocation(loc.actions, expanded, {
            editingActionIdx: editAllMode ? null : editingActionIdx,
            editAllMode,
            withSource: withIndividualSource,
          }),
        };
      })
    );
    setActionDialogIdx(null);
    setSelectedActionData(null);
    setEditingActionIdx(null);
    setEditAllMode(false);
  };

  const openEditForAction = (locationIdx, actionIdx) => {
    const location = locations[locationIdx];
    const action = location?.actions?.[actionIdx];
    if (!action) return;

    if (action.type === 'area_status') {
      setEditingAreaStatus({ locationIdx });
      setSelectedCommonActionType('light_status');
      setSelectedOccupancySetting(null);
      setSelectedZoneType('switched');
      setLightStatusSettings((prev) => ({
        ...prev,
        ...lightStatusSettingsFromAreaAction(action),
      }));
      setShowCommonActionDialog(true);
      return;
    }

    const convertedAction = convertApiActionToUiAction(action);
    setEditingActionIdx(actionIdx);
    setEditAllMode(false);
    setSelectedActionData(convertedAction);
    setActionDialogIdx(locationIdx);
  };

  const handleEditButtonClick = (locationIdx) => {
    const location = locations[locationIdx];
    const actions = location?.actions || [];
    if (actions.length === 0) {
      handleOpenActionDialog(locationIdx);
      return;
    }
    if (actions.length === 1) {
      openEditForAction(locationIdx, 0);
      return;
    }
    setActionChooser({ mode: 'edit', locationIdx });
  };

  const handleDeleteButtonClick = (locationIdx) => {
    const location = locations[locationIdx];
    const actions = location?.actions || [];
    if (actions.length === 0) {
      setLocationToDelete({ index: locationIdx, location });
      setShowDeleteDialog(true);
      return;
    }
    if (actions.length === 1) {
      setActionToDelete({
        locationIdx,
        location,
        actionIndex: 0,
        action: actions[0],
      });
      setShowDeleteActionDialog(true);
      return;
    }
    setActionChooser({ mode: 'delete', locationIdx });
  };

  const handleChooserPickEdit = (pick) => {
    const locationIdx = actionChooser?.locationIdx;
    setActionChooser(null);
    if (locationIdx == null) return;
    if (pick === 'all') {
      setEditAllMode(true);
      setEditingActionIdx(null);
      setSelectedActionData(null);
      setActionDialogIdx(locationIdx);
      return;
    }
    openEditForAction(locationIdx, pick);
  };

  const handleChooserPickDelete = (pick) => {
    const locationIdx = actionChooser?.locationIdx;
    setActionChooser(null);
    if (locationIdx == null) return;
    const location = locations[locationIdx];
    if (pick === 'all') {
      setLocations((prev) =>
        prev.map((loc, i) => (i === locationIdx ? { ...loc, actions: [] } : loc))
      );
      return;
    }
    setActionToDelete({
      locationIdx,
      location,
      actionIndex: pick,
      action: location.actions[pick],
    });
    setShowDeleteActionDialog(true);
  };

  const confirmDeleteAction = () => {
    if (!actionToDelete) return;
    setLocations((prev) =>
      prev.map((loc, i) => {
        if (i !== actionToDelete.locationIdx) return loc;
        return {
          ...loc,
          actions: (loc.actions || []).filter((_, ai) => ai !== actionToDelete.actionIndex),
        };
      })
    );
    setShowDeleteActionDialog(false);
    setActionToDelete(null);
  };

  
  // Save quick control (call backend)
  const runSaveOnce = useMemo(() => createSingleFlight(), []);
  const handleSave = async () => runSaveOnce(async () => {
    if (!quickControlName.trim() || locations.length === 0) return;
    
    // Check that all locations have at least one action
    const hasLocationsWithoutActions = locations.some(location => !location.actions || location.actions.length === 0);
    if (hasLocationsWithoutActions) {
      // You might want to add a toast notification here
      alert("All locations must have at least one action before saving.");
      return;
    }

    const payload = {
      name: quickControlName,
      areas: locations.map(loc => ({
        floor_id: loc.floorId,
        area_id: loc.areaId,
        actions: loc.actions.map((rawAction) => {
          const action = stripActionSource(rawAction);
          // SCENE
          if (action.type === "scene" && action.scene) {
            return {
              type: "set_scene",
              scene_code: String(action.scene.id),
              scene_name: action.scene.name
            };
          }
          // AREA_STATUS (from common action for On/Off - uses /area/zone_on-off API)
          if (action.type === "area_status") {
            return {
              type: "area_status",
              area_status: action.area_status
            };
          }
          // ZONE_STATUS (from common action - already in backend format)
          if (action.type === "zone_status") {
            // Already in backend format, just ensure fade_time and delay_time are set if needed
            const zoneAction = { ...action };
            if ((action.zone_type === "dimmed" || action.zone_type === "whitetune") && !zoneAction.fade_time) {
              zoneAction.fade_time = "02";
            }
            if ((action.zone_type === "dimmed" || action.zone_type === "whitetune") && !zoneAction.delay_time) {
              zoneAction.delay_time = "00";
            }
            return zoneAction;
          }
          // ZONE (from Action component - frontend format)
          if (action.type === "zone" && action.zone) {
            // Check if this is a simple On/Off for switched zone without zone_id (area-level control)
            if (action.zone.type === "switched" && 
                (!action.zone.id || action.zone.id === null) &&
                action.values?.on_off &&
                !action.values.brightness &&
                !action.values.cct) {
              // Use area_status for simple On/Off area control (uses /area/zone_on-off API)
              return {
                type: "area_status",
                area_status: action.values.on_off
              };
            }
            // For specific zone controls, use zone_status
            const zoneAction = {
              type: "zone_status",
              zone_id: Number(action.zone.id || action.zone.zone_id),
              zone_type: action.zone.type,
              zone_status: action.values?.on_off,
              zone_brightness: action.values?.brightness !== undefined ? `${action.values.brightness}%` : undefined,
              zone_temperature: action.values?.cct ? `${action.values.cct}K` : undefined,
              zone_name: action.zone.name
            };
            // Add fade and delay times for dimmed and whitetune zones
            if (action.zone.type === "dimmed" || action.zone.type === "whitetune") {
              zoneAction.fade_time = action.values?.fadeTime || "02";
              zoneAction.delay_time = action.values?.delayTime || "00";
            }
            return zoneAction;
          }
          // OCCUPANCY
          if (action.type === "occupancy") {
            // Handle both action.action (from Action component) and occupancy_setting (from common action)
            const occupancySetting = action.occupancy_setting || action.action;
            if (occupancySetting) {
              return {
                type: "occupancy",
                occupancy_setting: occupancySetting
              };
            }
            // If already in backend format with occupancy_setting, return as is
            return action;
          }
          // SHADE
          if (action.type === "shade_group_status" && action.shade_group_id) {
            const rawLevel = action.shade_level;
            const shadeLevel =
              typeof rawLevel === "string" && rawLevel.includes("%")
                ? rawLevel
                : `${rawLevel}%`;
            return {
              type: "shade_group_status",
              shade_group_id: Number(action.shade_group_id),
              shade_group_name: action.shade_group_name,
              shade_level: shadeLevel
            };
          }
          // Default: return as is
          return action;
        })
      }))
    };


    try {
      await dispatch(createQuickControl(payload)).unwrap();
      await dispatch(fetchQuickControls());
      navigate("/quickcontrols");
    } catch (error) {
      // Error alert is shown by createQuickControl thunk; stay on create page.
    }
  });

  // Cancel: go back to list
  const handleCancel = () => {
    navigate("/quickcontrols"); // <-- Make sure this matches your route!
  };

  // Handle common action type selection
  const handleCommonActionTypeSelect = async (actionType) => {
    setSelectedCommonActionType(actionType);
    setSelectedOccupancySetting(null);
    setSelectedZoneType('switched');
    
    // Only set default occupancy setting, don't apply yet
    if (actionType === 'occupancy') {
      setSelectedOccupancySetting("auto");
    }
    // Don't auto-apply - wait for "Apply to All" button
  };

  // Handle light status setting changes
  const handleLightStatusSettingChange = async (type, setting, value) => {
    // Only update the state, don't apply to locations yet - wait for "Apply to All" button
    setLightStatusSettings(prev => ({
      ...prev,
      [type]: { ...prev[type], [setting]: value }
    }));
  };

  // Handle occupancy setting selection
  const handleOccupancySettingSelect = (setting) => {
    // Only update the state, don't apply to locations yet - wait for "Apply to All" button
    setSelectedOccupancySetting(setting);
  };

  // Apply common action to all areas
  const handleApplyCommonAction = () => {
    if (locations.length === 0) {
      resetCommonActionDialog();
      return;
    }

    if (editingAreaStatus != null && selectedCommonActionType === 'light_status') {
      const { locationIdx } = editingAreaStatus;
      const commonAction = {
        type: "area_status",
        area_status: lightStatusSettings.switched.on_off
      };
      setLocations(prev => prev.map((location, i) =>
        i === locationIdx
          ? { ...location, actions: applyCommonActionToActions(location.actions, commonAction) }
          : location
      ));
      resetCommonActionDialog();
      return;
    }
    
    // Ensure the action is applied with current settings
    if (selectedCommonActionType === 'light_status') {
      const commonAction = {
        type: "area_status",
        area_status: lightStatusSettings.switched.on_off
      };
      
      setLocations(prev => prev.map(location => ({
        ...location,
        actions: applyCommonActionToActions(location.actions, commonAction)
      })));
    } else if (selectedCommonActionType === 'occupancy' && selectedOccupancySetting) {
      const commonAction = {
        type: "occupancy",
        occupancy_setting: selectedOccupancySetting
      };
      
      setLocations(prev => prev.map(location => ({
        ...location,
        actions: applyCommonActionToActions(location.actions, commonAction)
      })));
    }
    
    // Close the dialog and reset
    resetCommonActionDialog();
  };

  // Don't auto-apply when dialog opens - wait for "Apply to All" button

  return (
    <div style={{
      // Longhands only — fixed action bar also sets paddingBottom/paddingRight.
      paddingTop: 40,
      paddingLeft: 40,
      paddingBottom: 40,
      paddingRight: 40,
      borderRadius: 20,
      minHeight: 500,
      ...schedulePageWithFixedActionBarStyle(false, false),
    }}>
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontWeight: 500, color: '#000' }}>Quick Control Name</label>
        <input
          type="text"
          value={quickControlName}
          onChange={e => setQuickControlName(e.target.value)}
          style={{
            display: 'block',
            width: 300,
            marginTop: 8,
            marginBottom: 24,
            padding: 8,
            borderRadius: 4,
            border: '1px solid #ccc'
          }}
        />
      </div>
      <div style={{
        color: whiteChrome ? '#fff' : '#000',
        background: whiteChrome ? '#1565C0' : 'transparent',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontWeight: 700,
        borderBottom: whiteChrome ? '1px solid rgba(255,255,255,0.35)' : '1px solid #ccc',
        borderTopLeftRadius: whiteChrome ? 8 : 0,
        borderTopRightRadius: whiteChrome ? 8 : 0,
        padding: '10px 12px',
        gap: 16
      }}>
        <span style={{ flex: '0 0 300px', cursor: 'pointer' }} onClick={() => setShowLocationDialog(true)}>+ Add Location</span>
        <span style={{ flex: '1 1 auto', textAlign: 'center' }}>Add Action</span>
        <span style={{ flex: '0 0 170px', textAlign: 'right', cursor: 'pointer' }} onClick={() => {
          setEditingAreaStatus(null);
          setSelectedCommonActionType('light_status');
          setSelectedOccupancySetting(null);
          setSelectedZoneType('switched');
          setLightStatusSettings((prev) => ({
            ...prev,
            switched: { on_off: 'On' },
          }));
          setShowCommonActionDialog(true);
        }}>+ Add Common Action</span>
      </div>
      {locations.map((loc, idx) => (
        <div key={idx} style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 0',
          color: '#000000',
          borderBottom: '1px solid #b2a98b',
          background: onContent.isLight
            ? (idx % 2 === 0 ? 'rgba(0,0,0,0.03)' : 'transparent')
            : (idx % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'transparent'),
        }}>
          <span style={{ flex: '0 0 300px', minWidth: 0, color: '#000000' }}>{loc.floorName} {'/'} {loc.areaName}</span>
          <span style={{ flex: '1 1 auto', minWidth: 0, color: '#000000', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {(loc.actions && loc.actions.length > 0)
              ? (
                <>
                {loc.actions.map((a, i) => {
                  // AREA_STATUS (from common action for On/Off)
                  if (a.type === "area_status") {
                    const status = a.area_status || "Off";
                    return (
                      <div key={i}>
                        Area Status: {status}
                      </div>
                    );
                  }
                  // ZONE_STATUS (from common action with specific zone controls)
                  if (a.type === "zone_status") {
                    const zoneType = a.zone_type;
                    const zoneStatus = a.zone_status || a.switched_state || "Off";
                    
                    // For zone_status with zone_id, show zone details
                    if (a.zone_id) {
                      const zoneName = a.zone_name || `Zone ${a.zone_id}`;
                      if (zoneType === "switched") {
                        const switchedState = a.switched_state || a.zone_status || "Off";
                        return (
                          <div key={i}>
                            Zone: {zoneName} ({switchedState})
                          </div>
                        );
                      } else if (zoneType === "dimmed") {
                        const switchedState = a.zone_status || "On";
                        const brightness = a.zone_brightness || "";
                        return (
                          <div key={i}>
                            Zone: {zoneName} ({switchedState}{brightness ? `, ${brightness}` : ""})
                          </div>
                        );
                      } else if (zoneType === "whitetune") {
                        const switchedState = a.zone_status || "On";
                        const brightness = a.zone_brightness || "";
                        const temperature = a.zone_temperature || "";
                        return (
                          <div key={i}>
                            Zone: {zoneName} ({switchedState}{brightness ? `, ${brightness}` : ""}{temperature ? `, ${temperature}` : ""})
                          </div>
                        );
                      } else {
                        return (
                          <div key={i}>
                            Zone: {zoneName} ({zoneStatus})
                          </div>
                        );
                      }
                    }
                    // Fallback for zone_status without zone_id
                    return (
                      <div key={i}>
                        Area Status: {zoneStatus}
                      </div>
                    );
                  }
                  // ZONE (from Action component)
                  if (a.type === "zone" && a.zone) {
                    if (
                      a.zone.type &&
                      ["switched", "switch"].includes(a.zone.type.toLowerCase())
                    ) {
                      const zoneName = a.zone_name || (a.zone && a.zone.name) || a.zone_id || '';
                      return (
                        <div key={i}>
                          Zone: {zoneName}{zoneName ? ' -' : ''} ({a.values?.on_off || "OFF"})
                        </div>
                      );
                    }
                    if (
                      a.zone.type &&
                      [
                        "whitetune",
                        "white tune",
                        "white_tune",
                        "cct"
                      ].includes(a.zone.type.toLowerCase())
                    ) {
                      const zoneName = a.zone_name || (a.zone && a.zone.name) || a.zone_id || '';
                      return (
                        <div key={i}>
                          Zone: {zoneName}{zoneName ? ' -' : ''} ({a.values?.brightness ?? 0}% brightness, {a.values?.cct ?? 2700}K CCT)
                        </div>
                      );
                    }
                    if (
                      a.zone.type &&
                      ["dimmer", "dimmed"].includes(a.zone.type.toLowerCase())
                    ) {
                      const zoneName = a.zone_name || (a.zone && a.zone.name) || a.zone_id || '';
                      return (
                        <div key={i}>
                          Zone: {zoneName}{zoneName ? ' -' : ''} ({a.values?.brightness ?? 0}% brightness)
                        </div>
                      );
                    }
                    const zoneName = a.zone_name || (a.zone && a.zone.name) || a.zone_id || '';
                    return (
                      <div key={i}>
                        Zone: {zoneName}{zoneName ? ' -' : ''}
                      </div>
                    );
                  }
                  // OCCUPANCY (from common action)
                  if (a.type === "occupancy") {
                    let occLabel = "";
                    // Check both action and occupancy_setting
                    const setting = a.occupancy_setting || a.action;
                    if (setting) {
                      if (setting.toLowerCase() === "disabled") occLabel = "Disabled";
                      else if (setting.toLowerCase() === "auto") occLabel = "Auto";
                      else if (setting.toLowerCase() === "vacancy") occLabel = "Vacancy";
                      else occLabel = setting;
                    }
                    return <div key={i}>Occupancy Setting: {occLabel}</div>;
                  }
                  // SCENE
                  if (a.type === "scene" && a.scene) {
                    return <div key={i}>Scene: {a.scene.name}</div>;
                  }
                  if (a.type === "set_scene") {
                    return <div key={i}>Scene: {a.scene_name}</div>;
                  }
                  // SHADE
              
                    if (a.type === "shade_group_status" && a.shade_group_id) {
                      const shadeName = a.shade_group_name || a.shade_group_id || '';
                      const shadeValue = typeof a.shade_level === "string"
                        ? Number(a.shade_level.replace('%', '').trim())
                        : Number(a.shade_level);
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                          <div style={{ minWidth: 120 }}>
                            Shade: {shadeName}{shadeName ? ' -' : ''}
                          </div>
                          <span style={{ minWidth: 60, fontWeight: 600 }}>
                            {shadeValue}% Open
                          </span>
                        </div>
                      );
                    }

                  // DEVICE
                  if (a.type === "device" && a.device) {
                    return <div key={i}>Device: {a.device.name}{a.device.name ? ' -' : ''}</div>;
                  }
                  return null;
                })}
                  <button
                    type="button"
                    style={{
                      color: ACTION_BLUE,
                      padding: '5px 10px',
                      borderRadius: 2,
                      border: `1px solid ${ACTION_BLUE}`,
                      background: 'transparent',
                      cursor: 'pointer',
                      marginTop: 4,
                    }}
                    onClick={() => handleOpenActionDialog(idx)}
                  >+ Add Action</button>
                </>
              )
              : <button
                  style={{
                    color: 'white',
                    padding: '5px 10px',
                    borderRadius: 2,
                    border: `1px solid ${ACTION_BLUE}`,
                    background: ACTION_BLUE,
                    cursor: 'pointer'
                  }}
                  onClick={() => handleOpenActionDialog(idx)}
                >Add Action</button>
            }
          </span>
          <span style={{ flex: '0 0 140px', display: 'flex', justifyContent: 'flex-end', gap: 8, alignItems: 'center' }}>
            {(loc.actions && loc.actions.length > 0) && (
              <button
                onClick={() => handleEditButtonClick(idx)}
                style={{
                  background: ACTION_BLUE,
                  border: 'none',
                  borderRadius: 4,
                  color: '#fff',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: 12,
                  whiteSpace: 'nowrap',
                }}
              >Edit Action</button>
            )}
            <button
              onClick={() => handleDeleteButtonClick(idx)}
              style={{
                background: ACTION_BLUE,
                border: 'none',
                borderRadius: 4,
                color: '#fff',
                padding: '6px 10px',
                cursor: 'pointer'
              }}
            >🗑️</button>
          </span>
          {actionDialogIdx === idx && (
            <div style={{
              position: 'fixed',
              left: 0, top: 0, right: 0, bottom: 0,
              background: "rgba(0,0,0,0.25)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <div style={{
                background: whiteChrome ? "#ffffff" : "#CDC0A0",
                border: whiteChrome ? "1px solid #e5e7eb" : "none",
                borderRadius: whiteChrome ? 12 : 18,
                padding: 28,
                minWidth: 340,
                boxShadow: whiteChrome ? "0 4px 24px rgba(0,0,0,0.08)" : "0 4px 24px rgba(0,0,0,0.12)",
                position: "relative",
                color: whiteChrome ? "#000000" : buttonColor
              }}>
                <div style={{ marginBottom: 16, fontWeight: 600, fontSize: 18, color: dialogLabelColor }}>
                  {selectedActionData ? 'Edit Action' : 'Add Action'}
                </div>
                <Action
                  areaId={loc.areaId}
                  onActionSelect={action => setSelectedActionData(action)}
                  initialAction={selectedActionData}
                  hideZoneOption={
                    !editAllMode &&
                    editingActionIdx == null &&
                    locationHasSceneAction(locations[actionDialogIdx]?.actions)
                  }
                  hideSceneOption={
                    !editAllMode &&
                    editingActionIdx == null &&
                    locationHasZoneAction(locations[actionDialogIdx]?.actions)
                  }
                />
                <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "flex-end" }}>
                  <button
                    onClick={() => {
                      if (selectedActionData && selectedActionData.type) {
                        handleAddAction(idx, selectedActionData);
                      }
                    }}
                    disabled={
                      !selectedActionData ||
                      !selectedActionData.type ||
                      (selectedActionData.type === "scene" && !selectedActionData.scene) ||
                      (selectedActionData.type === "shade" && !selectedActionData.shade)
                    }
                    style={{
                      padding: "10px 28px",
                      borderRadius: 8,
                      border: (selectedActionData && selectedActionData.type && (selectedActionData.type !== "scene" || selectedActionData.scene)) ? "1px solid #1565C0" : "1px solid #888",
                      background: (selectedActionData && selectedActionData.type && (selectedActionData.type !== "scene" || selectedActionData.scene)) ? ACTION_BLUE : "#888",
                      color: "#fff",
                      fontWeight: 500,
                      cursor: (selectedActionData && selectedActionData.type && (selectedActionData.type !== "scene" || selectedActionData.scene)) ? "pointer" : "not-allowed"
                    }}
                  >
                    {selectedActionData ? 'Update' : 'Add'} Action
                  </button>
                  <button
                    onClick={() => { setActionDialogIdx(null); setSelectedActionData(null); setEditingActionIdx(null); setEditAllMode(false); }}
                    style={{
                      padding: "10px 28px",
                      borderRadius: 8,
                      border: "1px solid #1565C0",
                      background: "#fff",
                      color: "#1565C0",
                      fontWeight: 500,
                      cursor: "pointer"
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
 
      <AreaTreeDialog
        open={showLocationDialog}
        onClose={() => setShowLocationDialog(false)}
        onAdd={handleAddLocations}
      />

      {/* Common Action Dialog */}
      {showCommonActionDialog && (
        <div style={{
          position: 'fixed',
          left: 0, top: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.25)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{
            background: whiteChrome ? "#ffffff" : "#CDC0A0",
            border: whiteChrome ? "1px solid #e5e7eb" : "none",
            borderRadius: whiteChrome ? 12 : 18,
            padding: 28,
            minWidth: 400,
            maxWidth: 600,
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: whiteChrome ? "0 4px 24px rgba(0,0,0,0.08)" : "0 4px 24px rgba(0,0,0,0.12)",
            position: "relative",
            color: whiteChrome ? "#000000" : buttonColor
          }}>
            <div style={{ marginBottom: 16, fontWeight: 600, fontSize: 18, color: dialogLabelColor }}>
              {editingAreaStatus ? 'Edit Action' : 'Add Common Action'}
            </div>
            
            {/* Action Type Dropdown */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8, color: whiteChrome ? "#000000" : onContent.primary }}>Select Action Type</div>
              <select
                value={selectedCommonActionType}
                onChange={(e) => handleCommonActionTypeSelect(e.target.value)}
                disabled={!!editingAreaStatus}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: whiteChrome ? 10 : 6,
                  border: whiteChrome ? "1px solid #d1d5db" : "1px solid #ccc",
                  background: "#ffffff",
                  color: "#000000",
                  fontSize: 14
                }}
              >
                <option value="light_status">Light Status</option>
                {!editingAreaStatus && <option value="occupancy">Occupancy Setting</option>}
              </select>
            </div>

            {/* Light Status Options */}
            {selectedCommonActionType === 'light_status' && (
              <div style={{ marginTop: 16 }}>
                {/* <div style={{ fontWeight: 600, marginBottom: 8, color: whiteChrome ? "#000000" : onContent.primary }}>Light Status (On/Off)</div> */}
                
                {/* Simplified: Only On/Off options */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8, color: whiteChrome ? "#000000" : onContent.primary }}>Light State</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <label style={{ display: 'flex', alignItems: 'center', color: dialogLabelColor }}>
                      <input
                        type="radio"
                        value="On"
                        checked={lightStatusSettings.switched.on_off === 'On'}
                        onChange={(e) => handleLightStatusSettingChange('switched', 'on_off', e.target.value)}
                        style={{ 
                          marginRight: 8,
                          accentColor: '#1565C0',
                          WebkitAppearance: 'none',
                          appearance: 'none',
                          width: '12px',
                          height: '12px',
                          border: '2px solid #ccc',
                          borderRadius: '50%',
                          backgroundColor: lightStatusSettings.switched.on_off === 'On' ? ACTION_BLUE : 'transparent',
                          position: 'relative'
                        }}
                      />
                      On
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', color: dialogLabelColor }}>
                      <input
                        type="radio"
                        value="Off"
                        checked={lightStatusSettings.switched.on_off === 'Off'}
                        onChange={(e) => handleLightStatusSettingChange('switched', 'on_off', e.target.value)}
                        style={{ 
                          marginRight: 8,
                          accentColor: '#1565C0',
                          WebkitAppearance: 'none',
                          appearance: 'none',
                          width: '12px',
                          height: '12px',
                          border: '2px solid #ccc',
                          borderRadius: '50%',
                          backgroundColor: lightStatusSettings.switched.on_off === 'Off' ? ACTION_BLUE : 'transparent',
                          position: 'relative'
                        }}
                      />
                      Off
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Occupancy Setting Options */}
            {selectedCommonActionType === 'occupancy' && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 8, color: whiteChrome ? "#000000" : onContent.primary }}>Occupancy Setting</div>
                <div style={{ display: "flex", gap: 16 }}>
                  {["disabled", "auto", "vacancy"].map((setting) => (
                    <button
                      key={setting}
                      style={{
                        borderRadius: 8,
                        minWidth: 100,
                        height: 45,
                        fontWeight: 700,
                        fontSize: 16,
                        background: selectedOccupancySetting === setting ? ACTION_BLUE : "#fff",
                        color: selectedOccupancySetting === setting ? "#fff" : (whiteChrome ? "#000000" : buttonColor),
                        border: selectedOccupancySetting === setting ? "none" : "1px solid #ccc",
                        boxShadow: "0 1px 4px #0001",
                        cursor: "pointer",
                        outline: "none"
                      }}
                      onClick={() => handleOccupancySettingSelect(setting)}
                    >
                      {setting.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={handleApplyCommonAction}
                disabled={!selectedCommonActionType || 
                  (selectedCommonActionType === 'occupancy' && !selectedOccupancySetting) ||
                  (selectedCommonActionType === 'light_status' && !selectedZoneType)}
                style={{
                  padding: "10px 28px",
                  borderRadius: 8,
                  border: (selectedCommonActionType && 
                    (selectedCommonActionType !== 'occupancy' || selectedOccupancySetting) &&
                    (selectedCommonActionType !== 'light_status' || selectedZoneType)) ? "1px solid #1565C0" : "1px solid #888",
                  background: (selectedCommonActionType && 
                    (selectedCommonActionType !== 'occupancy' || selectedOccupancySetting) &&
                    (selectedCommonActionType !== 'light_status' || selectedZoneType)) ? ACTION_BLUE : "#888",
                  color: "#fff",
                  fontWeight: 500,
                  cursor: (selectedCommonActionType && 
                    (selectedCommonActionType !== 'occupancy' || selectedOccupancySetting) &&
                    (selectedCommonActionType !== 'light_status' || selectedZoneType)) ? "pointer" : "not-allowed"
                }}
              >
                {editingAreaStatus ? 'Update' : 'Apply to All'}
              </button>
              <button
                onClick={resetCommonActionDialog}
                style={{
                  padding: "10px 28px",
                  borderRadius: 8,
                  border: "1px solid #1565C0",
                  background: "#fff",
                  color: "#1565C0",
                  fontWeight: 500,
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Location Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        title="Delete Location"
        message={`Are you sure you want to delete location "${locationToDelete?.location?.areaName}"?`}
        onConfirm={confirmDeleteLocation}
        onCancel={() => {
          setShowDeleteDialog(false);
          setLocationToDelete(null);
        }}
      />

      <div style={scheduleFixedActionBarStyle(false, false)}>
        <button
          onClick={handleCancel}
          style={{
            padding: "10px 28px",
            borderRadius: 8,
            border: "1px solid #1565C0",
            background: "#fff",
            color: "#1565C0",
            fontWeight: 500,
            cursor: "pointer"
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!quickControlName.trim() || locations.length === 0 || locations.some(location => !location.actions || location.actions.length === 0)}
          style={{
            padding: "10px 28px",
            borderRadius: 8,
            border: (quickControlName.trim() && locations.length > 0 && !locations.some(location => !location.actions || location.actions.length === 0)) ? "1px solid #1565C0" : "1px solid #888",
            background: (quickControlName.trim() && locations.length > 0 && !locations.some(location => !location.actions || location.actions.length === 0)) ? ACTION_BLUE : "#888",
            color: "#fff",
            fontWeight: 500,
            cursor: (quickControlName.trim() && locations.length > 0 && !locations.some(location => !location.actions || location.actions.length === 0)) ? "pointer" : "not-allowed"
          }}
        >
          Save
        </button>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDeleteLocation}
        title="Confirm Delete"
        message={`Are you sure you want to delete the location "${locationToDelete?.location.areaName}"? This action cannot be undone.`}
      />

      <ConfirmDialog
        open={showDeleteActionDialog}
        title="Delete Action"
        message={`Are you sure you want to delete "${getQuickControlActionShortLabel(actionToDelete?.action)}" from "${actionToDelete?.location?.areaName}"?`}
        onConfirm={confirmDeleteAction}
        onCancel={() => {
          setShowDeleteActionDialog(false);
          setActionToDelete(null);
        }}
      />

      <ActionChooserModal
        open={Boolean(actionChooser)}
        mode={actionChooser?.mode || 'edit'}
        actions={
          actionChooser != null
            ? locations[actionChooser.locationIdx]?.actions || []
            : []
        }
        buttonColor={ACTION_BLUE}
        onPick={(pick) => {
          if (actionChooser?.mode === 'delete') handleChooserPickDelete(pick);
          else handleChooserPickEdit(pick);
        }}
        onCancel={() => setActionChooser(null)}
      />
    </div>
  );
};

export default CreateQuickControl;