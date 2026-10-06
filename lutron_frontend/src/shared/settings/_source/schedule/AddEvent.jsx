import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import AreaTreeDialog from "../quickcontrols/AreaTreeDialog";
import Action from "../quickcontrols/Action";
import { fetchFloors, selectFloors } from "../../redux/slice/floor/floorSlice";
import { BaseUrl } from "../../BaseUrl";
import { createSchedule, fetchSchedules } from "../../redux/slice/schedule/scheduleSlice"; // <-- Add fetchSchedules import
import { fetchScheduleGroups } from "../../redux/slice/schedule/scheduleSlice";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { UseAuth } from "../../customhooks/UseAuth";
import { selectProfile } from "../../redux/slice/auth/userlogin";

// Add this new zone control component at the top of the file
const ZoneControlCard = ({ zone, values, onChange, disabled }) => {
  const isSwitchType = zone.type === 'switched';
  const isWhitetuneType = zone.type === 'whitetune';
  const isDimmedType = zone.type === 'dimmed';

  const safeValues = values || { on_off: 'Off' };

  if (isSwitchType) {
    const isOn = safeValues.on_off === 'On';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontWeight: 'bold', fontSize: 14, minWidth: 80 }}>
          {zone.name}
        </span>
        <button
          onClick={() => !disabled && onChange({ on_off: isOn ? 'Off' : 'On' })}
          disabled={disabled}
          style={{
            width: 44,
            height: 22,
            borderRadius: 999,
            background: isOn ? 'limegreen' : '#bbb',
            border: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
            position: 'relative',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#fff',
              transform: isOn ? 'translateX(20px)' : 'translateX(0)',
              transition: 'transform 0.2s',
              boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
              position: 'absolute',
              left: 2,
              top: 2,
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: isOn ? 6 : 18,
              color: '#222',
              fontWeight: 700,
              fontSize: 12,
              transition: 'left 0.2s',
            }}
          >
            {isOn ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>
    );
  }

  if (isDimmedType) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        <span style={{ fontWeight: 'bold', fontSize: 14 }}>
          {zone.name}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, minWidth: 60 }}>Brightness:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={safeValues.brightness || 50}
            onChange={(e) => !disabled && onChange({ brightness: Number(e.target.value) })}
            disabled={disabled}
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: 12, minWidth: 30 }}>
            {safeValues.brightness || 50}%
          </span>
        </div>
      </div>
    );
  }

  if (isWhitetuneType) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        <span style={{ fontWeight: 'bold', fontSize: 14 }}>
          {zone.name}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, minWidth: 60 }}>Brightness:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={safeValues.brightness || 50}
            onChange={(e) => !disabled && onChange({ brightness: Number(e.target.value) })}
            disabled={disabled}
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: 12, minWidth: 30 }}>
            {safeValues.brightness || 50}%
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, minWidth: 60 }}>CCT:</span>
          <input
            type="range"
            min="2700"
            max="7000"
            value={safeValues.cct || 2700}
            onChange={(e) => !disabled && onChange({ cct: Number(e.target.value) })}
            disabled={disabled}
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: 12, minWidth: 40 }}>
            {safeValues.cct || 2700}K
          </span>
        </div>
      </div>
    );
  }

  return null;
};

