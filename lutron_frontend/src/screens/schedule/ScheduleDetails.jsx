import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchScheduleDetails,
  updateSchedule,
  deleteSchedule,
  triggerSchedule,
  createSchedule,
  fetchScheduleGroups,
  enableSchedule, // Add enable/disable imports
  disableSchedule,
  fetchSchedules // Added fetchSchedules import
} from "../../redux/slice/schedule/scheduleSlice";
import { ConfirmDialog, Toast } from "../../utils/FeedbackUI";
import AreaTreeDialog from "../quickcontrols/AreaTreeDialog";
import Action from "../quickcontrols/Action";
import { fetchFloors, selectFloors } from "../../redux/slice/floor/floorSlice";
import { UseAuth } from "../../customhooks/UseAuth";
import { selectProfile } from "../../redux/slice/auth/userlogin";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { BaseUrl } from "../../BaseUrl";

function getEventIdForStatus(event) {
  if (!event) return "";
  if (event.id) return String(event.id);
  if (event.timeclock_id) return String(event.timeclock_id);
  if (event.href && event.href.includes("/")) return event.href.split('/').pop();
  return "";
}

const daysArray = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const fullDaysArray = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ScheduleDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
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

  const {
    selectedScheduleDetails: event,
    selectedScheduleAreas: areas,
    detailsLoading: isLoading,
    updateStatus,
    deleteStatus,
    triggerStatus,
    status, // Add status from Redux state
    toggleLoading, // Add toggle loading state
    detailsError // Add detailsError from Redux state
  } = useSelector((state) => state.schedule);

  // Fetch groups from Redux
  const groups = useSelector((state) => state.schedule.groups);
  const groupsLoading = useSelector((state) => state.schedule.groupsLoading);

  // Fetch floors from Redux
  const floors = useSelector(selectFloors);

  // Fetch groups on mount if not already loaded
  useEffect(() => {
    if (!groups || groups.length === 0) {
      dispatch(fetchScheduleGroups());
    }
  }, [dispatch, groups]);

  // Fetch floors on mount
  useEffect(() => {
    dispatch(fetchFloors());
  }, [dispatch]);

  const [editMode, setEditMode] = useState(false);
  const [isCopyMode, setIsCopyMode] = useState(false);
  const [editableEvent, setEditableEvent] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "" });
  
  // Add confirmation dialog states for delete operations
  const [showDeleteScheduleDialog, setShowDeleteScheduleDialog] = useState(false);
  const [showDeleteLocationDialog, setShowDeleteLocationDialog] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState(null);

  // Form state for editing
  const [scheduleName, setScheduleName] = useState("");
  const [scheduleGroup, setScheduleGroup] = useState("");
  const [scheduleType, setScheduleType] = useState("weekly");
  const [selectedDays, setSelectedDays] = useState([]);
  const [timeHours, setTimeHours] = useState("");
  const [timeMinutes, setTimeMinutes] = useState("");
  const [keepUntil, setKeepUntil] = useState("forever");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [specificDates, setSpecificDates] = useState([]);

  // Locations and actions state
  const [locations, setLocations] = useState([]);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [actionDialogIdx, setActionDialogIdx] = useState(null);
  const [selectedActionData, setSelectedActionData] = useState(null);

  // New state for common action functionality
  const [showCommonActionDialog, setShowCommonActionDialog] = useState(false);
  const [selectedCommonActionType, setSelectedCommonActionType] = useState('light_status');
  const [selectedOccupancySetting, setSelectedOccupancySetting] = useState(null);

  // NEW: Add state for light status functionality
  const [selectedZoneType, setSelectedZoneType] = useState('switched');
  const [lightStatusSettings, setLightStatusSettings] = useState({
    switched: { on_off: 'On' },
    dimmed: { brightness: 50, fadeTime: '02', delayTime: '00' },
    whitetune: { brightness: 50, cct: 2700, fadeTime: '02', delayTime: '00' }
  });

  // Get the current enable/disable status for this schedule
  // For internal schedules, use the schedule ID directly
  const eventId = getEventIdForStatus(event); // Use this for all enable/disable/status lookups

  // FIXED: Better status detection for internal schedules
  const getIsEnabled = () => {
    // For internal schedules, check the event's own EnableState first
    if (event && event.EnableState) {
      return event.EnableState === 'Enabled';
    }
    
    // For preconfigured schedules, check the status array
    const st = Array.isArray(status) ? status.find(s => s.event_id === eventId) : null;
    if (st) {
      return st.EnableState === 'Enabled';
    }
    
    // Fallback: check if the schedule is active (for internal schedules)
    if (event && event.is_active !== undefined) {
      return event.is_active;
    }
    
    return false;
  };

  const isEnabled = getIsEnabled();

  // Role-based access control functions based on Excel sheet
  const canAccessSchedule = () => {
    // All roles can view schedule details
    return true;
  };

  const canEnableDisableSchedule = () => {
    // Superadmin and Admin can always enable/disable schedules
    if (currentUserRole === 'Superadmin' || currentUserRole === 'Admin') {
      return true;
    }
    
    // For Operators, check if they have monitor_control or monitor_control_edit permission
    if (currentUserRole === 'Operator' && userProfile && userProfile.floors) {
      const hasMonitorControlOrEdit = userProfile.floors.some(f => 
        f.floor_permission === 'monitor_control' || f.floor_permission === 'monitor_control_edit'
      );
      return hasMonitorControlOrEdit;
    }
    
    return false;
  };

  const canTriggerSchedule = () => {
    // Superadmin and Admin can always trigger schedules
    if (currentUserRole === 'Superadmin' || currentUserRole === 'Admin') {
      return true;
    }
    
    // For Operators, check if they have monitor_control or monitor_control_edit permission
    if (currentUserRole === 'Operator' && userProfile && userProfile.floors) {
      const hasMonitorControlOrEdit = userProfile.floors.some(f => 
        f.floor_permission === 'monitor_control' || f.floor_permission === 'monitor_control_edit'
      );
      return hasMonitorControlOrEdit;
    }
    
    return false;
  };

  const canEditSchedule = () => {
    // Superadmin and Admin can always edit schedules
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

  const canDeleteSchedule = () => {
    // Superadmin and Admin can always delete schedules
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

  // Add toggle handler for enable/disable
  const handleToggle = async () => {
    if (toggleLoading) return; // Prevent double trigger
    try {
      if (isEnabled) {
        await dispatch(disableSchedule(eventId)).unwrap();
        setToast({ open: true, message: "Schedule disabled successfully!" });
      } else {
        await dispatch(enableSchedule(eventId)).unwrap();
        setToast({ open: true, message: "Schedule enabled successfully!" });
      }
      
      // FIXED: Refresh both schedule details and the entire list
      await Promise.all([
        dispatch(fetchScheduleDetails(id)),
        dispatch(fetchSchedules())
      ]);
      
    } catch (e) {
      setToast({ open: true, message: e?.message || "Toggle failed" });
    }
  };

  useEffect(() => {
    if (id) dispatch(fetchScheduleDetails(id));
    setEditMode(false);
    setIsCopyMode(false);
    setEditableEvent(null);
  }, [id, dispatch]);

  // FIXED: Update the logic for "Keep Until" - check if both begin_date and end_date exist
  useEffect(() => {
    if (event) {
      setScheduleName(event.name || "");
      setScheduleGroup(event.group_id ? String(event.group_id) : "");
      
      // Determine schedule type based on event data
      if (event.schedule_type === "SpecificDates" || event.specific_dates) {
        setScheduleType("annual");
        // Handle specific dates
        if (event.specific_dates && event.specific_dates.length > 0) {
          setSpecificDates(event.specific_dates.map(date => 
            `${date.Year || date.year}-${String(date.Month || date.month).padStart(2, '0')}-${String(date.Day || date.day).padStart(2, '0')}`
          ));
        }
      } else {
        setScheduleType("weekly");
        // Set selected days for weekly schedule
        if (event.days) {
          const selected = Object.entries(event.days)
            .filter(([day, selected]) => selected)
            .map(([day]) => {
              const dayMap = {
                'Sunday': 'Sun',
                'Monday': 'Mon',
                'Tuesday': 'Tue',
                'Wednesday': 'Wed',
                'Thursday': 'Thu',
                'Friday': 'Fri',
                'Saturday': 'Sat'
              };
              return dayMap[day] || day;
            });
          setSelectedDays(selected);
        }
      }

      // Set time
      if (event.time_of_day) {
        setTimeHours(String(event.time_of_day.Hour || event.time_of_day.hour || 0));
        setTimeMinutes(String(event.time_of_day.Minute || event.time_of_day.minute || 0));
      }

      // FIXED: Check schedule_span FIRST - if it's "Forever", always set forever regardless of dates
      if (event.schedule_span === "Forever") {
        setKeepUntil("forever");
        setCustomStartDate("");
        setCustomEndDate("");
      } else if (event.schedule_span === "CustomDates") {
        // Only check for dates if schedule_span is explicitly "CustomDates"
        const hasBeginDate = event.begin_date && Object.keys(event.begin_date).length > 0 && 
                            (event.begin_date.Day || event.begin_date.day);
        const hasEndDate = event.end_date && Object.keys(event.end_date).length > 0 && 
                          (event.end_date.Day || event.end_date.day);
        
        // Check if it's weekly schedule with only begin date
        const isWeeklyWithOnlyBeginDate = event.schedule_type === "DayOfWeek" && 
          hasBeginDate && !hasEndDate;
        
        if (hasBeginDate && hasEndDate && !isWeeklyWithOnlyBeginDate) {
          setKeepUntil("custom");
          setCustomStartDate(formatDateForInput(event.begin_date));
          setCustomEndDate(formatDateForInput(event.end_date));
        } else {
          // Even if schedule_span is "CustomDates" but dates are missing, set to forever
          setKeepUntil("forever");
          setCustomStartDate("");
          setCustomEndDate("");
        }
      } else {
        // Default to forever if schedule_span is not set or unknown
        setKeepUntil("forever");
        setCustomStartDate("");
        setCustomEndDate("");
      }

      // Set locations from areas
      if (areas && areas.length > 0) {
        const locs = areas.map(area => ({
          floorId: area.floor_id,
          areaId: area.area_id,
          floorName: area.floor_name,
          areaName: area.area_name,
          actions: area.actions || []
        }));
        setLocations(locs);
      }
    }
  }, [event, areas]);

  // Auto-select first group when groups are loaded and scheduleGroup is empty (in edit mode)
  useEffect(() => {
    if (editMode && groups && groups.length > 0 && !scheduleGroup) {
      setScheduleGroup(String(groups[0].id));
    }
  }, [groups, editMode, scheduleGroup]);

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

  const formatDateForInput = (dateObj) => {
    if (!dateObj || (!dateObj.Day && !dateObj.day) || (!dateObj.Month && !dateObj.month) || (!dateObj.Year && !dateObj.year)) return "";
    const day = dateObj.Day || dateObj.day;
    const month = dateObj.Month || dateObj.month;
    const year = dateObj.Year || dateObj.year;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // Action handlers
  const handleTrigger = () => setShowConfirm(true);

  const doTrigger = async () => {
    setShowConfirm(false);
    try {
      // DEBUG: Log the current schedule details before triggering
      console.log('Triggering Schedule ID:', id);
      console.log('Current Schedule Event:', event);
      console.log('Current Schedule Areas:', areas);
      
      // Use the correct API parameters for internal schedules
      const result = await dispatch(triggerSchedule({ 
        schedule_type: "internal", 
        schedule_id: parseInt(id) 
      })).unwrap();
      
      console.log('Trigger Response:', result);
      
      setToast({ open: true, message: "Schedule triggered successfully!" });
      
      // Optionally, you can add a delay and then check the zone status
      setTimeout(() => {
        // You might want to fetch the current zone status here
      }, 2000);
      
    } catch (e) {
      console.error('Trigger Error:', e);
      setToast({ open: true, message: e?.message || "Trigger failed" });
    }
  };

  const handleDelete = () => {
    setShowDeleteScheduleDialog(true);
  };

  const confirmDeleteSchedule = async () => {
    if (event) await dispatch(deleteSchedule(event.id));
    navigate('/schedule');
    setShowDeleteScheduleDialog(false);
  };

  // Handle day selection
  const handleDayToggle = (day) => {
    if (editMode) {
      setSelectedDays(prev => 
        prev.includes(day) 
          ? prev.filter(d => d !== day)
          : [...prev, day]
      );
    }
  };

  // Always use event (from API) for copy
  const handleCopy = () => {
    if (!event || updateStatus === 'loading') return;
    setEditMode(true);
    setIsCopyMode(true);
    // Deep copy and reset name
    const copy = JSON.parse(JSON.stringify(event));
    copy.name = `Copy of ${copy.name}`;
    copy.id = undefined; // Remove id so it's not mistaken for update
    setEditableEvent(copy);
    
    // Update form state for copy
    setScheduleName(`Copy of ${event.name}`);
    setScheduleGroup(event.group_id ? String(event.group_id) : "");
    
    // Set schedule type and related data
    if (event.schedule_type === "SpecificDates" || event.specific_dates) {
      setScheduleType("annual");
      if (event.specific_dates && event.specific_dates.length > 0) {
        setSpecificDates(event.specific_dates.map(date => 
          `${date.Year || date.year}-${String(date.Month || date.month).padStart(2, '0')}-${String(date.Day || date.day).padStart(2, '0')}`
        ));
      }
    } else {
      setScheduleType("weekly");
      if (event.days) {
        const selected = Object.entries(event.days)
          .filter(([day, selected]) => selected)
          .map(([day]) => {
            const dayMap = {
              'Sunday': 'Sun',
              'Monday': 'Mon',
              'Tuesday': 'Tue',
              'Wednesday': 'Wed',
              'Thursday': 'Thu',
              'Friday': 'Fri',
              'Saturday': 'Sat'
            };
            return dayMap[day] || day;
          });
        setSelectedDays(selected);
      }
    }

    // Set time
    if (event.time_of_day) {
      setTimeHours(String(event.time_of_day.Hour || event.time_of_day.hour || 0));
      setTimeMinutes(String(event.time_of_day.Minute || event.time_of_day.minute || 0));
    }

    // Set keep until and custom dates - Check schedule_span FIRST
    if (event.schedule_span === "Forever") {
      setKeepUntil("forever");
      setCustomStartDate("");
      setCustomEndDate("");
    } else if (event.schedule_span === "CustomDates") {
      setKeepUntil("custom");
      if (event.begin_date && event.end_date && Object.keys(event.begin_date).length > 0 && Object.keys(event.end_date).length > 0) {
        setCustomStartDate(formatDateForInput(event.begin_date));
        setCustomEndDate(formatDateForInput(event.end_date));
      } else {
        // If schedule_span is CustomDates but dates are missing, default to forever
        setKeepUntil("forever");
        setCustomStartDate("");
        setCustomEndDate("");
      }
    } else {
      // Default to forever if schedule_span is not set or unknown
      setKeepUntil("forever");
      setCustomStartDate("");
      setCustomEndDate("");
    }

    // Set locations from areas
    if (areas && areas.length > 0) {
      const locs = areas.map(area => ({
        floorId: area.floor_id,
        areaId: area.area_id,
        floorName: area.floor_name,
        areaName: area.area_name,
        actions: area.actions || []
      }));
      setLocations(locs);
    }
  };

  // Always use event (from API) for modify
  const handleModify = () => {
    if (!event) return;
    setEditMode(true);
    setEditableEvent(JSON.parse(JSON.stringify(event)));
    setIsCopyMode(false);
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditableEvent(null);
    setIsCopyMode(false);
    navigate('/schedule');
  };

  const handleSave = async () => {
    if (!scheduleName.trim() || locations.length === 0 || updateStatus === 'loading') return;
    
    // Check that all locations have at least one action
    const hasLocationsWithoutActions = locations.some(location => !location.actions || location.actions.length === 0);
    if (hasLocationsWithoutActions) {
      setToast({ open: true, message: "All locations must have at least one action before saving." });
      return;
    }
    
    navigate(-1);

    // Prepare payload similar to AddEvent
    const payload = {
      name: scheduleName,
      schedule_group_id: scheduleGroup ? Number(scheduleGroup) : null,
      schedule_type: scheduleType === "weekly" ? "DayOfWeek" : "SpecificDates",
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
      schedule_span: keepUntil === "custom" ? "CustomDates" : "Forever",
      areas: locations.map(loc => ({
        floor_id: loc.floorId,
        area_id: loc.areaId,
        actions: loc.actions.map(action => {
          // Convert action data to the correct format for the API
          if (action.type === "zone_status") {
            if (action.zone_type === "switched") {
              return {
                type: "zone_status",
                zone_id: action.zone_id || 1, // Use actual zone ID if available
                zone_type: "switched",
                zone_name: action.zone_name,
                zone_status: action.switched_state || action.zone_status || "Off"
              };
            } else if (action.zone_type === "dimmed") {
              return {
                type: "zone_status",
                zone_id: action.zone_id || 1, // Use actual zone ID if available
                zone_type: "dimmed",
                zone_name: action.zone_name,
                zone_status: action.zone_status || "On",
                zone_brightness: action.zone_brightness || (action.level ? (action.level.toString().includes('%') ? action.level : `${action.level}%`) : "50%"),
                fade_time: action.fade_time || "02",
                delay_time: action.delay_time || "00"
              };
            } else if (action.zone_type === "whitetune") {
              return {
                type: "zone_status",
                zone_id: action.zone_id || 1, // Use actual zone ID if available
                zone_type: "whitetune",
                zone_name: action.zone_name,
                zone_status: action.zone_status || "On",
                zone_brightness: action.zone_brightness || (action.level ? (action.level.toString().includes('%') ? action.level : `${action.level}%`) : "50%"),
                zone_temperature: action.zone_temperature || (action.kelvin ? (action.kelvin.toString().includes('K') ? action.kelvin : `${action.kelvin}K`) : "2700K"),
                fade_time: action.fade_time || "02",
                delay_time: action.delay_time || "00"
              };
            }
          } else if (action.type === "occupancy") {
            return {
              type: "occupancy",
              occupancy_setting: action.occupancy_setting
            };
          } else if (action.type === "set_scene") {
            return {
              type: "set_scene",
              scene_code: Number(action.scene_code || action.scene_id), // Convert to number
              scene_name: action.scene_name
            };
          } else if (action.type === "shade_group_status") {
            return {
              type: "shade_group_status",
              shade_group_id: Number(action.shade_group_id),
              shade_group_name: action.shade_group_name,
              shade_level: action.shade_level.toString().includes('%') ? action.shade_level : `${action.shade_level}%`
            };
          }
          
          // Return the action as is if it doesn't match any specific type
          return action;
        })
      })),
      ...(keepUntil === "custom" && customStartDate && customEndDate && {
        begin_date: {
          Day: parseInt(customStartDate.split('-')[2]),
          Month: parseInt(customStartDate.split('-')[1]),
          Year: parseInt(customStartDate.split('-')[0])
        },
        end_date: {
          Day: parseInt(customEndDate.split('-')[2]),
          Month: parseInt(customEndDate.split('-')[1]),
          Year: parseInt(customEndDate.split('-')[0])
        }
      }),
      ...(scheduleType === "annual" && specificDates.length > 0 && {
        specific_dates: specificDates.map(dateStr => {
          const [year, month, day] = dateStr.split("-");
          return {
            Day: Number(day),
            Month: Number(month),
            Year: Number(year)
          };
        }),
        // For SpecificDates schedules, we need begin_date and end_date
        begin_date: (() => {
          const sorted = [...specificDates].sort();
          const [year, month, day] = sorted[0].split("-");
          return {
            Day: Number(day),
            Month: Number(month),
            Year: Number(year)
          };
        })(),
        end_date: (() => {
          const sorted = [...specificDates].sort();
          const [year, month, day] = sorted[sorted.length - 1].split("-");
          return {
            Day: Number(day),
            Month: Number(month),
            Year: Number(year)
          };
        })()
      })
    };

    try {
      // DEBUG: Log the payload to verify brightness is being saved
      console.log('Schedule Save Payload:', JSON.stringify(payload, null, 2));
      
      if (isCopyMode) {
        // Create new schedule
        const response = await dispatch(createSchedule(payload)).unwrap();
        if (response?.id) {
          // Reset copy mode FIRST before navigation
          setIsCopyMode(false);
          // Navigate to the new schedule
          navigate(`/schedule/${response.id}`);
        }
      } else {
        // Update existing schedule
        const updateResponse = await dispatch(updateSchedule({ id: parseInt(id), ...payload })).unwrap();
        console.log('Schedule Update Response:', updateResponse);
        setEditMode(false);
        setEditableEvent(null);
        
        // Refresh schedule details to verify the saved values
        await dispatch(fetchScheduleDetails(id));
        
        setToast({ open: true, message: "Schedule updated successfully!" });
      }
    } catch (error) {
      console.error('Schedule Save Error:', error);
      setToast({ open: true, message: error?.message || "Save failed" });
    }
  };

  // Add location(s) from dialog
  const handleAddLocations = (newAreas) => {
    setLocations(prev => [
      ...prev,
      ...newAreas.map(a => ({
        ...a,
        actions: []
      }))
    ]);
  };

  // Delete location
  const handleDeleteLocation = (index) => {
    setLocationToDelete({ index, location: locations[index] });
    setShowDeleteLocationDialog(true);
  };

  const confirmDeleteLocation = () => {
    if (locationToDelete) {
      setLocations(prev => prev.filter((_, i) => i !== locationToDelete.index));
      setShowDeleteLocationDialog(false);
      setLocationToDelete(null);
    }
  };

  // Open action dialog
  const handleOpenActionDialog = (idx) => {
    setActionDialogIdx(idx);
    setSelectedActionData(null);
  };

// ... existing code ...

// Add this function to properly render action display
const renderActionDisplay = (action) => {
  // Handle area_status actions (from common action for On/Off)
  if (action.type === "area_status") {
    const status = action.area_status || "Off";
    return <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>Area Status: {status}</div>;
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
      
      return <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{displayText}</div>;
    }
    
    // Fallback for zone_status without zone_id
    return <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>Area Status: {status || "Off"}</div>;
  }
  
  // Handle zone actions from Action component (NEW: This is the missing part!)
  if (action.type === "zone" && action.zone) {
    const zoneName = action.zone.name || action.zone.id || 'Zone';
    const zoneType = action.zone.type;
    const values = action.values || {};
    
    let displayText = `Zone: ${zoneName}`;
    
    if (zoneType === "switched") {
      displayText += ` (${values.on_off || "Off"})`;
    } else if (zoneType === "dimmed") {
      // ONLY show brightness if it's actually set - NO DEFAULTS
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
      // ONLY show values if they're actually set - NO DEFAULTS
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
    
    return <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{displayText}</div>;
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
    return <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>Occupancy Setting: {occLabel}</div>;
  }
  
  // Handle other action types
  if (action.type === "scene" && action.scene) {
    return <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>Scene: {action.scene.name}</div>;
  }
  
  if (action.type === "set_scene") {
    return <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>Scene: {action.scene_name}</div>;
  }
  
  if (action.type === "shade" && action.shade) {
    return (
      <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
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
    return <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>Shade: {action.shade_group_name} ({shadeLevel})</div>;
  }
  
  if (action.type === "device" && action.device) {
    return <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>Device: {action.device.name}</div>;
  }
  
  return <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>Unknown action</div>;
};

  // Handle edit action - UPDATED FUNCTION to properly convert updated action data
  const handleEditAction = (locationIdx, actionIdx) => {
    // Add null checks to prevent errors
    if (!locations || !locations[locationIdx]) {
      console.error('Location not found at index:', locationIdx);
      return;
    }
    
    const location = locations[locationIdx];
    if (!location.actions || !location.actions[actionIdx]) {
      console.error('Action not found at index:', actionIdx, 'for location:', locationIdx);
      return;
    }
    
    const action = location.actions[actionIdx];
    if (!action || !action.type) {
      console.error('Invalid action object:', action);
      return;
    }
    
    // Convert action to the format expected by Action component
    let convertedAction = null;
    
    if (action.type === "set_scene") {
      convertedAction = {
        type: "scene",
        scene: {
          id: action.scene_code || action.scene_id,
          name: action.scene_name
        }
      };
    } else if (action.type === "area_status") {
      // For area_status, convert to zone action with switched type for editing
      convertedAction = {
        type: "zone",
        zone: {
          id: null,
          name: "Area",
          type: "switched"
        },
        values: {
          on_off: action.area_status || "Off"
        }
      };
    } else if (action.type === "zone_status") {
      // Use actual values from the action - NO DEFAULTS
      let brightness = undefined;
      let cct = undefined;
      
      if (action.zone_brightness) {
        if (typeof action.zone_brightness === "string") {
          const parsed = parseInt(action.zone_brightness.replace('%', '').trim());
          brightness = isNaN(parsed) ? undefined : parsed;
        } else if (typeof action.zone_brightness === "number") {
          brightness = isNaN(action.zone_brightness) ? undefined : action.zone_brightness;
        }
      }
      
      if (action.zone_temperature) {
        if (typeof action.zone_temperature === "string") {
          const parsed = parseInt(action.zone_temperature.replace('K', '').trim());
          cct = isNaN(parsed) ? undefined : parsed;
        } else if (typeof action.zone_temperature === "number") {
          cct = isNaN(action.zone_temperature) ? undefined : action.zone_temperature;
        }
      }
      
      convertedAction = {
        type: "zone",
        zone: {
          id: action.zone_id,
          name: action.zone_name,
          type: action.zone_type
        },
        values: {
          on_off: action.zone_status || "On",
          brightness: brightness, // Use actual value, not default
          cct: cct, // Use actual value, not default
          fadeTime: action.fade_time || '02',
          delayTime: action.delay_time || '00'
        }
      };
    } else if (action.type === "occupancy") {
      convertedAction = {
        type: "occupancy",
        action: action.occupancy_setting
      };
    } else if (action.type === "shade_group_status") {
      // Fix shade level conversion
      let shadeValue = 0;
      if (action.shade_level) {
        if (typeof action.shade_level === "string") {
          const parsed = parseInt(action.shade_level.replace('%', '').trim());
          shadeValue = isNaN(parsed) ? 0 : parsed;
        } else if (typeof action.shade_level === "number") {
          shadeValue = isNaN(action.shade_level) ? 0 : action.shade_level;
        }
      }
      
      convertedAction = {
        type: "shade",
        shade: {
          id: action.shade_group_id,
          name: action.shade_group_name
        },
        value: Number(shadeValue) // Ensure it's a number
      };
    }
    
    setSelectedActionData(convertedAction);
    setActionDialogIdx(locationIdx);
  };

  // Handle common action selection
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

  // Handle occupancy setting selection
  const handleOccupancySettingSelect = (setting) => {
    // Only update the state, don't apply to locations yet - wait for "Apply to All" button
    setSelectedOccupancySetting(setting);
  };

  // Apply common action to all areas - UPDATED to ensure action is applied
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

  // Add action to location - UPDATED to completely replace old action with new value
  const handleAddAction = (idx, actionData) => {
    setLocations(prev => prev.map((loc, i) => {
      if (i !== idx) return loc;
      
      // Convert action data to the correct format for the API
      let newAction = actionData;
      
      if (actionData.type === "scene" && actionData.scene) {
        newAction = {
          type: "set_scene",
          scene_code: Number(actionData.scene.id), // Convert to number
          scene_name: actionData.scene.name
        };
      } else if (actionData.type === "zone" && actionData.zone) {
        // Check if this is a simple On/Off for switched zone without zone_id (area-level control)
        if (actionData.zone.type === "switched" && 
            (!actionData.zone.id || actionData.zone.id === null) &&
            actionData.values?.on_off &&
            !actionData.values.brightness &&
            !actionData.values.cct) {
          // Use area_status for simple On/Off area control (uses /area/zone_on-off API)
          newAction = {
            type: "area_status",
            area_status: actionData.values.on_off
          };
        } else {
          // For specific zone controls, use zone_status
          newAction = {
            type: "zone_status",
            zone_id: Number(actionData.zone.id || actionData.zone.zone_id),
            zone_type: actionData.zone.type,
            zone_name: actionData.zone.name,
            zone_status: actionData.values?.on_off || "Off"
          };
          
          // ONLY set brightness if user actually provided a value
          if (actionData.values && actionData.values.brightness !== undefined && actionData.values.brightness !== null) {
            newAction.zone_brightness = actionData.values.brightness.toString().includes('%') ? actionData.values.brightness : `${actionData.values.brightness}%`;
          }
          
          // ONLY set temperature if user actually provided a value
          if (actionData.values && actionData.values.cct !== undefined && actionData.values.cct !== null) {
            newAction.zone_temperature = actionData.values.cct.toString().includes('K') ? actionData.values.cct : `${actionData.values.cct}K`;
          }
          
          // Add fade and delay times for dimmed and whitetune zones
          if (actionData.zone.type === "dimmed" || actionData.zone.type === "whitetune") {
            newAction.fade_time = actionData.values?.fadeTime || "02";
            newAction.delay_time = actionData.values?.delayTime || "00";
          }
        }
      } else if (actionData.type === "occupancy" && actionData.action) {
        newAction = {
          type: "occupancy",
          occupancy_setting: actionData.action
        };
      } else if (actionData.type === "shade" && actionData.shade) {
        newAction = {
          type: "shade_group_status",
          shade_group_id: Number(actionData.shade.id || actionData.shade.zone_id),
          shade_group_name: actionData.shade.name,
          shade_level: actionData.value.toString().includes('%') ? actionData.value : `${actionData.value}%`
        };
      }
      
      // COMPLETELY REPLACE all actions with the new one (remove all old actions)
      return { ...loc, actions: [newAction] };
    }));
    setActionDialogIdx(null);
    setSelectedActionData(null);
  };

  // Add handler for adding specific dates (you can add a calendar picker later)
  const handleAddSpecificDate = (dateStr) => {
    if (!specificDates.includes(dateStr)) {
      setSpecificDates(prev => [...prev, dateStr]);
    }
  };

  // Add state for date input value
  const [newDateValue, setNewDateValue] = useState("");
  
  // Add calendar state to match AddEvent.jsx
  const [showAnnualCalendar, setShowAnnualCalendar] = useState(false);

  // Update the schedule type change handler
  const handleScheduleTypeChange = (newType) => {
    setScheduleType(newType);
    setNewDateValue(""); // Clear the date input when switching types
    if (newType === "weekly") {
      setSpecificDates([]);
    } else if (newType === "annual") {
      setSelectedDays([]);
    }
  };

  const groupName =
    (groups && groups.length > 0 && groups.find(g => String(g.id) === String(event?.group_id))?.name)
    || event?.group_name
    || "—";

  const enableState = event?.EnableState || 'Unknown';

  if (isLoading || !event) {
    if (detailsError) {
      return <div style={{ color: "red", padding: 40 }}>Error loading schedule: {detailsError}</div>;
    }
    return <div style={{ color: "#fff", padding: 40 }}>Loading...</div>;
  }

  // Check if user has access to this schedule
  if (!canAccessSchedule()) {
    return (
      <div style={{ 
        color: "#fff", 
        padding: 40, 
        textAlign: "center",
        fontSize: 18,
        fontWeight: 500
      }}>
        Access Denied: You don't have permission to view this schedule.
        <br />
        <button
          onClick={() => navigate('/schedule')}
          style={{
            marginTop: 20,
            padding: "10px 20px",
            background: buttonColor,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14
          }}
        >
          Back to Schedule List
        </button>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: isLargeScreen ? 1600 : isDesktop ? 1400 : 1200,
      margin: "0 auto",
      padding: isLargeScreen ? 40 : isDesktop ? 32 : 24,
      borderRadius: 20,
      minHeight: 500,
      background: "none",
      position: "relative"
    }}>
      {/* 1. Top right: Enable/Disable and Trigger */}
      <div style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: isLargeScreen ? 20 : isDesktop ? 18 : 16,
        marginBottom: isLargeScreen ? 32 : isDesktop ? 28 : 24
      }}>
        {/* Enable/Disable Toggle - Show but disable based on permissions */}
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          cursor: canEnableDisableSchedule() ? 'pointer' : 'not-allowed', 
          marginRight: 8,
          opacity: canEnableDisableSchedule() ? 1 : 0.5
        }}>
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={canEnableDisableSchedule() ? handleToggle : undefined}
            disabled={toggleLoading || !canEnableDisableSchedule()}
            style={{ width: 0, height: 0, opacity: 0, position: 'absolute' }}
          />
          <span style={{
            display: 'inline-block',
            width: 54,
            height: 28,
            background: canEnableDisableSchedule() 
              ? (isEnabled ? '#43a047' : 'red')
              : '#666', // Gray when disabled
            borderRadius: 14,
            position: 'relative',
            transition: 'background 0.2s',
            marginRight: 8,
          }}>
            <span style={{
              position: 'absolute',
              left: isEnabled ? 28 : 4,
              top: 4,
              width: 20,
              height: 20,
              background: canEnableDisableSchedule() ? '#fff' : '#ccc', // Gray circle when disabled
              borderRadius: '50%',
              transition: 'left 0.2s',
              boxShadow: canEnableDisableSchedule() ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
            }} />
          </span>
        </label>
        {/* Trigger Button - Show but disable based on permissions */}
        <button
          onClick={canTriggerSchedule() ? handleTrigger : undefined}
          disabled={triggerStatus === 'loading' || !canTriggerSchedule()}
          style={{
            background: canTriggerSchedule() ? buttonColor : '#666',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: isLargeScreen ? '12px 24px' : isDesktop ? '11px 22px' : '10px 20px',
            fontWeight: 500,
            fontSize: isLargeScreen ? 16 : isDesktop ? 15 : 14,
            cursor: (triggerStatus === 'loading' || !canTriggerSchedule()) ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'background 0.2s',
            opacity: (triggerStatus === 'loading' || !canTriggerSchedule()) ? 0.6 : 1
          }}
        >
          {triggerStatus === 'loading' ? 'Triggering...' : 'Trigger'}
        </button>
      </div>

      {/* 2. Main details section */}
      <div style={{
        display: "flex",
        gap: isLargeScreen ? 32 : isDesktop ? 28 : 24,
        alignItems: "flex-start",
    
        //marginTop: 24 // push details down
      }}>
        {/* Left column: Schedule details */}
        <div style={{
          flex: "0 1 400px",
          minWidth: isLargeScreen ? 380 : isDesktop ? 360 : 340,
          maxWidth: isLargeScreen ? 480 : isDesktop ? 440 : 420,
          padding: 0
        }}>
          {/* Schedule Name */}
          <div style={{ marginBottom: isLargeScreen ? 15 : isDesktop ? 12 : 10 }}>
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
              disabled={!editMode}
              style={{
                width: '100%',
                padding: isLargeScreen ? 14 : isDesktop ? 13 : 12,
                borderRadius: 8,
                border: '1px solid #ccc',
                fontSize: isLargeScreen ? 16 : isDesktop ? 15 : 14,
                background: editMode ? 'white' : '#e0dbce',
                color: editMode ? buttonColor : '#888'
              }}
            />
          </div>
          {/* Part of (Group) */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontWeight: 500, color: 'black', display: 'block', marginBottom: 8 }}>
              Part of
            </label>
            {editMode ? (
              <select
                value={scheduleGroup}
                onChange={e => setScheduleGroup(e.target.value)}
                disabled={groupsLoading}
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 8,
                  border: '1px solid #ccc',
                  fontSize: 14,
                  backgroundColor: 'white',
                  color: buttonColor
                }}
              >
                {groups && groups.map((group) => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            ) : (
              <div
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 8,
                  border: '1px solid #ccc',
                  fontSize: 14,
                  background: '#e0dbce',
                  color: buttonColor,
                  minHeight: 44
                }}
              >
                {groupName}
              </div>
            )}
          </div>
          {/* Grouped Card for Day/Date, Time, Keep Until */}
          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: 18,
            marginBottom: 0,
            marginTop: 18,
            display: "flex",
            flexDirection: "column",
            gap: 18
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
                    disabled={!editMode}
                    style={{ 
                      marginRight: 8,
                      accentColor: '#000000',
                      WebkitAppearance: 'none',
                      appearance: 'none',
                      width: '12px',
                      height: '12px',
                      border: '2px solid #ccc',
                      borderRadius: '50%',
                      backgroundColor: scheduleType === "weekly" ? '#000000' : 'transparent',
                      position: 'relative'
                    }}
                  />
                  Weekly
                </label>
                <label style={{ display: 'flex', fontSize: 14, alignItems: 'center', color: 'white', marginRight: 6 }}>
                  <input
                    type="radio"
                    value="annual"
                    checked={scheduleType === "annual"}
                    onChange={e => handleScheduleTypeChange(e.target.value)}
                    disabled={!editMode}
                    style={{ 
                      marginRight: 8,
                      accentColor: '#000000',
                      WebkitAppearance: 'none',
                      appearance: 'none',
                      width: '12px',
                      height: '12px',
                      border: '2px solid #ccc',
                      borderRadius: '50%',
                      backgroundColor: scheduleType === "annual" ? '#000000' : 'transparent',
                      position: 'relative'
                    }}
                  />
                  Fixed Dates
                  {editMode && scheduleType === "annual" && (
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
                  )}
                </label>
              </div>
              {scheduleType === "weekly" && (
                <div style={{ display: 'flex', gap: 5, marginBottom: 0, flexWrap: 'wrap' }}>
                  {daysArray.map(day => (
                    <button
                      key={day}
                      onClick={() => handleDayToggle(day)}
                      disabled={!editMode}
                      style={{
                        padding: '5px 10px',
                        borderRadius: 6,
                        border: '1px solid #ccc',
                        background: selectedDays.includes(day) ? buttonColor : 'white',
                        color: selectedDays.includes(day) ? 'white' : buttonColor,
                        cursor: editMode ? 'pointer' : 'not-allowed',
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
              
              {/* FIXED: Display specific dates when schedule type is annual - Match AddEvent.jsx UI */}
              {scheduleType === "annual" && specificDates.length > 0 && (
                <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {specificDates.sort().map(date => (
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
                      {editMode && (
                        <span
                          onClick={() =>
                            setSpecificDates(prev => prev.filter(d => d !== date))
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
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Select Time */}
            <div style={{ backgroundColor: '#807864', padding: 5, borderRadius: 5 }}>
              <label style={{ fontWeight: 500, fontSize: 14, color: 'white', display: 'block', marginBottom: 8 }}>
                Time
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="number"
                  value={timeHours}
                  onChange={e => setTimeHours(e.target.value)}
                  min="0"
                  max="23"
                  placeholder="HH"
                  disabled={!editMode}
                  style={{
                    width: 40,
                    padding: 5,
                    borderRadius: 4,
                    border: '1px solid #ccc',
                    textAlign: 'center',
                    background: editMode ? 'white' : '#e0dbce'
                  }}
                />
                <span style={{ color: 'white', fontSize: 18 }}>:</span>
                <input
                  type="number"
                  value={timeMinutes}
                  onChange={e => setTimeMinutes(e.target.value)}
                  min="0"
                  max="59"
                  placeholder="MM"
                  disabled={!editMode}
                  style={{
                    width: 40,
                    padding: 5,
                    borderRadius: 4,
                    border: '1px solid #ccc',
                    textAlign: 'center',
                    background: editMode ? 'white' : '#e0dbce'
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
                    checked={keepUntil === "forever" && specificDates.length === 0}
                    onChange={e => setKeepUntil(e.target.value)}
                    disabled={!editMode || specificDates.length > 0}
                    style={{ 
                      marginRight: 8,
                      accentColor: '#000000',
                      WebkitAppearance: 'none',
                      appearance: 'none',
                      width: '12px',
                      height: '12px',
                      border: '2px solid #ccc',
                      borderRadius: '50%',
                      backgroundColor: (keepUntil === "forever" && specificDates.length === 0) ? '#000000' : 'transparent',
                      position: 'relative'
                    }}
                  />
                  Forever
                </label>
                <label style={{ display: 'flex', fontSize: 14, alignItems: 'center', color: 'white' }}>
                  <input
                    type="radio"
                    value="custom"
                    checked={keepUntil === "custom" || specificDates.length > 0}
                    onChange={e => setKeepUntil(e.target.value)}
                    disabled={!editMode}
                    style={{ 
                      marginRight: 8,
                      accentColor: '#000000',
                      WebkitAppearance: 'none',
                      appearance: 'none',
                      width: '12px',
                      height: '12px',
                      border: '2px solid #ccc',
                      borderRadius: '50%',
                      backgroundColor: (keepUntil === "custom" || specificDates.length > 0) ? '#000000' : 'transparent',
                      position: 'relative'
                    }}
                  />
                  Custom Dates
                </label>
              </div>
              {/* Custom Date Display */}
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                {specificDates.length > 0 ? (
                  (() => {
                    const sorted = [...specificDates].sort();
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
                  keepUntil === "custom" && (
                    <>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={e => setCustomStartDate(e.target.value)}
                        disabled={!editMode}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 6,
                          border: '1px solid #ccc',
                          fontSize: 14,
                          background: editMode ? 'white' : '#e0dbce',
                          color: editMode ? buttonColor : '#888',
                          minWidth: 120
                        }}
                      />
                      <span style={{ color: 'white', alignSelf: 'center' }}>to</span>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={e => setCustomEndDate(e.target.value)}
                        disabled={!editMode}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 6,
                          border: '1px solid #ccc',
                          fontSize: 14,
                          background: editMode ? 'white' : '#e0dbce',
                          color: editMode ? buttonColor : '#888',
                          minWidth: 120
                        }}
                      />
                    </>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Location/Action, etc. */}
        <div style={{
          flex: 1,
          minWidth: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          height: "100%",
          overflow: "hidden",
          maxWidth: isLargeScreen ? 800 : isDesktop ? 700 : 600
        }}>
          {/* Add Location and Common Action buttons when in edit mode */}
          {editMode && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginBottom: 16
            }}>
             
            </div>
          )}

          {/* Table-like header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            color: 'white',
            borderBottom: '1px solid #ccc',
            paddingBottom: isLargeScreen ? 12 : isDesktop ? 10 : 8,
            marginBottom: isLargeScreen ? 12 : isDesktop ? 10 : 8,
            fontSize: isLargeScreen ? 17 : isDesktop ? 16 : 15,
            gap: 16
          }}>
            <span
              style={{ 
                flex: '0 0 300px', 
                cursor: editMode ? 'pointer' : 'default', 
                textAlign: 'left'
              }}
              onClick={() => editMode && setShowLocationDialog(true)}
            >
              {editMode ? "+ Add Location" : "Location"}
            </span>
            <span style={{ 
              flex: '1 1 300px', 
              textAlign: 'left'
            }}>
              Action
            </span>
            {editMode && (
              <span
                style={{ 
                  flex: '0 0 180px', 
                  cursor: 'pointer', 
                  textAlign: 'left', 
                  whiteSpace: 'nowrap'
                }}
                onClick={() => setShowCommonActionDialog(true)}
              >
                + Add Common Action
              </span>
            )}
          </div>

          {/* Table-like list of locations and actions */}
          <div>
            {locations.map((loc, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                borderBottom: '1px solid #b2a98b',
                padding: '10px 0',
                minHeight: 44,
                background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                gap: 16
              }}>
                {/* Location column */}
                <div style={{
                  flex: '0 0 300px',
                  fontSize: 15,
                  color: '#fff',
                  textAlign: 'left',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {loc.floorName} &gt; {loc.areaName}
                </div>
                {/* Action column */}
                <div style={{
                  flex: '1 1 300px',
                  fontSize: 15,
                  color: '#fff',
                  textAlign: 'left'
                }}>
                  {(loc.actions && loc.actions.length > 0)
                    ? loc.actions.map((a, i) => (
                        <div key={i} style={{
                          marginBottom: 4,
                          wordWrap: 'break-word',
                          wordBreak: 'break-word',
                          lineHeight: '1.4'
                        }}>
                          {renderActionDisplay(a)}
                        </div>
                      ))
                    : <span style={{ color: '#888' }}>No actions</span>
                  }
                </div>
                {/* Edit/Delete buttons */}
                {editMode && (
                  <div style={{
                    flex: '0 0 120px',
                    textAlign: 'right',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <button
                      onClick={() => {
                        if (loc.actions && loc.actions.length > 0) {
                          handleEditAction(idx, 0); // Edit the first action
                        } else {
                          setActionDialogIdx(idx);
                          setSelectedActionData(null);
                        }
                      }}
                      style={{
                        background: buttonColor,
                        border: 'none',
                        borderRadius: 4,
                        color: '#fff',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: 12,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {loc.actions && loc.actions.length > 0 ? 'Edit' : 'Add'} Action
                    </button>
                    <button
                      onClick={() => handleDeleteLocation(idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#fff',
                        padding: 0,
                        cursor: 'pointer',
                        fontSize: 18,
                        lineHeight: 1
                      }}
                      title="Delete"
                    >
                      <span role="img" aria-label="delete">🗑️</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: isLargeScreen ? 20 : isDesktop ? 18 : 16,
            marginTop: isLargeScreen ? 40 : isDesktop ? 35 : 32
          }}>
            {!editMode ? (
              <>
                {/* Copy Button - Show but disable based on permissions */}
                <button
                  onClick={canEditSchedule() ? handleCopy : undefined}
                  disabled={!canEditSchedule()}
                  style={{
                    padding: isLargeScreen ? "12px 32px" : isDesktop ? "11px 30px" : "10px 28px",
                    borderRadius: 8,
                    border: "none",
                    background: canEditSchedule() ? buttonColor : "#666",
                    color: canEditSchedule() ? "#fff" : "#999",
                    fontWeight: 500,
                    fontSize: isLargeScreen ? 16 : isDesktop ? 15 : 14,
                    cursor: canEditSchedule() ? "pointer" : "not-allowed",
                    opacity: canEditSchedule() ? 1 : 0.7
                  }}
                >
                  Copy
                </button>
                {/* Modify Button - Show but disable based on permissions */}
                <button
                  onClick={canEditSchedule() ? handleModify : undefined}
                  disabled={!canEditSchedule()}
                  style={{
                    padding: isLargeScreen ? "12px 32px" : isDesktop ? "11px 30px" : "10px 28px",
                    borderRadius: 8,
                    border: "none",
                    background: canEditSchedule() ? buttonColor : "#666",
                    color: canEditSchedule() ? "#fff" : "#999",
                    fontWeight: 500,
                    fontSize: isLargeScreen ? 16 : isDesktop ? 15 : 14,
                    cursor: canEditSchedule() ? "pointer" : "not-allowed",
                    opacity: canEditSchedule() ? 1 : 0.7
                  }}
                >
                  Modify
                </button>
                {/* Delete Button - Show but disable based on permissions */}
                <button
                  onClick={canEditSchedule() ? handleDelete : undefined}
                  disabled={deleteStatus === 'loading' || !canEditSchedule()}
                  style={{
                    padding: isLargeScreen ? "12px 32px" : isDesktop ? "11px 30px" : "10px 28px",
                    borderRadius: 8,
                    border: "none",
                    background: (deleteStatus === 'loading' || !canEditSchedule()) ? "#666" : buttonColor,
                    color: (deleteStatus === 'loading' || !canEditSchedule()) ? "#999" : "#fff",
                    fontWeight: 500,
                    fontSize: isLargeScreen ? 16 : isDesktop ? 15 : 14,
                    cursor: (deleteStatus === 'loading' || !canEditSchedule()) ? "not-allowed" : "pointer",
                    opacity: (deleteStatus === 'loading' || !canEditSchedule()) ? 0.7 : 1
                  }}
                >
                  {deleteStatus === 'loading' ? 'Deleting...' : 'Delete'}
                </button>
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
                  Close
                </button>
              </>
            ) : (
              <>
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
                  disabled={!scheduleName.trim() || locations.length === 0 || updateStatus === 'loading' || locations.some(location => !location.actions || location.actions.length === 0)}
                  style={{
                    padding: "10px 28px",
                    borderRadius: 8,
                    border: "none",
                    background: (scheduleName.trim() && locations.length > 0 && updateStatus !== 'loading' && !locations.some(location => !location.actions || location.actions.length === 0)) ? buttonColor : "#888",
                    color: "#fff",
                    fontWeight: 500,
                    cursor: (scheduleName.trim() && locations.length > 0 && updateStatus !== 'loading' && !locations.some(location => !location.actions || location.actions.length === 0)) ? "pointer" : "not-allowed"
                  }}
                >
                  {updateStatus === 'loading' ? 'Saving...' : 'Save'}
                </button>
              </>
            )}
          </div>
        </div>

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
                {locations[actionDialogIdx]?.actions?.length > 0 ? 'Edit' : 'Add'} Action
              </div>
              <Action
                areaId={locations[actionDialogIdx]?.areaId}
                onActionSelect={action => setSelectedActionData(action)}
                initialAction={selectedActionData}
              />
              <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button
                  onClick={() => {
                    if (selectedActionData && selectedActionData.type) {
                      handleAddAction(actionDialogIdx, selectedActionData);
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
                  {locations[actionDialogIdx]?.actions?.length > 0 ? 'Update' : 'Add'} Action
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

        {/* Area Tree Dialog */}
        <AreaTreeDialog
          open={showLocationDialog}
          onClose={() => setShowLocationDialog(false)}
          onAdd={handleAddLocations}
          accessibleFloors={floors}
        />

        <ConfirmDialog
          open={showConfirm}
          title="Trigger Schedule"
          message="Are you sure you want to trigger this schedule now?"
          onConfirm={doTrigger}
          onCancel={() => setShowConfirm(false)}
        />

        {/* Delete Schedule Confirmation Dialog */}
        <ConfirmDialog
          open={showDeleteScheduleDialog}
          title="Delete Schedule"
          message="Are you sure you want to delete this schedule?"
          onConfirm={confirmDeleteSchedule}
          onCancel={() => setShowDeleteScheduleDialog(false)}
        />

        {/* Delete Location Confirmation Dialog */}
        <ConfirmDialog
          open={showDeleteLocationDialog}
          title="Delete Location"
          message={`Are you sure you want to delete location "${locationToDelete?.location?.floorName} > ${locationToDelete?.location?.areaName}"?`}
          onConfirm={confirmDeleteLocation}
          onCancel={() => {
            setShowDeleteLocationDialog(false);
            setLocationToDelete(null);
          }}
        />

        <Toast
          open={toast.open}
          message={toast.message}
          onClose={() => setToast({ ...toast, open: false })}
        />

        {/* Calendar positioned outside the form container - Match AddEvent.jsx */}
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
                setSpecificDates(prev =>
                  prev.includes(dateStr)
                    ? prev // Do nothing if already selected
                    : [...prev, dateStr]
                );
                setKeepUntil("custom");
                setShowAnnualCalendar(false); // Close calendar after selection
              }}
              highlightDates={specificDates.map(d => new Date(d))}
              minDate={new Date()} // Changed to current date to disable past dates
              maxDate={new Date(2100, 11, 31)}
              onClickOutside={() => setShowAnnualCalendar(false)}
              inline={true}
              onCalendarClose={() => setShowAnnualCalendar(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleDetails;