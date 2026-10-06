import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AreaTreeDialog from "./AreaTreeDialog";
import Action from "./Action";
import { fetchFloors, selectFloors } from "../../redux/slice/floor/floorSlice";
import { selectAreaScenes } from "../../redux/slice/settingsslice/heatmap/areaSettingsSlice";
import { createQuickControl, fetchQuickControls } from "../../redux/slice/quickcontrols/quickControlSlice";
import { useNavigate } from "react-router-dom";
import { ConfirmDialog } from "../../utils/FeedbackUI";
import { UseAuth } from "../../customhooks/UseAuth";
import { selectProfile } from "../../redux/slice/auth/userlogin";
import { selectApplicationTheme } from "../../redux/slice/theme/themeSlice";
import { BaseUrl } from "../../BaseUrl";

const CreateQuickControl = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const floors = useSelector(selectFloors);
  const areaScenes = useSelector(selectAreaScenes);
  const appTheme = useSelector(selectApplicationTheme);
  const buttonColor = appTheme?.application_theme?.button || '#232323';
  
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
  
  // Add confirmation dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState(null);

  // New state for common action functionality
  const [showCommonActionDialog, setShowCommonActionDialog] = useState(false);
  const [selectedCommonActionType, setSelectedCommonActionType] = useState('light_status');
  const [selectedOccupancySetting, setSelectedOccupancySetting] = useState(null);
  const [selectedZoneType, setSelectedZoneType] = useState('switched');
  const [lightStatusSettings, setLightStatusSettings] = useState({
    switched: { on_off: 'On' },
    dimmed: { brightness: 50, fadeTime: '02', delayTime: '00' },
    whitetune: { brightness: 50, cct: 2700, fadeTime: '02', delayTime: '00' }
  });

  useEffect(() => {
    dispatch(fetchFloors());
  }, [dispatch]);

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
    setActionDialogIdx(idx);
    setSelectedActionData(null);
  };

  // Add action to location
  const handleAddAction = (idx, actionData) => {
    setLocations(prev => prev.map((loc, i) => {
      if (i !== idx) return loc;

      let newAction = actionData;

      // Normalize shade action to shade_group_status
      if (actionData.type === "shade" && actionData.shade) {
        newAction = {
          type: "shade_group_status",
          shade_group_id: actionData.shade.id || actionData.shade.zone_id,
          shade_group_name: actionData.shade.name,
          shade_level: Number(actionData.value) // value should be 0-100, 0=closed, 100=open
        };
      }

      // Remove previous action of the same type
      const filtered = (loc.actions || []).filter(a => a.type !== newAction.type);
      return { ...loc, actions: [...filtered, newAction] };
    }));
    setActionDialogIdx(null);
    setSelectedActionData(null);
  };

  
  // Save quick control (call backend)
  const handleSave = async () => {
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
        actions: loc.actions.map(action => {
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
            return {
              type: "shade_group_status",
              shade_group_id: Number(action.shade_group_id),
              shade_group_name: action.shade_group_name,
              shade_level: `${action.shade_level}%`
            };
          }
          // Default: return as is
          return action;
        })
      }))
    };


    try {
      await dispatch(createQuickControl(payload));
      await dispatch(fetchQuickControls()); // <-- Ensure the list is refreshed
      navigate("/quickcontrols");
    } catch (error) {
      // Failed to create quick control
    }
  };

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
      setShowCommonActionDialog(false);
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
        actions: [commonAction]
      })));
    } else if (selectedCommonActionType === 'occupancy' && selectedOccupancySetting) {
      const commonAction = {
        type: "occupancy",
        occupancy_setting: selectedOccupancySetting
      };
      
      setLocations(prev => prev.map(location => ({
        ...location,
        actions: [commonAction]
      })));
    }
    
    // Close the dialog and reset
    setShowCommonActionDialog(false);
    setSelectedCommonActionType('light_status');
    setSelectedOccupancySetting(null);
    setSelectedZoneType('switched');
  };

  // Don't auto-apply when dialog opens - wait for "Apply to All" button

  return (
    <div style={{ padding: 40,  borderRadius: 20, minHeight: 500 }}>
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontWeight: 500, color: 'white' }}>Quick Control Name</label>
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
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        fontWeight: 500,
        borderBottom: '1px solid #ccc',
        paddingBottom: 8,
        gap: 16
      }}>
        <span style={{ cursor: 'pointer' }} onClick={() => setShowLocationDialog(true)}>+ Add Location</span>
        <span>Add Action</span>
        <span style={{ cursor: 'pointer' }} onClick={() => setShowCommonActionDialog(true)}>+ Add Common Action</span>
      </div>
      {locations.map((loc, idx) => (
        <div key={idx} style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 0',
          color: 'white',
          borderBottom: '1px solid #b2a98b'
        }}>
          <span style={{ minWidth: 220 }}>{loc.floorName} {'>'} {loc.areaName}</span>
          <span style={{ minWidth: 220 }}>
            {(loc.actions && loc.actions.length > 0)
              ? loc.actions.map((a, i) => {
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
                })
              : <button
                  style={{
                    color: 'white',
                    padding: '5px 10px',
                    borderRadius: 2,
                    border: '1px solid #888',
                    background: buttonColor,
                    cursor: 'pointer'
                  }}
                  onClick={() => handleOpenActionDialog(idx)}
                >Add Action</button>
            }
          </span>
          <span>
            <button
              onClick={() => handleDelete(idx)}
              style={{
                background: buttonColor,
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
                background: "#CDC0A0",
                borderRadius: 18,
                padding: 28,
                minWidth: 340,
                boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                position: "relative",
                color: buttonColor
              }}>
                <div style={{ marginBottom: 16, fontWeight: 600, fontSize: 18, color: buttonColor }}>Add Action</div>
                <Action
                  areaId={loc.areaId}
                  onActionSelect={action => setSelectedActionData(action)}
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
                      border: "none",
                      background: (selectedActionData && selectedActionData.type && (selectedActionData.type !== "scene" || selectedActionData.scene)) ? buttonColor : "#888",
                      color: "#fff",
                      fontWeight: 500,
                      cursor: (selectedActionData && selectedActionData.type && (selectedActionData.type !== "scene" || selectedActionData.scene)) ? "pointer" : "not-allowed"
                    }}
                  >
                    Add Action
                  </button>
                  <button
                    onClick={() => { setActionDialogIdx(null); setSelectedActionData(null); }}
                    style={{
                      padding: "10px 28px",
                      borderRadius: 8,
                      border: `1px solid ${buttonColor}`,
                      background: "#fff",
                      color: buttonColor,
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
            background: "#CDC0A0",
            borderRadius: 18,
            padding: 28,
            minWidth: 400,
            maxWidth: 600,
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
            position: "relative",
            color: buttonColor
          }}>
            <div style={{ marginBottom: 16, fontWeight: 600, fontSize: 18, color: buttonColor }}>
              Add Common Action
            </div>
            
            {/* Action Type Dropdown */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Select Action Type</div>
              <select
                value={selectedCommonActionType}
                onChange={(e) => handleCommonActionTypeSelect(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid #ccc",
                  background: "white",
                  fontSize: 14
                }}
              >
                <option value="light_status">Light Status</option>
                <option value="occupancy">Occupancy Setting</option>
              </select>
            </div>

            {/* Light Status Options */}
            {selectedCommonActionType === 'light_status' && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Light Status (On/Off)</div>
                
                {/* Simplified: Only On/Off options */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Light State</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <label style={{ display: 'flex', alignItems: 'center', color: buttonColor }}>
                      <input
                        type="radio"
                        value="On"
                        checked={lightStatusSettings.switched.on_off === 'On'}
                        onChange={(e) => handleLightStatusSettingChange('switched', 'on_off', e.target.value)}
                        style={{ 
                          marginRight: 8,
                          accentColor: '#000000',
                          WebkitAppearance: 'none',
                          appearance: 'none',
                          width: '12px',
                          height: '12px',
                          border: '2px solid #ccc',
                          borderRadius: '50%',
                          backgroundColor: lightStatusSettings.switched.on_off === 'On' ? '#000000' : 'transparent',
                          position: 'relative'
                        }}
                      />
                      On
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', color: buttonColor }}>
                      <input
                        type="radio"
                        value="Off"
                        checked={lightStatusSettings.switched.on_off === 'Off'}
                        onChange={(e) => handleLightStatusSettingChange('switched', 'on_off', e.target.value)}
                        style={{ 
                          marginRight: 8,
                          accentColor: '#000000',
                          WebkitAppearance: 'none',
                          appearance: 'none',
                          width: '12px',
                          height: '12px',
                          border: '2px solid #ccc',
                          borderRadius: '50%',
                          backgroundColor: lightStatusSettings.switched.on_off === 'Off' ? '#000000' : 'transparent',
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
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Occupancy Setting</div>
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
                        background: selectedOccupancySetting === setting ? buttonColor : "#fff",
                        color: selectedOccupancySetting === setting ? "#fff" : buttonColor,
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
                  border: "none",
                  background: (selectedCommonActionType && 
                    (selectedCommonActionType !== 'occupancy' || selectedOccupancySetting) &&
                    (selectedCommonActionType !== 'light_status' || selectedZoneType)) ? buttonColor : "#888",
                  color: "#fff",
                  fontWeight: 500,
                  cursor: (selectedCommonActionType && 
                    (selectedCommonActionType !== 'occupancy' || selectedOccupancySetting) &&
                    (selectedCommonActionType !== 'light_status' || selectedZoneType)) ? "pointer" : "not-allowed"
                }}
              >
                Apply to All
              </button>
              <button
                onClick={() => { 
                  setShowCommonActionDialog(false); 
                  setSelectedCommonActionType('light_status'); 
                  setSelectedOccupancySetting(null);
                  setSelectedZoneType('switched');
                }}
                style={{
                  padding: "10px 28px",
                  borderRadius: 8,
                  border: `1px solid ${buttonColor}`,
                  background: "#fff",
                  color: buttonColor,
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

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 32, gap: 16 }}>
        <button
          onClick={handleCancel}
          style={{
            padding: "10px 28px",
            borderRadius: 8,
            border: "none",
            background: buttonColor,
            color: "#fff",
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
            border: "none",
            background: (quickControlName.trim() && locations.length > 0 && !locations.some(location => !location.actions || location.actions.length === 0)) ? buttonColor : "#888",
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
    </div>
  );
};

export default CreateQuickControl;