const AddEvent = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const floors = useSelector(selectFloors);
  
  // Get user role and profile for role-based access control
  const { role: currentUserRole } = UseAuth();
  const userProfile = useSelector(selectProfile);
  
  // Add responsive state
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // Add window resize listener for responsive design
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate responsive dimensions
  const isLargeScreen = windowSize.width >= 1920; // 4K and large screens
  const isDesktop = windowSize.width >= 1366; // Desktop screens
  const isLaptop = windowSize.width >= 1024; // Laptop screens
  const buttonColor = 'var(--app-button)';

  // Form state
  const [scheduleName, setScheduleName] = useState("");
  const [scheduleGroup, setScheduleGroup] = useState(""); // Changed from "Schedule Groups" to empty string
  const [scheduleType, setScheduleType] = useState("weekly");
  const [selectedDays, setSelectedDays] = useState(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
  const [timeHours, setTimeHours] = useState("");
  const [timeMinutes, setTimeMinutes] = useState("");
  const [keepUntil, setKeepUntil] = useState("forever");
  const [annualDates, setAnnualDates] = useState([]);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Locations and actions state
  const [locations, setLocations] = useState([]);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [actionDialogIdx, setActionDialogIdx] = useState(null);
  const [selectedActionData, setSelectedActionData] = useState(null);

  // NEW: Add state for common action functionality
  const [showCommonActionDialog, setShowCommonActionDialog] = useState(false);
  const [selectedCommonActionType, setSelectedCommonActionType] = useState('light_status');
  const [selectedOccupancySetting, setSelectedOccupancySetting] = useState(null);
  const [selectedZoneType, setSelectedZoneType] = useState('switched');
  const [lightStatusSettings, setLightStatusSettings] = useState({
    switched: { on_off: 'On' },
    dimmed: { brightness: 50, fadeTime: '02', delayTime: '00' },
    whitetune: { brightness: 50, cct: 2700, fadeTime: '02', delayTime: '00' }
  });

  // --- Add these new states ---
 
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const groupList = useSelector(state => state.schedule.groups);
  const groupLoading = useSelector(state => state.schedule.groupsLoading);
  const groupError = useSelector(state => state.schedule.groupsError);

  // Fetch groups once on mount. Do NOT key off groupList.length — an empty
  // groups[] from the API is valid and would otherwise infinite-loop.
  useEffect(() => {
    dispatch(fetchScheduleGroups());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchFloors());
  }, [dispatch]);

  // Backend already handles floor filtering based on user permissions
  const accessibleFloors = floors;

  // Role-based access control for creating new events based on Excel sheet
  const canCreateSchedule = () => {
    // Superadmin and Admin can always create schedules
    if (currentUserRole === 'Superadmin' || currentUserRole === 'Admin') {
      return true;
    }
    
    // For Operators, check if they have monitor_control_edit permission
    if (currentUserRole === 'Operator' && userProfile && userProfile.floors) {
      const hasMonitorControlEdit = userProfile.floors.some(f => f.floor_permission === 'monitor_control_edit');
      return hasMonitorControlEdit;
    }
    
    return false;
  };

  // Handle day selection
  const handleDayToggle = (day) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

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

  // Delete location
  const handleDelete = (index) => setLocations(prev => prev.filter((_, i) => i !== index));

  // Open action dialog
  const handleOpenActionDialog = (idx) => {
    setActionDialogIdx(idx);
    setSelectedActionData(null);
  };

  // Add action to location
  const handleAddAction = (idx, actionData) => {
    setLocations(prev => prev.map((loc, i) => {
      if (i !== idx) return loc;
      
      // Convert action data to the correct format for the API
      let newAction = actionData;
      
      if (actionData.type === "scene" && actionData.scene) {
        newAction = {
          type: "set_scene",
          scene_code: Number(actionData.scene.id),
          scene_name: actionData.scene.name
        };
      } else if (actionData.type === "zone" && actionData.zone) {
        // Use the same logic as HeatMap for zone actions
        const zone = actionData.zone;
        const values = actionData.values || {};
        
        // Check if this is a simple On/Off for switched zone without zone_id (area-level control)
        if (zone.type === "switched" && 
            (!zone.id || zone.id === null) &&
            values.on_off &&
            !values.brightness &&
            !values.cct) {
          // Use area_status for simple On/Off area control (uses /area/zone_on-off API)
          newAction = {
            type: "area_status",
            area_status: values.on_off
          };
        } else if (zone.type === "switched") {
          newAction = {
            type: "zone_status",
            zone_id: Number(zone.id),
            zone_type: "switched",
            zone_name: zone.name,
            zone_status: values.on_off || "Off"
          };
        } else if (zone.type === "dimmed") {
          newAction = {
            type: "zone_status",
            zone_id: Number(zone.id),
            zone_type: "dimmed",
            zone_name: zone.name,
            zone_status: "On",
            zone_brightness: values.brightness ? (values.brightness.toString().includes('%') ? values.brightness : `${values.brightness}%`) : undefined,
            fade_time: values.fadeTime || "02",
            delay_time: values.delayTime || "00"
          };
        } else if (zone.type === "whitetune") {
          newAction = {
            type: "zone_status",
            zone_id: Number(zone.id),
            zone_type: "whitetune",
            zone_name: zone.name,
            zone_status: "On",
            zone_brightness: values.brightness ? (values.brightness.toString().includes('%') ? values.brightness : `${values.brightness}%`) : undefined,
            zone_temperature: values.cct ? (values.cct.toString().includes('K') ? values.cct : `${values.cct}K`) : undefined,
            fade_time: values.fadeTime || "02",
            delay_time: values.delayTime || "00"
          };
        }
      } else if (actionData.type === "occupancy" && actionData.action) {
        newAction = {
          type: "occupancy",
          occupancy_setting: actionData.action
        };
      } else if (actionData.type === "shade" && actionData.shade) {
        newAction = {
          type: "shade_group_status",
          shade_group_id: Number(actionData.shade.id),
          shade_group_name: actionData.shade.name,
          shade_level: actionData.value.toString().includes('%') ? actionData.value : `${actionData.value}%`
        };
      }
      
      // Remove previous action of the same type and add the new one
      const filtered = (loc.actions || []).filter(a => a.type !== actionData.type);
      return { ...loc, actions: [...filtered, newAction] };
    }));
    setActionDialogIdx(null);
    setSelectedActionData(null);
  };

  // NEW: Handle common action type selection
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

  // NEW: Handle light status type selection
  const handleLightStatusTypeSelect = (type) => {
    setSelectedZoneType(type);
  };

  // NEW: Handle light status setting changes
  const handleLightStatusSettingChange = async (type, setting, value) => {
    // Only update the state, don't apply to locations yet - wait for "Apply to All" button
    setLightStatusSettings(prev => ({
      ...prev,
      [type]: { ...prev[type], [setting]: value }
    }));
  };

  // NEW: Handle occupancy setting selection
  const handleOccupancySettingSelect = (setting) => {
    // Only update the state, don't apply to locations yet - wait for "Apply to All" button
    setSelectedOccupancySetting(setting);
  };

  // NEW: Apply common action to all areas - UPDATED to ensure action is applied
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

  // --- Update handleSave ---
  const handleSave = async () => {
    if (!scheduleName.trim() || locations.length === 0) return;
    
    // Check that all locations have at least one action
    const hasLocationsWithoutActions = locations.some(location => !location.actions || location.actions.length === 0);
    if (hasLocationsWithoutActions) {
      // You might want to add a toast notification here
      alert("All locations must have at least one action before saving.");
      return;
    }

    let schedule_group_id = null;
    let new_schedule_group_name = "";

    if (isCreatingGroup && newGroupName.trim()) {
      new_schedule_group_name = newGroupName.trim();
    } else if (groupList.some(g => String(g.id) === String(scheduleGroup))) {
      schedule_group_id = Number(scheduleGroup);
    }

    // Determine schedule_span - FIXED: Use correct backend values
    let schedule_span = "Forever";
    if (scheduleType === "annual" && annualDates.length > 0) {
      schedule_span = "CustomDates"; // Changed from "Custom" to "CustomDates"
    } else if (keepUntil === "custom" && customStartDate && customEndDate) {
      schedule_span = "CustomDates"; // Changed from "Custom" to "CustomDates"
    }

    // Prepare areas/actions for backend - UPDATED to handle new action format
    const areas = locations.map(loc => ({
      floor_id: loc.floorId,
      area_id: loc.areaId,
      actions: (loc.actions || []).map(action => {
        // Transform actions to backend format
        if (action.type === "scene" && action.scene) {
          return {
            type: "set_scene",
            scene_code: Number(action.scene.id),
            scene_name: action.scene.name
          };
        }
        if (action.type === "zone_status") {
          // Handle zone_status actions (from common action)
          const zoneAction = {
            type: "zone_status",
            zone_id: Number(action.zone_id || 1), // Default to 1 if not specified
            zone_name: action.zone_name || "Zone",
            zone_type: action.zone_type
          };

          // Handle different zone types and values
          if (action.zone_type === "switched") {
            zoneAction.zone_status = action.zone_status || action.switched_state;
          } else if (action.zone_type === "dimmed") {
            zoneAction.zone_status = action.zone_status || "On";
            // Use the actual brightness value from the action
            const brightness = action.zone_brightness || action.level || action.brightness || 50;
            zoneAction.zone_brightness = brightness.toString().includes('%') ? brightness : `${brightness}%`;
          } else if (action.zone_type === "whitetune") {
            zoneAction.zone_status = action.zone_status || "On";
            // Use the actual brightness value from the action
            const brightness = action.zone_brightness || action.level || action.brightness || 50;
            zoneAction.zone_brightness = brightness.toString().includes('%') ? brightness : `${brightness}%`;
            zoneAction.zone_temperature = action.zone_temperature || (action.kelvin ? (action.kelvin.toString().includes('K') ? action.kelvin : `${action.kelvin}K`) : '2700K');
          }

          return zoneAction;
        }
        if (action.type === "zone" && action.zone) {
          // Handle legacy zone actions
          const zoneAction = {
            type: "zone_status",
            zone_id: Number(action.zone.id || action.zone.zone_id),
            zone_name: action.zone.name,
            zone_type: action.zone.type
          };

          if (action.values?.on_off) {
            if (action.values.on_off.toLowerCase() === "off") {
              zoneAction.zone_status = "Off";
            } else {
              zoneAction.zone_status = "On";
              if (action.values?.brightness != null) {
                zoneAction.zone_brightness = action.values.brightness.toString().includes('%') ? action.values.brightness : `${action.values.brightness}%`;
              }
            }
          } else if (action.values?.brightness != null) {
            zoneAction.zone_status = "On";
            zoneAction.zone_brightness = action.values.brightness.toString().includes('%') ? action.values.brightness : `${action.values.brightness}%`;
          } else {
            zoneAction.zone_status = "On";
          }

          if (action.values?.cct != null) {
            zoneAction.zone_temperature = action.values.cct.toString().includes('K') ? action.values.cct : `${action.values.cct}K`;
          }

          return zoneAction;
        }
        if (action.type === "occupancy" && (action.action || action.occupancy_setting)) {
          return {
            type: "occupancy",
            occupancy_setting: action.action || action.occupancy_setting
          };
        }
        if (action.type === "shade" && action.shade) {
          return {
            type: "shade_group_status",
            shade_group_id: Number(action.shade.id || action.shade.zone_id),
            shade_group_name: action.shade.name,
            shade_level: action.value.toString().includes('%') ? action.value : `${action.value}%`
          };
        }
        return action;
      })
    }));

    // Handle dates based on schedule type and keep until setting
    let begin_date, end_date, specific_dates = [];

    if (scheduleType === "annual" && annualDates.length > 0) {
      // For annual dates, convert to specific_dates format
      specific_dates = annualDates.map(dateStr => {
        const [year, month, day] = dateStr.split("-");
        return {
          Day: Number(day),
          Month: Number(month),
          Year: Number(year)
        };
      });
      
      // For specific dates, also set begin_date and end_date based on min/max dates
      if (annualDates.length > 0) {
        const sortedDates = [...annualDates].sort();
        const minDate = sortedDates[0];
        const maxDate = sortedDates[sortedDates.length - 1];
        
        const [minYear, minMonth, minDay] = minDate.split("-");
        const [maxYear, maxMonth, maxDay] = maxDate.split("-");
        
        begin_date = {
          Day: Number(minDay),
          Month: Number(minMonth),
          Year: Number(minYear)
        };
        
        end_date = {
          Day: Number(maxDay),
          Month: Number(maxMonth),
          Year: Number(maxYear)
        };
      }
    } else if (keepUntil === "custom" && customStartDate && customEndDate) {
      // For custom date range
      const [sy, sm, sd] = customStartDate.split("-");
      const [ey, em, ed] = customEndDate.split("-");
      
      if (scheduleType === "weekly") {
        // For weekly schedules with custom date range, use begin_date and end_date
        begin_date = {
          Day: Number(sd),
          Month: Number(sm),
          Year: Number(sy)
        };
        end_date = {
          Day: Number(ed),
          Month: Number(em),
          Year: Number(ey)
        };
        specific_dates = []; // Keep this empty for weekly schedules
      } else {
        // For annual schedules
        begin_date = {
          Day: Number(sd),
          Month: Number(sm),
          Year: Number(sy)
        };
        end_date = {
          Day: Number(ed),
          Month: Number(em),
          Year: Number(ey)
        };
        specific_dates = [];
      }
    } else {
      // For weekly or forever
      begin_date = undefined;
      end_date = undefined;
      specific_dates = [];
    }

    // Determine schedule_span and schedule_type
    let final_schedule_type = "DayOfWeek";
    
    if (scheduleType === "annual" && annualDates.length > 0) {
      schedule_span = "CustomDates";
      final_schedule_type = "SpecificDates";
    } else if (keepUntil === "custom" && customStartDate && customEndDate) {
      schedule_span = "CustomDates";
      if (scheduleType === "annual") {
        final_schedule_type = "SpecificDates";
      }
    }

    // Prepare payload
    const payload = {
      name: scheduleName,
      schedule_group_id,
      new_schedule_group_name,
      schedule_type: final_schedule_type,
      days: scheduleType === "weekly"
        ? selectedDays.reduce((acc, day) => {
            const fullDayMap = {
              'Sun': 'Sunday',
              'Mon': 'Monday',
              'Tue': 'Tuesday',
              'Wed': 'Wednesday',
              'Thu': 'Thursday',
              'Fri': 'Friday',
              'Sat': 'Saturday'
            };
            acc[fullDayMap[day]] = true;
            return acc;
          }, {})
        : {},
      time_of_day: {
        Hour: parseInt(timeHours) || 0,
        Minute: parseInt(timeMinutes) || 0,
        Second: 0
      },
      schedule_span: schedule_span,
      areas,
      ...(begin_date && { begin_date }),
      ...(end_date && { end_date }),
      // Only include specific_dates if it's non-empty
      ...(specific_dates && specific_dates.length > 0 ? { specific_dates } : {})
    };

    try {
      const result = await dispatch(createSchedule(payload)).unwrap();
      
      // Refresh both schedules and groups to ensure new group is included
      await Promise.all([
        dispatch(fetchSchedules()),
        dispatch(fetchScheduleGroups())
      ]);
      
      // Navigate back to schedule list
      navigate('/schedule');
    } catch (error) {
      // Handle error (you might want to show a toast or error message)
    }
  };

  // Cancel: go back to schedule list
  const handleCancel = () => {
    navigate('/schedule'); // Navigate back to schedule page
  };

  // Handler for multi-date selection
  const handleAnnualDateChange = (date) => {
    setAnnualDates(prev =>
      prev.includes(date)
        ? prev.filter(d => d !== date)
        : [...prev, date]
    );
    setKeepUntil("custom");
  };

  // Get min/max for display
  const minAnnual = annualDates.length
    ? annualDates.reduce((min, d) => (new Date(d) < new Date(min) ? d : min), annualDates[0])
    : "";

  const maxAnnual = annualDates.length
    ? annualDates.reduce((max, d) => (new Date(d) > new Date(max) ? d : max), annualDates[0])
    : "";

  const [showAnnualCalendar, setShowAnnualCalendar] = useState(false);
  const [tempAnnualDate, setTempAnnualDate] = useState(null);

  useEffect(() => {
    if (annualDates.length === 0 && keepUntil === "custom" && scheduleType === "annual") {
      setKeepUntil("forever");
    }
  }, [annualDates, keepUntil, scheduleType]);

  const dateInputRef = React.useRef(null);

  // Add function to check if a quick control is used by any schedules
  const isQuickControlUsedBySchedules = (quickControlId) => {
    // This would need to be implemented if you want to check during schedule creation
    // For now, this is a placeholder
    return false;
  };

  // Update the renderActionDisplay function to properly show zone values
  const renderActionDisplay = (action) => {
    // Handle area_status actions (from common action for On/Off)
    if (action.type === "area_status") {
      const status = action.area_status || "Off";
      return <div>Area Status: {status}</div>;
    }
    
    // Handle zone_status actions (for specific zone controls with brightness/temperature)
    if (action.type === "zone_status") {
      const status = action.zone_status || action.switched_state;
      const zoneType = action.zone_type;
      
      // For zone_status with specific zone_id, show zone details
      if (action.zone_id) {
        const zoneName = action.zone_name || `Zone ${action.zone_id}`;
        let displayText = `Zone: ${zoneName}`;
        
        if (zoneType === "switched") {
          const switchedState = action.switched_state || action.zone_status;
          displayText += ` (${switchedState})`;
        } else if (zoneType === "dimmed") {
          const switchedState = action.zone_status || "On";
          let brightnessValue = action.zone_brightness;
          if (brightnessValue && typeof brightnessValue === 'string') {
            brightnessValue = brightnessValue.includes('%') ? brightnessValue : `${brightnessValue}%`;
          }
          if (brightnessValue) {
            displayText += ` (${switchedState}, ${brightnessValue})`;
          } else {
            displayText += ` (${switchedState})`;
          }
        } else if (zoneType === "whitetune") {
          const switchedState = action.zone_status || "On";
          let brightnessValue = action.zone_brightness;
          let temperatureValue = action.zone_temperature;
          
          if (brightnessValue && typeof brightnessValue === 'string') {
            brightnessValue = brightnessValue.includes('%') ? brightnessValue : `${brightnessValue}%`;
          }
          if (temperatureValue && typeof temperatureValue === 'string') {
            temperatureValue = temperatureValue.includes('K') ? temperatureValue : `${temperatureValue}K`;
          }
          
          if (brightnessValue && temperatureValue) {
            displayText += ` (${switchedState}, ${brightnessValue}, ${temperatureValue})`;
          } else if (brightnessValue) {
            displayText += ` (${switchedState}, ${brightnessValue})`;
          } else if (temperatureValue) {
            displayText += ` (${switchedState}, ${temperatureValue})`;
          } else {
            displayText += ` (${switchedState})`;
          }
        } else {
          displayText += ` (${status || "Off"})`;
        }
        
        return <div>{displayText}</div>;
      }
      
      // Fallback for zone_status without zone_id
      return <div>Area Status: {status || "Off"}</div>;
    }
    
    // Handle zone actions from Action component
    if (action.type === "zone" && action.zone) {
      const zoneName = action.zone.name || action.zone.id || 'Zone';
      const zoneType = action.zone.type;
      const values = action.values || {};
      
      let displayText = `Zone: ${zoneName}`;
      
      if (zoneType === "switched") {
        displayText += ` (${values.on_off || "Off"})`;
      } else if (zoneType === "dimmed") {
        // Show brightness if it's set
        if (values.brightness !== undefined) {
          let brightnessValue = values.brightness;
          if (typeof brightnessValue === 'string') {
            // Only add % if it doesn't already exist
            brightnessValue = brightnessValue.includes('%') ? brightnessValue : `${brightnessValue}%`;
          } else {
            brightnessValue = `${brightnessValue}%`;
          }
          displayText += ` (On, ${brightnessValue})`;
        } else {
          displayText += ` (On)`; // Don't show brightness if not set
        }
      } else if (zoneType === "whitetune") {
        // Show both brightness and CCT if they're set
        let brightnessValue = null;
        let cctValue = null;
        
        if (values.brightness !== undefined) {
          brightnessValue = values.brightness;
          if (typeof brightnessValue === 'string') {
            brightnessValue = brightnessValue.includes('%') ? brightnessValue : `${brightnessValue}%`;
          } else {
            brightnessValue = `${brightnessValue}%`;
          }
        }
        
        if (values.cct !== undefined) {
          cctValue = values.cct;
          if (typeof cctValue === 'string') {
            cctValue = cctValue.includes('K') ? cctValue : `${cctValue}K`;
          } else {
            cctValue = `${cctValue}K`;
          }
        }
        
        if (brightnessValue && cctValue) {
          displayText += ` (On, ${brightnessValue}, ${cctValue})`;
        } else if (brightnessValue) {
          displayText += ` (On, ${brightnessValue})`;
        } else if (cctValue) {
          displayText += ` (On, ${cctValue})`;
        } else {
          displayText += ` (On)`; // Don't show values if not set
        }
      } else {
        // Generic zone handling
        if (values.on_off === "Off") {
          displayText += " (Off)";
        } else {
          displayText += " (On)";
          if (values.brightness !== undefined) {
            let brightnessValue = values.brightness;
            if (typeof brightnessValue === 'string') {
              brightnessValue = brightnessValue.includes('%') ? brightnessValue : `${brightnessValue}%`;
            } else {
              brightnessValue = `${brightnessValue}%`;
            }
            displayText += `, ${brightnessValue}`;
          }
          if (values.cct !== undefined) {
            let cctValue = values.cct;
            if (typeof cctValue === 'string') {
              cctValue = cctValue.includes('K') ? cctValue : `${cctValue}K`;
            } else {
              cctValue = `${cctValue}K`;
            }
            displayText += `, ${cctValue}`;
          }
        }
      }
      
      return <div>{displayText}</div>;
    }
    
    // Handle occupancy actions (from common action)
    if (action.type === "occupancy") {
      let occLabel = "";
      if (action.occupancy_setting) {
        const setting = action.occupancy_setting;
        if (setting.toLowerCase() === "disabled") occLabel = "Disabled";
        else if (setting.toLowerCase() === "auto") occLabel = "Auto";
        else if (setting.toLowerCase() === "vacancy") occLabel = "Vacancy";
        else occLabel = setting;
      }
      return <div>Occupancy Setting: {occLabel}</div>;
    }
    
    // Handle other action types
    if (action.type === "scene" && action.scene) {
      return <div>Scene: {action.scene.name}</div>;
    }
    
    if (action.type === "set_scene") {
      return <div>Scene: {action.scene_name}</div>;
    }
    
    if (action.type === "shade" && action.shade) {
      return (
        <div>
          Shade: {action.shade.name} ({action.value}% Open)
        </div>
      );
    }
    
    if (action.type === "shade_group_status") {
      let shadeLevel = action.shade_level;
      if (typeof shadeLevel === "string") {
        // Only add % if it doesn't already exist
        shadeLevel = shadeLevel.includes('%') ? shadeLevel : `${shadeLevel}%`;
      }
      return <div>Shade: {action.shade_group_name} ({shadeLevel})</div>;
    }
    
    if (action.type === "device" && action.device) {
      return <div>Device: {action.device.name}</div>;
    }
    
    return <div>Unknown action</div>;
  };

  // Note: We'll show the form but disable it based on permissions

  return (
    <div style={{
      padding: isLargeScreen ? 40 : isDesktop ? 32 : 24,
      borderRadius: 20,
      minHeight:500,
      display: "flex",
      gap: isLargeScreen ? 32 : isDesktop ? 24 : 20,
      alignItems: "flex-start",
      position: "relative",
      overflow: "hidden", // Prevent overflow
      maxWidth: isLargeScreen ? 1600 : isDesktop ? 1400 : 1200,     // Keep within main container
      margin: "0 auto",
      opacity: canCreateSchedule() ? 1 : 0.6,
      pointerEvents: canCreateSchedule() ? "auto" : "none"
    }}>
      {/* Permission Notice for Disabled State */}
      {!canCreateSchedule() && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(255, 255, 255, 0.8)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          borderRadius: 20
        }}>
          <h3 style={{ color: "#666", marginBottom: 8 }}>Access Restricted</h3>
          <p style={{ color: "#888", textAlign: "center", marginBottom: 16 }}>
            You don't have permission to create new schedules.
          </p>
          <button
            onClick={() => navigate('/schedule')}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "none",
              background: buttonColor,
              color: "#fff",
              fontWeight: 500,
              cursor: "pointer"
            }}
          >
            Back to Schedule List
          </button>
        </div>
      )}
      {/* Left Column - Schedule Details */}
      <div style={{
        flex: "0 1 400px",
        minWidth: isLargeScreen ? 380 : isDesktop ? 360 : 340,
        maxWidth: isLargeScreen ? 480 : isDesktop ? 440 : 420,
        padding: 0
      }}>
      
        
        {/* Schedule Name */}
        <div style={{ marginBottom: isLargeScreen ? 15 : isDesktop ? 12 : 10}}>
          <label style={{ 
            fontWeight: 500, 
            color: 'black', 
            display: 'block', 
            marginBottom: isLargeScreen ? 10 : 8,
            fontSize: isLargeScreen ? 16 : isDesktop ? 15 : 14
          }}>
            Schedule Name
          </label>
          <input
            type="text"
            value={scheduleName}
            onChange={e => setScheduleName(e.target.value)}
            placeholder="Schedule Name"
            style={{
              width: '100%',
              padding: isLargeScreen ? 14 : isDesktop ? 13 : 12,
              borderRadius: 8,
              border: '1px solid #ccc',
              fontSize: isLargeScreen ? 16 : isDesktop ? 15 : 14
            }}
          />
        </div>

        {/* Part of */}
        <div style={{ marginBottom: isLargeScreen ? 15 : isDesktop ? 12 : 10 }}>
          <label style={{ 
            fontWeight: 500, 
            color: 'black', 
            display: 'block', 
            marginBottom: isLargeScreen ? 10 : 8,
            fontSize: isLargeScreen ? 16 : isDesktop ? 15 : 14
          }}>
            Part Of
          </label>
          <select
            value={isCreatingGroup ? "create_new" : scheduleGroup}
            onChange={e => {
              if (e.target.value === "create_new") {
                setIsCreatingGroup(true);
                setScheduleGroup(""); // Clear selection
              } else {
                setIsCreatingGroup(false);
                setScheduleGroup(e.target.value);
                setNewGroupName(""); // Clear new group name if switching back
              }
            }}
            style={{
              width: '100%',
              padding: isLargeScreen ? 14 : isDesktop ? 13 : 12,
              borderRadius: 8,
              border: '1px solid #ccc',
              fontSize: isLargeScreen ? 16 : isDesktop ? 15 : 14,
              backgroundColor: 'white'
            }}
          >
            {/* <option value="">Select Group</option> */}
            {groupList && groupList.length > 0 ? (
              groupList.map(group => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))
            ) : (
              <option value="" disabled>No groups available</option>
            )}
            <option value="create_new">+ Create New Group</option>
          </select>
          {isCreatingGroup && (
            <div style={{ marginTop: 8 }}>
              <input
                type="text"
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                placeholder="Enter new group name"
                style={{
                  width: '100%',
                  padding: 10,
                  borderRadius: 6,
                  border: '1px solid #ccc',
                  fontSize: 14,
                  marginBottom: 4
                }}
              />
            </div>
          )}
          {groupLoading && <div style={{ color: 'black', fontSize: 14, marginTop: 4 }}>Loading groups...</div>}
          {groupError && <div style={{ color: "red", fontSize: 14, marginTop: 4 }}>{groupError}</div>}
        </div>

        {/* Grouped Card for Day/Date, Time, Keep Until */}
        <div style={{
          background: 'white',
          borderRadius: 12,
          padding: isLargeScreen ? 24 : isDesktop ? 20 : 18,
          marginBottom: 0,
          marginTop: isLargeScreen ? 24 : isDesktop ? 20 : 18,
          display: "flex",
          flexDirection: "column",
          gap: isLargeScreen ? 24 : isDesktop ? 20 : 18
        }}>
          {/* Select Day / Date */}
          <div style={{ backgroundColor: '#807864', padding: 5, borderRadius: 5 }}>
            <label style={{ fontWeight: 500, fontSize: 14, color: 'white', display: 'block', marginBottom: 5 }}>
              Select Day / Date
            </label>
            <div style={{ display: 'flex', fontSize: 14, gap: 10, marginBottom: 12, alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', color: 'white', marginRight: 10 }}>
                <input
                  type="radio"
                  value="weekly"
                  checked={scheduleType === "weekly"}
                  onChange={e => setScheduleType(e.target.value)}
                  style={{ marginRight: 8 }}
                />
                Weekly
              </label>
              <label style={{ display: 'flex', fontSize: 14, alignItems: 'center', color: 'white', marginRight: 6 }}>
                <input
                  type="radio"
                  value="annual"
                  checked={scheduleType === "annual"}
                  onChange={e => setScheduleType(e.target.value)}
                  style={{ marginRight: 8 }}
                />
                Fixed Dates
              </label>
              {scheduleType === "annual" && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowAnnualCalendar(true)}
                    style={{
                      marginLeft: 4,
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      border: "1px solid #a89c81",
                      background: "#f7f4ed",
                      color: buttonColor,
                      fontWeight: 700,
                      fontSize: 16,
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer"
                    }}
                  >+</button>
                </>
              )}
            </div>
            {scheduleType === "weekly" && (
              <div style={{ display: 'flex', gap: 5, marginBottom: 0, flexWrap: 'wrap' }}>
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                  <button
                    key={day}
                    onClick={() =>
                      setSelectedDays(prev =>
                        prev.includes(day)
                          ? prev.filter(d => d !== day)
                          : [...prev, day]
                      )
                    }
                    style={{
                      padding: '5px 10px',
                      borderRadius: 6,
                      border: '1px solid #ccc',
                      background: selectedDays.includes(day) ? buttonColor : 'white',
                      color: selectedDays.includes(day) ? 'white' : buttonColor,
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 500,
                      minWidth: '40px'
                    }}
                  >
                    {day}
                  </button>
                ))}
              </div>
            )}
            {scheduleType === "annual" && annualDates.length > 0 && (
              <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {annualDates.map(date => (
                  <span
                    key={date}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      background: buttonColor,
                      color: "#fff",
                      borderRadius: 16,
                      padding: "2px 10px 2px 10px",
                      fontSize: 13,
                      fontWeight: 500,
                      marginRight: 2,
                      marginBottom: 2,
                      minWidth: 60,
                      height: 24,
                      position: "relative"
                    }}
                  >
                    {date}
                    <span
                      onClick={() =>
                        setAnnualDates(prev => prev.filter(d => d !== date))
                      }
                      style={{
                        marginLeft: 6,
                        cursor: "pointer",
                        fontWeight: 700,
                        fontSize: 13,
                        color: "#fff",
                        background: "#a89c81",
                        borderRadius: "50%",
                        width: 16,
                        height: 16,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: -1
                      }}
                      title="Remove"
                    >×</span>
                  </span>
                ))}
              </div>
            )}
          </div>

                     {/* Select Time */}
           <div style={{backgroundColor:'#807864',padding:5,borderRadius:5}}>
             <label style={{ fontWeight: 500,  fontSize:14,color: 'white', display: 'block', marginBottom: 8 }}>
             Time
             </label>
             <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
               <input
                 type="text"
                 value={timeHours}
                 onChange={e => {
                   const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                   if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 23)) {
                     setTimeHours(val);
                   }
                 }}
                 maxLength={2}
                 placeholder="HH"
                 style={{
                   width: 60,
                   padding: 8,
                   borderRadius: 4,
                   border: '1px solid #ccc',
                   textAlign: 'center',
                  background: "#fff",
                  color: buttonColor
                 }}
               />
               <span style={{ color: 'white', fontSize: 18 }}>:</span>
               <input
                 type="text"
                 value={timeMinutes}
                 onChange={e => {
                   const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                   if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 59)) {
                     setTimeMinutes(val);
                   }
                 }}
                 maxLength={2}
                 placeholder="MM"
                 style={{
                   width: 60,
                   padding: 8,
                   borderRadius: 4,
                   border: '1px solid #ccc',
                   textAlign: 'center',
                  background: "#fff",
                  color: buttonColor
                 }}
               />
             </div>
           </div>

          {/* Keep Until */}
          <div style={{ backgroundColor: '#807864', padding: 5, borderRadius: 5, marginTop: 18 }}>
            <label style={{ fontWeight: 500, fontSize: 14, color: 'white', display: 'block', marginBottom: 8 }}>
              Keep Until
            </label>
            <div style={{ display: 'flex', gap: 16 }}>
              <label style={{ display: 'flex', fontSize: 14, alignItems: 'center', color: 'white' }}>
                <input
                  type="radio"
                  value="forever"
                  checked={keepUntil === "forever" && annualDates.length === 0}
                  onChange={e => setKeepUntil(e.target.value)}
                  style={{ 
                    marginRight: 8,
                    accentColor: buttonColor
                  }}
                  disabled={annualDates.length > 0}
                />
                Forever
              </label>
              <label style={{ display: 'flex', fontSize: 14, alignItems: 'center', color: 'white' }}>
                <input
                  type="radio"
                  value="custom"
                  checked={keepUntil === "custom" || annualDates.length > 0}
                  onChange={e => setKeepUntil(e.target.value)}
                  style={{ 
                    marginRight: 8,
                    accentColor: buttonColor
                  }}
                />
                Custom Dates
              </label>
            </div>
            {/* Custom Date Display - Only show when Custom Dates is selected */}
            {(keepUntil === "custom" || annualDates.length > 0) && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                {annualDates.length > 0 ? (
                  (() => {
                    const sorted = [...annualDates].sort();
                    const minDate = sorted[0];
                    const maxDate = sorted[sorted.length - 1];
                    return (
                      <>
                        <div
                          style={{
                            padding: '8px 12px',
                            borderRadius: 6,
                            border: '1px solid #ccc',
                            fontSize: 14,
                            background: 'white',
                            color: buttonColor,
                            minWidth: 120,
                            textAlign: "center"
                          }}
                        >
                          {minDate}
                        </div>
                        <span style={{ color: 'white', alignSelf: 'center' }}>to</span>
                        <div
                          style={{
                            padding: '8px 12px',
                            borderRadius: 6,
                            border: '1px solid #ccc',
                            fontSize: 14,
                            background: 'white',
                            color: buttonColor,
                            minWidth: 120,
                            textAlign: "center"
                          }}
                        >
                          {maxDate}
                        </div>
                      </>
                    );
                  })()
                ) : (
                  <>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={e => setCustomStartDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 6,
                        border: '1px solid #ccc',
                        fontSize: 14,
                        background: 'white',
                        color: buttonColor,
                        minWidth: 120
                      }}
                      placeholder="Start Date"
                    />
                    <span style={{ color: 'white', alignSelf: 'center' }}>to</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={e => setCustomEndDate(e.target.value)}
                      min={customStartDate || new Date().toISOString().split('T')[0]}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 6,
                        border: '1px solid #ccc',
                        fontSize: 14,
                        background: 'white',
                        color: buttonColor,
                        minWidth: 120
                      }}
                      placeholder="End Date"
                    />
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Calendar positioned outside the form container */}
      {showAnnualCalendar && (
        <div style={{
          position: "absolute",
          top: 200, // Adjust this value to position next to the button
          left: 450, // Position it to the right of the left column
          zIndex: 1000,
          background: "white",
          borderRadius: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          border: "1px solid #ccc",
          padding: 8
        }}>
          <DatePicker
            selected={null}
            onChange={date => {
              const dateStr = format(date, "yyyy-MM-dd");
              setAnnualDates(prev =>
                prev.includes(dateStr)
                  ? prev // Do nothing if already selected
                  : [...prev, dateStr]
              );
              setKeepUntil("custom");
              setShowAnnualCalendar(false); // Close calendar after selection
            }}
            highlightDates={annualDates.map(d => new Date(d))}
            minDate={new Date()} // Changed to current date to disable past dates
            maxDate={new Date(2100, 11, 31)}
            onClickOutside={() => setShowAnnualCalendar(false)}
            inline={true}
            onCalendarClose={() => setShowAnnualCalendar(false)}
          />
        </div>
      )}

      {/* Right Column - Locations and Actions */}
      <div style={{
        flex: 1,
        minWidth: 0,
        padding: 25,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        height: "100%",
        overflow: "hidden",
        maxWidth: isLargeScreen ? 800 : isDesktop ? 700 : 600
      }}>
        {/* Table-like header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          fontWeight: 500,
          color: 'white',
          borderBottom: '1px solid #ccc',
          paddingBottom: isLargeScreen ? 12 : isDesktop ? 10 : 8,
          marginBottom: isLargeScreen ? 12 : isDesktop ? 10 : 8,
          fontSize: isLargeScreen ? 17 : isDesktop ? 16 : 15,
          ml: 10
        }}>
          <span
            style={{ flex: 2, cursor: 'pointer', textAlign: 'left', minWidth: 120 }}
            onClick={() => setShowLocationDialog(true)}
          >
            + Add Location
          </span>
          <span style={{ flex: 2, textAlign: 'left', minWidth: 100 }}>Add Action</span>
          <span
            style={{ 
              flex: 1, 
              cursor: 'pointer', 
              textAlign: 'start', 
              minWidth: 160,
              whiteSpace: 'nowrap',
              marginLeft: 15
            }}
            onClick={() => setShowCommonActionDialog(true)}
          >
            + Add Common Action
          </span>
        </div>

        {/* Table-like list of locations and actions */}
        <div>
          {locations.map((loc, idx) => {
            const locationText = `${loc.floorName} / ${loc.areaName}`;
            const isLongName = locationText.length > 40; // Updated threshold to 40 characters
            
            return (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'flex-start',
                borderBottom: '1px solid #b2a98b',
                padding: '8px 0',
                minHeight: isLongName ? '60px' : '40px' // Increase height for long names
              }}>
                {/* Location - Updated to handle long names */}
                <div style={{ 
                  flex: '0 0 280px', // Reduced from 300px to give more space for actions
                  fontSize: 15, 
                  color: '#fff', 
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  paddingRight: '10px' // Add some padding
                }}>
                  {isLongName ? (
                    // Show in 2 lines for long names
                    <div style={{ 
                      lineHeight: '1.3',
                      wordBreak: 'break-word',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {locationText}
                    </div>
                  ) : (
                    // Show in single line for short names
                    <div style={{ 
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {locationText}
                    </div>
                  )}
                </div>
                {/* Actions - Updated to have more space */}
                <div style={{ 
                  flex: 1, 
                  fontSize: 15, 
                  color: '#fff', 
                  textAlign: 'left', 
                  minWidth: 120, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '4px',
                  marginLeft: '10px' // Reduced negative margin
                }}>
                  {(loc.actions && loc.actions.length > 0)
                    ? loc.actions.map((a, i) => (
                        <div key={i} style={{ marginBottom: '4px' }}>
                          {renderActionDisplay(a)}
                        </div>
                      ))
                    : <button
                        style={{
                          color: 'white',
                          padding: '5px 10px',
                          borderRadius: 2,
                          border: '1px solid #888',
                          background: buttonColor,
                          cursor: 'pointer',
                          fontSize: '12px',
                          alignSelf: 'flex-start',
                          marginLeft: 0,
                          whiteSpace: 'nowrap'
                        }}
                        onClick={() => handleOpenActionDialog(idx)}
                      >
                        Add Action
                      </button>
                  }
                </div>
                {/* Delete button - Ensure it's always visible */}
                <div style={{ 
                  flex: '0 0 50px', // Fixed width to ensure visibility
                  textAlign: 'right', 
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-end',
                  paddingLeft: '10px'
                }}>
                  <button
                    onClick={() => handleDelete(idx)}
                    style={{
                      background: buttonColor,
                      border: 'none',
                      borderRadius: 4,
                      color: '#fff',
                      padding: '6px 10px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      minWidth: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {/* Move the buttons here, right-aligned */}
        <div style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: isLargeScreen ? 20 : isDesktop ? 18 : 16,
          marginTop: isLargeScreen ? 40 : isDesktop ? 35 : 32
        }}>
          <button
            onClick={handleCancel}
            style={{
              padding: isLargeScreen ? "12px 32px" : isDesktop ? "11px 30px" : "10px 28px",
              borderRadius: 8,
              border: "none",
              background: buttonColor,
              color: "#fff",
              fontWeight: 500,
              fontSize: isLargeScreen ? 16 : isDesktop ? 15 : 14,
              cursor: "pointer"
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!scheduleName.trim() || locations.length === 0 || locations.some(location => !location.actions || location.actions.length === 0)}
            style={{
              padding: isLargeScreen ? "12px 32px" : isDesktop ? "11px 30px" : "10px 28px",
              borderRadius: 8,
              border: "none",
              background: (scheduleName.trim() && locations.length > 0 && !locations.some(location => !location.actions || location.actions.length === 0)) ? buttonColor : "#888",
              color: "#fff",
              fontWeight: 500,
              fontSize: isLargeScreen ? 16 : isDesktop ? 15 : 14,
              cursor: (scheduleName.trim() && locations.length > 0 && !locations.some(location => !location.actions || location.actions.length === 0)) ? "pointer" : "not-allowed"
            }}
          >
            Save
          </button>
        </div>
      </div>

      {/* Action Dialog */}
      {actionDialogIdx !== null && (
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
            <div style={{ marginBottom: 16, fontWeight: 600, fontSize: 18, color: buttonColor }}>
              Add Action
            </div>
            <Action
              areaId={locations[actionDialogIdx]?.areaId}
              onActionSelect={action => setSelectedActionData(action)}
            />
            <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  if (selectedActionData && selectedActionData.type) {
                    handleAddAction(actionDialogIdx, selectedActionData);
                  }
                }}
                disabled={!selectedActionData || !selectedActionData.type || (selectedActionData.type === "scene" && !selectedActionData.scene)}
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
              {/* <div style={{ fontWeight: 600, marginBottom: 8 }}>Select Action Type</div> */}
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
                    <label style={{ display: 'flex', alignItems: 'center', color: 'white' }}>
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
                    <label style={{ display: 'flex', alignItems: 'center', color: 'white' }}>
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
                  background: "#ffffff",
                  color: buttonColor,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Area Tree Dialog */}
      <AreaTreeDialog
        open={showLocationDialog}
        onClose={() => setShowLocationDialog(false)}
        onAdd={handleAddLocations}
        accessibleFloors={accessibleFloors}
      />
    </div>
  );
};

export default AddEvent;