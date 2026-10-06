import { getScheduleSettingsBindings } from './bindScheduleSettingsModule';
import { getScheduleFormTheme, scheduleFormSectionCard, scheduleFormSectionsColumn, scheduleFieldCardShell, scheduleRightPanelShell, scheduleModalPanelStyle, scheduleModalTitleStyle, scheduleModalLabelStyle, scheduleModalSelectStyle, scheduleModalRadioLabelStyle, scheduleLegacyModalPanelStyle, scheduleLegacyModalTitleStyle } from './scheduleFormTheme';
import { renderScheduleModalLayer, SCHEDULE_MODAL_OVERLAY_Z_INDEX } from './scheduleModalLayer';
import { scheduleFilterMenuProps, scheduleModalFilterMenuProps, resolveScheduleModalFilterMenuProps, scheduleSelectFieldSx } from './scheduleSelectMenuProps';
import { MenuItem, Select } from '@mui/material';
import {
  loadAreaTreeIndex,
  mapAreasToScheduleLocations,
  formatScheduleLocationLabel,
} from '../../../utils/scheduleLocationPath';
import { detailsRowActionControlsStyle } from '../../../utils/detailsRowActionControlsStyle';
import { dispatchFetchFloorsOnce } from '../../utils/bootstrapFetchGuards';
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ScheduleLocationsPanel from './ScheduleLocationsPanel';
import ActionChooserModal from '../../quickcontrols/ActionChooserModal';
import { getQuickControlActionShortLabel } from '../../quickcontrols/quickControlActionLabels';
import {
  convertApiActionToUiAction,
  expandQuickControlActionData,
  lightStatusSettingsFromAreaAction,
  locationHasSceneAction,
  locationHasZoneAction,
  mergeExpandedActionsIntoLocation,
} from '../../quickcontrols/zoneActionHelpers';
import { DEFAULT_APP_CONTENT, isWhiteAreaPickerChrome, onContentColors } from "../../theme/utils/themeOnSurface";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
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
  const {
    scheduleSlice,
    UseAuth,
    userlogin,
    floorSlice,
    FeedbackUI,
    quickcontrols: { AreaTreeDialog, Action },
    BaseUrl,
    themeSlice: { selectApplicationTheme },
    fixedActionBarStyles: {
      scheduleFixedActionBarStyle,
      schedulePageWithFixedActionBarStyle,
      scheduleRightListScrollStyle,
      DETAILS_FIXED_ACTION_BAR_BOTTOM_CLEARANCE,
    },
    scheduleActionPriority: { applyCommonActionToActions, stripActionSource, tagLoadedActions, withIndividualSource },
    scheduleFormLayout,
    scheduleCalendarChrome = 'dark',
    scheduleAdvancedLocationsPanel = null,
    useFixedPageActionBar = false,
  } = getScheduleSettingsBindings();
  // Use Quick Control–style merging for all variants (basic/advanced/customized).
  const useQuickControlActionMerging = true;
  const isBasicScheduleForm = scheduleCalendarChrome === 'light';
  const formTheme = getScheduleFormTheme(scheduleCalendarChrome);
  const isLightScheduleForm = formTheme.isLight;
  const isAdvancedScheduleForm = Boolean(formTheme.useAdvancedFormChrome);
  const isCustomizedScheduleForm = scheduleCalendarChrome === 'customized';
  const useAdvancedLocationsPanel =
    isAdvancedScheduleForm && Boolean(scheduleAdvancedLocationsPanel);
  const {
    getAdvancedQuickControlDetailsActionBarStyle,
    schedulePrimaryButtonStyle: advancedPrimaryButtonStyle,
  } = scheduleAdvancedLocationsPanel || {};
  const usePortaledScheduleModals = isAdvancedScheduleForm || isCustomizedScheduleForm;
  const { ConfirmDialog, Toast } = FeedbackUI;
  const { selectProfile } = userlogin;
  const { fetchScheduleDetails, updateSchedule, deleteSchedule, triggerSchedule, createSchedule, fetchScheduleGroups, enableSchedule, disableSchedule, fetchSchedules } = scheduleSlice;
  const { fetchFloors, selectFloors } = floorSlice;

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
  const [isTablet, setIsTablet] = useState(false);

  // Add window resize listener for responsive design
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowSize({
        width,
        height: window.innerHeight
      });
      setIsTablet(width >= 768 && width <= 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate responsive dimensions
  const isLargeScreen = windowSize.width >= 1920; // 4K and large screens
  const isDesktop = windowSize.width >= 1366; // Desktop screens
  const isLaptop = windowSize.width >= 1024; // Laptop screens
  const buttonColor = formTheme.buttonColor;
  const radioFill = formTheme.radioSelected;

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

  const [editMode, setEditMode] = useState(false);
  const [isCopyMode, setIsCopyMode] = useState(false);
  const [editableEvent, setEditableEvent] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "" });
  const [showDeleteScheduleDialog, setShowDeleteScheduleDialog] = useState(false);
  const [showDeleteLocationDialog, setShowDeleteLocationDialog] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState(null);
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
  const [locations, setLocations] = useState([]);
  const [areaTreeIndex, setAreaTreeIndex] = useState(null);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [actionDialogIdx, setActionDialogIdx] = useState(null);
  const [selectedActionData, setSelectedActionData] = useState(null);
  const [editingActionIdx, setEditingActionIdx] = useState(null);
  const [editAllMode, setEditAllMode] = useState(false);
  const [actionChooser, setActionChooser] = useState(null); // { mode, locationIdx }
  const [showDeleteActionDialog, setShowDeleteActionDialog] = useState(false);
  const [actionToDelete, setActionToDelete] = useState(null);
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

  // Fetch groups once on mount. Do NOT key off groups.length — an empty
  // groups[] from the API is valid and would otherwise infinite-loop.
  useEffect(() => {
    dispatch(fetchScheduleGroups());
  }, [dispatch]);

  // Fetch floors once (reuse Redux cache across Dashboard / Schedule / etc.)
  useEffect(() => {
    dispatchFetchFloorsOnce(dispatch, fetchFloors, Boolean(floors?.length));
  }, [dispatch, fetchFloors, floors?.length]);

  const decodeHtmlEntities = (text) => {
    if (!text) return text;
    return String(text)
      .replace(/&gt;/g, '>')
      .replace(/&lt;/g, '<')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  };

  const buildLocationsFromAreas = (areaList) =>
    mapAreasToScheduleLocations(areaList, floors, areaTreeIndex);

  useEffect(() => {
    let cancelled = false;
    if (!floors?.length) return undefined;

    (async () => {
      try {
        const map = await loadAreaTreeIndex(floors, (floorId) =>
          BaseUrl.get(`/floor/area_tree/${floorId}`)
        );
        if (!cancelled) setAreaTreeIndex(map);
      } catch {
        if (!cancelled) setAreaTreeIndex(new Map());
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [floors]);

  useEffect(() => {
    if (!areas?.length || editMode) return;
    setLocations(buildLocationsFromAreas(areas));
  }, [areas, floors, areaTreeIndex, editMode]);

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
      const result = await dispatch(triggerSchedule({ 
        schedule_type: "internal", 
        schedule_id: parseInt(id) 
      })).unwrap();
      
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

    // Set locations from areas (resolved via floors / area tree like Quick Control details)
    if (areas && areas.length > 0) {
      setLocations(buildLocationsFromAreas(areas));
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
          if (useQuickControlActionMerging) {
            action = stripActionSource(action);
          }
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

  // Open action dialog (add new action)
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
            withSource: useQuickControlActionMerging ? withIndividualSource : null,
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

  const handleEditButtonClick = (locationIdx, actionsArg) => {
    const actions = actionsArg ?? locations[locationIdx]?.actions ?? [];
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

  const handleDeleteButtonClick = (locationIdx, actionsArg) => {
    const location = locations[locationIdx];
    const actions = actionsArg ?? location?.actions ?? [];
    if (actions.length === 0) {
      handleDeleteLocation(locationIdx);
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

  const closeActionDialog = () => {
    setActionDialogIdx(null);
    setSelectedActionData(null);
    setEditingActionIdx(null);
    setEditAllMode(false);
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

  const openCommonActionDialog = () => {
    setEditingAreaStatus(null);
    setSelectedCommonActionType('light_status');
    setSelectedOccupancySetting(null);
    setSelectedZoneType('switched');
    setLightStatusSettings((prev) => ({
      ...prev,
      switched: { on_off: 'On' },
    }));
    setShowCommonActionDialog(true);
  };

  // Handle occupancy setting selection
  const handleOccupancySettingSelect = (setting) => {
    // Only update the state, don't apply to locations yet - wait for "Apply to All" button
    setSelectedOccupancySetting(setting);
  };

  // Apply common action to all areas - UPDATED to ensure action is applied
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
          ? {
              ...location,
              actions: useQuickControlActionMerging
                ? applyCommonActionToActions(location.actions, commonAction)
                : [commonAction]
            }
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
        actions: useQuickControlActionMerging
          ? applyCommonActionToActions(location.actions, commonAction)
          : [commonAction]
      })));
    } else if (selectedCommonActionType === 'occupancy' && selectedOccupancySetting) {
      const commonAction = {
        type: "occupancy",
        occupancy_setting: selectedOccupancySetting
      };
      
      setLocations(prev => prev.map(location => ({
        ...location,
        actions: useQuickControlActionMerging
          ? applyCommonActionToActions(location.actions, commonAction)
          : [commonAction]
      })));
    }
    
    // Close the dialog and reset
    resetCommonActionDialog();
  };

  // Don't auto-apply when dialog opens - wait for "Apply to All" button

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

  const customizedDetailsShellStyle = isCustomizedScheduleForm && scheduleFormLayout
    ? scheduleFormLayout.getScheduleDetailsViewportShellStyle({ isLargeScreen, isDesktop })
    : null;

  const detailsPagePad = isLargeScreen ? 40 : isDesktop ? 32 : 24;
  const detailsOuterStyle = customizedDetailsShellStyle ?? {
    maxWidth: isLargeScreen ? 1600 : isDesktop ? 1400 : 1200,
    margin: "0 auto",
    // Longhands only — fixed action bar also sets paddingBottom/paddingRight.
    paddingTop: detailsPagePad,
    paddingLeft: detailsPagePad,
    paddingBottom: detailsPagePad,
    paddingRight: detailsPagePad,
    borderRadius: 20,
    minHeight: useAdvancedLocationsPanel ? 0 : 500,
    background: "none",
    position: "relative",
    ...(useAdvancedLocationsPanel ? {
      flex: 1,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      overflow: 'hidden',
    } : {}),
    ...(useFixedPageActionBar
      ? {
          ...schedulePageWithFixedActionBarStyle(isLargeScreen, isDesktop, isTablet),
          paddingBottom: DETAILS_FIXED_ACTION_BAR_BOTTOM_CLEARANCE,
        }
      : {}),
  };

  const detailsMainRowStyle = isCustomizedScheduleForm
    ? {
        display: "flex",
        gap: isLargeScreen ? 32 : isDesktop ? 28 : 24,
        alignItems: "stretch",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
      }
    : useAdvancedLocationsPanel
      ? {
          display: "flex",
          gap: isLargeScreen ? 32 : isDesktop ? 24 : 20,
          alignItems: "stretch",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }
      : {
          display: "flex",
          gap: isLargeScreen ? 32 : isDesktop ? 28 : 24,
          alignItems: "flex-start",
        };

  const detailsActionBarStyle = isCustomizedScheduleForm && scheduleFormLayout
    ? scheduleFormLayout.getScheduleDetailsActionBarStyle(isLargeScreen, isDesktop, false)
    : {
        display: "flex",
        justifyContent: "flex-end",
        gap: isLargeScreen ? 20 : isDesktop ? 18 : 16,
        marginTop: isLargeScreen ? 40 : isDesktop ? 35 : 32,
      };

  const detailsSaveDisabled =
    !scheduleName.trim() ||
    locations.length === 0 ||
    updateStatus === 'loading' ||
    locations.some((location) => !location.actions || location.actions.length === 0);

  const fixedActionBlue = '#1565C0';

  const detailsPermissionButtonStyle = (enabled) =>
    useFixedPageActionBar
      ? {
          background: enabled ? fixedActionBlue : '#666',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '10px 28px',
          fontWeight: 500,
          fontSize: 14,
          cursor: enabled ? 'pointer' : 'not-allowed',
          opacity: enabled ? 1 : 0.6,
        }
      : useAdvancedLocationsPanel && advancedPrimaryButtonStyle
        ? advancedPrimaryButtonStyle(isLargeScreen, isDesktop, { disabled: !enabled })
        : {
            padding: isLargeScreen ? "12px 32px" : isDesktop ? "11px 30px" : "10px 28px",
            borderRadius: 8,
            border: "none",
            background: enabled ? buttonColor : "#666",
            color: enabled ? "#fff" : "#999",
            fontWeight: 500,
            fontSize: isLargeScreen ? 16 : isDesktop ? 15 : 14,
            cursor: enabled ? "pointer" : "not-allowed",
            opacity: enabled ? 1 : 0.7,
          };

  const detailsActionBar = (
    <div
      className={useAdvancedLocationsPanel ? 'quick-control-details-action-bar' : undefined}
      style={
        useFixedPageActionBar
          ? scheduleFixedActionBarStyle(isLargeScreen, isDesktop, isTablet)
          : useAdvancedLocationsPanel && getAdvancedQuickControlDetailsActionBarStyle
            ? getAdvancedQuickControlDetailsActionBarStyle()
            : detailsActionBarStyle
      }
    >
      {!editMode ? (
        <>
          <button
            onClick={canEditSchedule() ? handleCopy : undefined}
            disabled={!canEditSchedule()}
            style={detailsPermissionButtonStyle(canEditSchedule())}
          >
            Copy
          </button>
          <button
            onClick={canEditSchedule() ? handleModify : undefined}
            disabled={!canEditSchedule()}
            style={detailsPermissionButtonStyle(canEditSchedule())}
          >
            Modify
          </button>
          <button
            onClick={canEditSchedule() ? handleDelete : undefined}
            disabled={deleteStatus === 'loading' || !canEditSchedule()}
            style={detailsPermissionButtonStyle(
              deleteStatus !== 'loading' && canEditSchedule()
            )}
          >
            {deleteStatus === 'loading' ? 'Deleting...' : 'Delete'}
          </button>
          <button
            onClick={handleCancel}
            style={
              useFixedPageActionBar
                ? {
                    background: fixedActionBlue,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 28px',
                    fontWeight: 500,
                    fontSize: 14,
                    cursor: 'pointer',
                  }
                : useAdvancedLocationsPanel && advancedPrimaryButtonStyle
                  ? advancedPrimaryButtonStyle(isLargeScreen, isDesktop)
                  : {
                      padding: isLargeScreen ? "12px 32px" : isDesktop ? "11px 30px" : "10px 28px",
                      borderRadius: 8,
                      border: "none",
                      background: buttonColor,
                      color: "#fff",
                      fontWeight: 500,
                      fontSize: isLargeScreen ? 16 : isDesktop ? 15 : 14,
                      cursor: "pointer",
                    }
            }
          >
            Close
          </button>
        </>
      ) : (
        <>
          <button
            onClick={handleCancel}
            style={
              useFixedPageActionBar
                ? {
                    background: '#fff',
                    color: fixedActionBlue,
                    border: `1px solid ${fixedActionBlue}`,
                    borderRadius: 8,
                    padding: '10px 28px',
                    fontWeight: 500,
                    fontSize: 14,
                    cursor: 'pointer',
                  }
                : useAdvancedLocationsPanel && advancedPrimaryButtonStyle
                  ? advancedPrimaryButtonStyle(isLargeScreen, isDesktop)
                  : {
                      padding: "10px 28px",
                      borderRadius: 8,
                      border: "none",
                      background: buttonColor,
                      color: "#fff",
                      fontWeight: 500,
                      cursor: "pointer",
                    }
            }
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={detailsSaveDisabled}
            style={
              useFixedPageActionBar
                ? {
                    background: detailsSaveDisabled ? '#888' : fixedActionBlue,
                    color: '#fff',
                    border: detailsSaveDisabled ? '1px solid #888' : `1px solid ${fixedActionBlue}`,
                    borderRadius: 8,
                    padding: '10px 28px',
                    fontWeight: 500,
                    fontSize: 14,
                    cursor: detailsSaveDisabled ? 'not-allowed' : 'pointer',
                  }
                : useAdvancedLocationsPanel && advancedPrimaryButtonStyle
                  ? advancedPrimaryButtonStyle(isLargeScreen, isDesktop, { disabled: detailsSaveDisabled })
                  : {
                      padding: "10px 28px",
                      borderRadius: 8,
                      border: "none",
                      background: detailsSaveDisabled ? "#888" : buttonColor,
                      color: "#fff",
                      fontWeight: 500,
                      cursor: detailsSaveDisabled ? "not-allowed" : "pointer",
                    }
            }
          >
            {updateStatus === 'loading' ? 'Saving...' : 'Save'}
          </button>
        </>
      )}
    </div>
  );

  const renderDetailsActionButtons = () => detailsActionBar;

  return (
    <div
      className={
        isCustomizedScheduleForm
          ? 'schedule-details-shell'
          : useAdvancedLocationsPanel
            ? 'schedule-form-shell schedule-form-shell--details'
            : undefined
      }
      style={detailsOuterStyle}
    >
      {/* 1. Top right: Enable/Disable and Trigger */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: isLargeScreen ? 20 : isDesktop ? 18 : 16,
          marginBottom: useAdvancedLocationsPanel
            ? (isLargeScreen ? 16 : isDesktop ? 14 : 12)
            : (isLargeScreen ? 32 : isDesktop ? 28 : 24),
          flexShrink: 0,
        }}
      >
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
      <div style={detailsMainRowStyle}>
        {/* Left column: Schedule details */}
        <div
          className={useAdvancedLocationsPanel ? 'schedule-form-left-panel' : undefined}
          style={{
          flex: useAdvancedLocationsPanel ? "0 0 400px" : "0 1 400px",
          minWidth: isLargeScreen ? 380 : isDesktop ? 360 : 340,
          maxWidth: isLargeScreen ? 480 : isDesktop ? 440 : 420,
          padding: formTheme.panelShellPadding,
          ...(isCustomizedScheduleForm ? {
            alignSelf: 'stretch',
            overflowY: 'auto',
            minHeight: 0,
          } : {}),
          ...(formTheme.useSeparateFieldCards ? {
            display: 'flex',
            flexDirection: 'column',
            gap: formTheme.fieldCardGap,
          } : {}),
          ...(formTheme.panelShellBg ? {
            background: formTheme.panelShellBg,
            borderRadius: 16,
            boxSizing: 'border-box',
          } : {}),
        }}>
          {/* Schedule Name */}
          <div style={scheduleFieldCardShell(formTheme)}>
            <label style={{ 
              fontWeight: 500, 
              color: formTheme.labelColor, 
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
                border: formTheme.inputBorder || '1px solid #ccc',
                fontSize: isLargeScreen ? 16 : isDesktop ? 15 : 14,
                background: editMode ? (formTheme.dayUnselectedBg || 'white') : formTheme.inputDisabledBg,
                color: editMode ? formTheme.inputColor : '#888',
                boxSizing: 'border-box',
              }}
            />
          </div>
          {/* Part of (Group) */}
          <div style={scheduleFieldCardShell(formTheme)}>
            <label style={{ fontWeight: 500, color: formTheme.labelColor, display: 'block', marginBottom: 8 }}>
              Part of
            </label>
            {editMode ? (
              isAdvancedScheduleForm ? (
                <Select
                  className="schedule-filter-select"
                  value={scheduleGroup}
                  onChange={(e) => setScheduleGroup(e.target.value)}
                  disabled={groupsLoading}
                  fullWidth
                  displayEmpty
                  MenuProps={scheduleFilterMenuProps}
                  sx={{
                    ...scheduleSelectFieldSx,
                    backgroundColor: formTheme.dayUnselectedBg || 'white',
                    color: formTheme.inputColor,
                    '& .MuiSelect-select': {
                      py: '12px',
                      px: '12px',
                    },
                  }}
                >
                  {groups && groups.map((group) => (
                    <MenuItem key={group.id} value={String(group.id)}>
                      {group.name}
                    </MenuItem>
                  ))}
                </Select>
              ) : (
                <select
                  value={scheduleGroup}
                  onChange={e => setScheduleGroup(e.target.value)}
                  disabled={groupsLoading}
                  style={{
                    width: '100%',
                    padding: 12,
                    borderRadius: 8,
                    border: formTheme.inputBorder || '1px solid #ccc',
                    fontSize: 14,
                    backgroundColor: formTheme.dayUnselectedBg || 'white',
                    color: formTheme.inputColor,
                    boxSizing: 'border-box',
                  }}
                >
                  {groups && groups.map((group) => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              )
            ) : (
              <div
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 8,
                  border: formTheme.inputBorder || '1px solid #ccc',
                  fontSize: 14,
                  background: formTheme.readonlyFieldBg,
                  color: formTheme.inputColor,
                  minHeight: 44,
                  boxSizing: 'border-box',
                }}
              >
                {groupName}
              </div>
            )}
          </div>
          {/* Grouped Card for Day/Date, Time, Keep Until */}
          <div style={scheduleFormSectionsColumn(formTheme, { isLargeScreen, isDesktop })}>
            {/* Select Day / Date */}
            <div style={scheduleFormSectionCard(formTheme)}>
              <label style={{ fontWeight: 500, fontSize: 14, color: formTheme.sectionTextColor, display: 'block', marginBottom: 5 }}>
                Select Day / Date
              </label>
              <div style={{ display: 'flex', fontSize: 14, gap: 10, marginBottom: 12, alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', color: formTheme.sectionTextColor, marginRight: 10 }}>
                  <input
                    type="radio"
                    value="weekly"
                    checked={scheduleType === "weekly"}
                    onChange={e => setScheduleType(e.target.value)}
                    disabled={!editMode}
                    style={{ 
                      marginRight: 8,
                      accentColor: radioFill,
                      WebkitAppearance: 'none',
                      appearance: 'none',
                      width: '12px',
                      height: '12px',
                      border: '2px solid #ccc',
                      borderRadius: '50%',
                      backgroundColor: scheduleType === "weekly" ? radioFill : 'transparent',
                      position: 'relative'
                    }}
                  />
                  Weekly
                </label>
                <label style={{ display: 'flex', fontSize: 14, alignItems: 'center', color: formTheme.sectionTextColor, marginRight: 6 }}>
                  <input
                    type="radio"
                    value="annual"
                    checked={scheduleType === "annual"}
                    onChange={e => handleScheduleTypeChange(e.target.value)}
                    disabled={!editMode}
                    style={{ 
                      marginRight: 8,
                      accentColor: radioFill,
                      WebkitAppearance: 'none',
                      appearance: 'none',
                      width: '12px',
                      height: '12px',
                      border: '2px solid #ccc',
                      borderRadius: '50%',
                      backgroundColor: scheduleType === "annual" ? radioFill : 'transparent',
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
                        border: formTheme.annualAddBorder,
                        background: formTheme.annualAddBg,
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
                        border: formTheme.dayUnselectedBorder,
                        background: selectedDays.includes(day) ? buttonColor : (formTheme.dayUnselectedBg || 'white'),
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
                            background: formTheme.annualChipRemoveBg,
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
            <div style={scheduleFormSectionCard(formTheme)}>
              <label style={{ fontWeight: 500, fontSize: 14, color: formTheme.sectionTextColor, display: 'block', marginBottom: 8 }}>
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
                    background: editMode ? 'white' : formTheme.inputDisabledBg
                  }}
                />
                <span style={{ color: formTheme.colonColor, fontSize: 18 }}>:</span>
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
                    background: editMode ? 'white' : formTheme.inputDisabledBg
                  }}
                />
              </div>
            </div>

            {/* Keep Until */}
            <div style={scheduleFormSectionCard(formTheme)}>
              <label style={{ fontWeight: 500, fontSize: 14, color: formTheme.sectionTextColor, display: 'block', marginBottom: 8 }}>
                Keep Until
              </label>
              <div style={{ display: 'flex', gap: 16 }}>
                <label style={{ display: 'flex', fontSize: 14, alignItems: 'center', color: formTheme.sectionTextColor }}>
                  <input
                    type="radio"
                    value="forever"
                    checked={keepUntil === "forever" && specificDates.length === 0}
                    onChange={e => setKeepUntil(e.target.value)}
                    disabled={!editMode || specificDates.length > 0}
                    style={{ 
                      marginRight: 8,
                      accentColor: radioFill,
                      WebkitAppearance: 'none',
                      appearance: 'none',
                      width: '12px',
                      height: '12px',
                      border: '2px solid #ccc',
                      borderRadius: '50%',
                      backgroundColor: (keepUntil === "forever" && specificDates.length === 0) ? radioFill : 'transparent',
                      position: 'relative'
                    }}
                  />
                  Forever
                </label>
                <label style={{ display: 'flex', fontSize: 14, alignItems: 'center', color: formTheme.sectionTextColor }}>
                  <input
                    type="radio"
                    value="custom"
                    checked={keepUntil === "custom" || specificDates.length > 0}
                    onChange={e => setKeepUntil(e.target.value)}
                    disabled={!editMode}
                    style={{ 
                      marginRight: 8,
                      accentColor: radioFill,
                      WebkitAppearance: 'none',
                      appearance: 'none',
                      width: '12px',
                      height: '12px',
                      border: '2px solid #ccc',
                      borderRadius: '50%',
                      backgroundColor: (keepUntil === "custom" || specificDates.length > 0) ? radioFill : 'transparent',
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
                        <span style={{ color: formTheme.colonColor, alignSelf: 'center' }}>to</span>
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
                          background: editMode ? 'white' : formTheme.inputDisabledBg,
                          color: editMode ? formTheme.inputColor : '#888',
                          minWidth: 120
                        }}
                      />
                      <span style={{ color: formTheme.colonColor, alignSelf: 'center' }}>to</span>
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
                          background: editMode ? 'white' : formTheme.inputDisabledBg,
                          color: editMode ? formTheme.inputColor : '#888',
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
        {isCustomizedScheduleForm ? (
        <div style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          height: "100%",
          overflow: "hidden",
          maxWidth: isLargeScreen ? 800 : isDesktop ? 700 : 600,
          ...scheduleRightPanelShell(formTheme, { isLargeScreen, isDesktop }),
        }}>
          {/* Table-like header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            ...(formTheme.listHeaderBg ? {
              background: formTheme.listHeaderBg,
              color: formTheme.listHeaderColor,
              borderBottom: formTheme.listHeaderBorderBottom,
              padding: formTheme.listHeaderPadding,
              fontWeight: formTheme.listHeaderFontWeight,
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
              marginBottom: 8,
            } : {
              color: formTheme.headerTextColor,
              borderBottom: formTheme.listHeaderBorderBottom || '1px solid #ccc',
              paddingBottom: isLargeScreen ? 12 : isDesktop ? 10 : 8,
              marginBottom: isLargeScreen ? 12 : isDesktop ? 10 : 8,
              fontWeight: formTheme.listHeaderFontWeight || 500,
            }),
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
                onClick={openCommonActionDialog}
              >
                + Add Common Action
              </span>
            )}
          </div>

          {/* Table-like list of locations and actions */}
          <div style={scheduleRightListScrollStyle}>
            {locations.map((loc, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                borderBottom: `1px solid ${formTheme.listBorderColor}`,
                padding: '8px 0',
                minHeight: 44,
                background: idx % 2 === 0 ? formTheme.listRowAltBg : 'transparent',
                gap: 16
              }}>
                <div style={{
                  flex: '0 0 300px',
                  fontSize: 15,
                  color: formTheme.listTextColor,
                  textAlign: 'left',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {decodeHtmlEntities(formatScheduleLocationLabel(loc))}
                </div>
                <div style={{
                  flex: '1 1 300px',
                  fontSize: 15,
                  color: formTheme.listTextColor,
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}>
                  {(loc.actions && loc.actions.length > 0) ? (
                    <>
                      {loc.actions.map((a, i) => (
                        <div key={i} style={{
                          marginBottom: 4,
                          wordWrap: 'break-word',
                          wordBreak: 'break-word',
                          lineHeight: '1.4'
                        }}>
                          {renderActionDisplay(a)}
                        </div>
                      ))}
                      {editMode && (
                        <button
                          type="button"
                          onClick={() => handleOpenActionDialog(idx)}
                          style={{
                            background: 'transparent',
                            color: buttonColor,
                            border: `1px solid ${buttonColor}`,
                            borderRadius: 4,
                            padding: '4px 8px',
                            cursor: 'pointer',
                            fontSize: 12,
                            alignSelf: 'flex-start',
                            marginTop: 4,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          + Add Action
                        </button>
                      )}
                    </>
                  ) : editMode ? (
                    <button
                      type="button"
                      onClick={() => handleOpenActionDialog(idx)}
                      style={{
                        background: buttonColor,
                        border: 'none',
                        borderRadius: 4,
                        color: '#fff',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: 12,
                        alignSelf: 'flex-start',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Add Action
                    </button>
                  ) : (
                    <span style={{ color: '#888' }}>No actions</span>
                  )}
                </div>
                {editMode && (
                  <div style={detailsRowActionControlsStyle(180)}>
                    {loc.actions && loc.actions.length > 0 && (
                      <button
                        onClick={() => handleEditButtonClick(idx, loc.actions)}
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
                        Edit Action
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteButtonClick(idx, loc.actions)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: formTheme.listTextColor,
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
        </div>
        ) : (
        <ScheduleLocationsPanel
          locations={locations}
          formTheme={formTheme}
          buttonColor={buttonColor}
          isLargeScreen={isLargeScreen}
          isDesktop={isDesktop}
          useAdvancedLayout={useAdvancedLocationsPanel}
          layoutHelpers={scheduleAdvancedLocationsPanel}
          editMode={editMode}
          onAddLocation={() => setShowLocationDialog(true)}
          onAddCommonAction={openCommonActionDialog}
          onOpenActionDialog={handleOpenActionDialog}
          onEditAction={handleEditButtonClick}
          onDeleteLocation={handleDeleteButtonClick}
          renderActionDisplay={renderActionDisplay}
          formatLocationLabel={(loc) => decodeHtmlEntities(formatScheduleLocationLabel(loc))}
          emptyActionLabel="No actions"
          useFixedActionBarListScroll={useFixedPageActionBar && !useAdvancedLocationsPanel}
          actionBar={useFixedPageActionBar ? null : detailsActionBar}
        />
        )}

        {/* Common Action Dialog */}
        {renderScheduleModalLayer(
          usePortaledScheduleModals,
          showCommonActionDialog && (
          <div style={{
            position: 'fixed',
            left: 0, top: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.25)",
            zIndex: usePortaledScheduleModals ? SCHEDULE_MODAL_OVERLAY_Z_INDEX : 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <div
              style={isAdvancedScheduleForm
                ? scheduleModalPanelStyle(formTheme, {
                  minWidth: 400,
                  maxWidth: 600,
                  maxHeight: '80vh',
                  overflow: 'auto',
                })
                : scheduleLegacyModalPanelStyle(formTheme, buttonColor, {
                  minWidth: 400,
                  maxWidth: 600,
                  maxHeight: '80vh',
                  overflow: 'auto',
                })}
            >
              <div style={isAdvancedScheduleForm
                ? scheduleModalTitleStyle(formTheme)
                : scheduleLegacyModalTitleStyle(buttonColor)}>
                {editingAreaStatus ? 'Edit Action' : 'Add Common Action'}
              </div>
              
              {/* Action Type Dropdown */}
              <div style={{ marginBottom: 16 }}>
                <div style={isAdvancedScheduleForm
                  ? scheduleModalLabelStyle(formTheme)
                  : { fontWeight: 600, marginBottom: 8, color: buttonColor }}>
                  Select Action Type
                </div>
                {isAdvancedScheduleForm ? (
                  <Select
                    className="schedule-filter-select"
                    value={selectedCommonActionType}
                    onChange={(e) => handleCommonActionTypeSelect(e.target.value)}
                    fullWidth
                    disabled={!!editingAreaStatus}
                    MenuProps={isAdvancedScheduleForm ? scheduleModalFilterMenuProps : scheduleFilterMenuProps}
                    sx={scheduleSelectFieldSx}
                  >
                    <MenuItem value="light_status">Light Status</MenuItem>
                    {!editingAreaStatus && <MenuItem value="occupancy">Occupancy Setting</MenuItem>}
                  </Select>
                ) : (
                  <select
                    value={selectedCommonActionType}
                    onChange={(e) => handleCommonActionTypeSelect(e.target.value)}
                    disabled={!!editingAreaStatus}
                    style={scheduleModalSelectStyle(formTheme)}
                  >
                    <option value="light_status">Light Status</option>
                    {!editingAreaStatus && <option value="occupancy">Occupancy Setting</option>}
                  </select>
                )}
              </div>

              {/* Light Status Options */}
              {selectedCommonActionType === 'light_status' && (
                <div style={{ marginTop: 16 }}>
                  {/* Simplified: Only On/Off options */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={isAdvancedScheduleForm
                      ? scheduleModalLabelStyle(formTheme)
                      : { fontWeight: 600, marginBottom: 8, color: isLightScheduleForm ? formTheme.modalSectionLabelColor : formTheme.sectionTextColor }}>
                      Light State
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <label style={isAdvancedScheduleForm
                        ? scheduleModalRadioLabelStyle(formTheme)
                        : { display: 'flex', alignItems: 'center', color: formTheme.sectionTextColor }}>
                        <input
                          type="radio"
                          value="On"
                          checked={lightStatusSettings.switched.on_off === 'On'}
                          onChange={(e) => handleLightStatusSettingChange('switched', 'on_off', e.target.value)}
                          style={{ 
                            marginRight: 8,
                            accentColor: radioFill,
                            WebkitAppearance: 'none',
                            appearance: 'none',
                            width: '12px',
                            height: '12px',
                            border: '2px solid #ccc',
                            borderRadius: '50%',
                            backgroundColor: lightStatusSettings.switched.on_off === 'On' ? radioFill : 'transparent',
                            position: 'relative'
                          }}
                        />
                        On
                      </label>
                      <label style={isAdvancedScheduleForm
                        ? scheduleModalRadioLabelStyle(formTheme)
                        : { display: 'flex', alignItems: 'center', color: formTheme.sectionTextColor }}>
                        <input
                          type="radio"
                          value="Off"
                          checked={lightStatusSettings.switched.on_off === 'Off'}
                          onChange={(e) => handleLightStatusSettingChange('switched', 'on_off', e.target.value)}
                          style={{ 
                            marginRight: 8,
                            accentColor: radioFill,
                            WebkitAppearance: 'none',
                            appearance: 'none',
                            width: '12px',
                            height: '12px',
                            border: '2px solid #ccc',
                            borderRadius: '50%',
                            backgroundColor: lightStatusSettings.switched.on_off === 'Off' ? radioFill : 'transparent',
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
                  <div style={isAdvancedScheduleForm
                    ? scheduleModalLabelStyle(formTheme)
                    : { fontWeight: 600, marginBottom: 8, color: formTheme.sectionTextColor }}>
                    Occupancy Setting
                  </div>
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
                  {editingAreaStatus ? 'Update' : 'Apply to All'}
                </button>
                <button
                  onClick={resetCommonActionDialog}
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
          )
        )}

        {/* Action Dialog */}
        {renderScheduleModalLayer(
          usePortaledScheduleModals,
          actionDialogIdx !== null && (
          <div style={{
            position: 'fixed',
            left: 0, top: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.25)",
            zIndex: usePortaledScheduleModals ? SCHEDULE_MODAL_OVERLAY_Z_INDEX : 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <div
              style={isAdvancedScheduleForm
                ? scheduleModalPanelStyle(formTheme, { minWidth: 340 })
                : scheduleLegacyModalPanelStyle(formTheme, buttonColor, { minWidth: 340 })}
            >
              <div style={isAdvancedScheduleForm
                ? scheduleModalTitleStyle(formTheme)
                : scheduleLegacyModalTitleStyle(buttonColor)}>
                {selectedActionData || editingActionIdx != null || editAllMode ? 'Edit' : 'Add'} Action
              </div>
              <Action
                areaId={locations[actionDialogIdx]?.areaId}
                onActionSelect={action => setSelectedActionData(action)}
                initialAction={selectedActionData}
                menuProps={usePortaledScheduleModals
                  ? resolveScheduleModalFilterMenuProps(scheduleCalendarChrome)
                  : scheduleFilterMenuProps}
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
                  {selectedActionData || editingActionIdx != null || editAllMode ? 'Update' : 'Add'} Action
                </button>
                <button
                  onClick={closeActionDialog}
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
          )
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
          message={`Are you sure you want to delete location "${decodeHtmlEntities(formatScheduleLocationLabel(locationToDelete?.location || {}))}"?`}
          onConfirm={confirmDeleteLocation}
          onCancel={() => {
            setShowDeleteLocationDialog(false);
            setLocationToDelete(null);
          }}
        />

        <ConfirmDialog
          open={showDeleteActionDialog}
          title="Delete Action"
          message={`Are you sure you want to delete "${getQuickControlActionShortLabel(actionToDelete?.action)}" from "${decodeHtmlEntities(formatScheduleLocationLabel(actionToDelete?.location || {}))}"?`}
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
          buttonColor={buttonColor}
          onPick={(pick) => {
            if (actionChooser?.mode === 'delete') handleChooserPickDelete(pick);
            else handleChooserPickEdit(pick);
          }}
          onCancel={() => setActionChooser(null)}
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

      {isCustomizedScheduleForm && renderDetailsActionButtons()}
      {useFixedPageActionBar &&
        typeof document !== 'undefined' &&
        createPortal(renderDetailsActionButtons(), document.body)}
    </div>
  );
};

export default ScheduleDetails;
