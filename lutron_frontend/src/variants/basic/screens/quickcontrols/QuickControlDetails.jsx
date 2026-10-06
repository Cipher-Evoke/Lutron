import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchQuickControlDetails,
  triggerQuickControl,
  deleteQuickControl,
  updateQuickControl,
  createQuickControl,
  clearSelectedControl
} from '../../redux/slice/quickcontrols/quickControlSlice';
import { useNavigate, useParams } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { ConfirmDialog, Toast } from "../../utils/FeedbackUI";
import AreaTreeDialog from './AreaTreeDialog';
import Action from './Action';
import { BaseUrl } from '../../BaseUrl';
import { UseAuth } from '../../customhooks/UseAuth';
import { selectApplicationTheme } from '../../redux/slice/theme/themeSlice';
import { DEFAULT_APP_CONTENT, isWhiteAreaPickerChrome, onContentColors } from '../../utils/themeOnSurface';
import { fetchFloors, selectFloors } from "../../redux/slice/floor/floorSlice";
import { dispatchFetchFloorsOnce } from "../../../../shared/utils/bootstrapFetchGuards";
import {
  SCHEDULE_FIXED_ACTION_BAR_BOTTOM,
  scheduleFixedActionBarStyle,
  schedulePageWithFixedActionBarStyle,
} from "../../../../utils/fixedActionBarStyles";
import { detailsRowActionControlsStyle } from "../../../../utils/detailsRowActionControlsStyle";
import {
  applyCommonActionToActions,
  stripActionSource,
  tagAreasWithLoadedActions,
  withIndividualSource,
} from "../../../../utils/scheduleActionPriority";
import ActionChooserModal from '../../../../shared/quickcontrols/ActionChooserModal';
import { getQuickControlActionShortLabel } from '../../../../shared/quickcontrols/quickControlActionLabels';
import {
  convertApiActionToUiAction,
  expandQuickControlActionData,
  lightStatusSettingsFromAreaAction,
  locationHasSceneAction,
  locationHasZoneAction,
  mergeExpandedActionsIntoLocation,
} from '../../../../shared/quickcontrols/zoneActionHelpers';
import { createSingleFlight } from "../../../../shared/utils/createSingleFlight";

/** Scrollable table body so fixed action buttons do not cover rows. */
const quickControlDetailsTableScrollStyle = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  overflowX: 'hidden',
};

const QUICK_CONTROL_DETAILS_BOTTOM_CLEARANCE = 120;

const QuickControlDetails = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const appTheme = useSelector(selectApplicationTheme);
  const buttonColor = appTheme?.application_theme?.button || '#232323';
  const contentColor = appTheme?.application_theme?.content || DEFAULT_APP_CONTENT;
  const whiteChrome = isWhiteAreaPickerChrome(contentColor);
  const ACTION_BLUE = whiteChrome ? '#1565C0' : buttonColor;
  const onContent = onContentColors(contentColor);
  const dialogLabelColor = whiteChrome ? '#000000' : buttonColor;
  const listChromeText = onContent.isLight ? onContent.primary : '#ffffff';
  const listChromeMuted = onContent.isLight ? onContent.secondary : '#888888';

  // Get user authentication and role
  const { role } = UseAuth();
  const userProfile = useSelector((state) => state.user?.profile);
  const floors = useSelector(selectFloors);

  // Direct role checking for Quick Control permissions
  const canCreateQuickControl = () => {
    if (role === 'Superadmin' || role === 'Admin') {
      return true;
    }
    if (role === 'Operator' && userProfile && userProfile.floors) {
      const hasMonitorControlEdit = userProfile.floors.some(f => f.floor_permission === 'monitor_control_edit');
      return hasMonitorControlEdit;
    }
    return false;
  };

  const canModifyQuickControl = () => {
    if (role === 'Superadmin' || role === 'Admin') {
      return true;
    }
    if (role === 'Operator' && userProfile && userProfile.floors) {
      const hasMonitorControlEdit = userProfile.floors.some(f => f.floor_permission === 'monitor_control_edit');
      return hasMonitorControlEdit;
    }
    return false;
  };

  const canDeleteQuickControl = () => {
    if (role === 'Superadmin' || role === 'Admin') {
      return true;
    }
    if (role === 'Operator' && userProfile && userProfile.floors) {
      const hasMonitorControlEdit = userProfile.floors.some(f => f.floor_permission === 'monitor_control_edit');
      return hasMonitorControlEdit;
    }
    return false;
  };

  const canTriggerQuickControl = () => {
    if (role === 'Superadmin' || role === 'Admin') {
      return true;
    }
    if (role === 'Operator' && userProfile && userProfile.floors) {
      const hasMonitorControl = userProfile.floors.some(f =>
        f.floor_permission === 'monitor_control' || f.floor_permission === 'monitor_control_edit'
      );
      return hasMonitorControl;
    }
    return false;
  };

  // Add responsive state for tablets
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const isTabletSize = width >= 768 && width <= 1024;
      setIsTablet(isTabletSize);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    dispatchFetchFloorsOnce(dispatch, fetchFloors, Boolean(floors?.length));
  }, [dispatch, floors?.length]);

  const {
    selectedControl,
    selectedControlLoading,
    triggerStatus,
    deleteStatus,
    updateStatus,
    error
  } = useSelector((state) => state.quickControl);

  const floorNameById = new Map(
    (floors || [])
      .map((f) => {
        const fid = f?.id ?? f?.floor_id ?? f?.floorId
        const name = f?.floor_name ?? f?.floorName ?? f?.name
        return fid != null && name ? [String(fid), String(name)] : null
      })
      .filter(Boolean)
  );

  const areaIdToFloor = new Map(
    (floors || [])
      .flatMap((f) => {
        const fid = f?.id ?? f?.floor_id ?? f?.floorId
        const fname = f?.floor_name ?? f?.floorName ?? f?.name
        const processors = Array.isArray(f?.processors) ? f.processors : []
        return processors.flatMap((p) => {
          const areas = Array.isArray(p?.areas) ? p.areas : []
          return areas
            .map((a) => {
              const aid = a?.area_id ?? a?.id ?? a?.areaId
              return aid != null && fid != null ? [String(aid), { floorId: fid, floorName: fname || "" }] : null
            })
            .filter(Boolean)
        })
      })
      .filter(Boolean)
  );

  const [editMode, setEditMode] = useState(false);
  const [editableControl, setEditableControl] = useState(null);
  const [isCopyMode, setIsCopyMode] = useState(false);
  const location = useLocation();

  const isCopyEdit = location?.state?.isCopy === true;
  const [isEditing, setIsEditing] = useState(isCopyEdit || false);

  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "" });

  const [showDeleteQuickControlDialog, setShowDeleteQuickControlDialog] = useState(false);
  const [showDeleteActionDialog, setShowDeleteActionDialog] = useState(false);
  const [actionToDelete, setActionToDelete] = useState(null);

  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [actionDialogIdx, setActionDialogIdx] = useState(null);
  const [selectedActionData, setSelectedActionData] = useState(null);
  const [editingActionIdx, setEditingActionIdx] = useState(null);
  const [editAllMode, setEditAllMode] = useState(false);
  const [actionChooser, setActionChooser] = useState(null); // { mode, locationIdx }

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

  const [zoneNames, setZoneNames] = useState({});

  const decodeHtmlEntities = (text) => {
    if (!text) return text;
    return text
      .replace(/&gt;/g, '>')
      .replace(/&lt;/g, '<')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  };

  const renderActionDisplay = (action) => {
    if (action.type === "area_status") {
      const status = action.area_status || "Off";
      return <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>Area Status: {status}</div>;
    }

    if (action.type === "zone_status") {
      const status = action.zone_status || action.switched_state;
      const brightness = action.zone_brightness || action.level;
      const temperature = action.zone_temperature || action.kelvin;
      const zoneType = action.zone_type;

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

      return <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>Area Status: {status || "Off"}</div>;
    }

    if (action.type === "zone" && action.zone) {
      const zoneName = action.zone.name || action.zone.id || 'Zone';
      const zoneType = action.zone.type;
      const values = action.values || {};

      let displayText = `Zone: ${zoneName}`;

      if (zoneType === "switched") {
        displayText += ` (${values.on_off || "Off"})`;
      } else if (zoneType === "dimmed") {
        if (values.brightness !== undefined) {
          let brightnessValue = values.brightness;
          if (typeof brightnessValue === 'string') {
            brightnessValue = brightnessValue.includes('%') ? brightnessValue : `${brightnessValue}%`;
          } else {
            brightnessValue = `${brightnessValue}%`;
          }
          displayText += ` (On, ${brightnessValue})`;
        } else {
          displayText += ` (On)`;
        }
      } else if (zoneType === "whitetune") {
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
          displayText += ` (On)`;
        }
      } else {
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

    if (action.type === "occupancy") {
      let occLabel = "";
      if (action.occupancy_setting) {
        const setting = action.occupancy_setting;
        if (setting.toLowerCase() === "disabled") occLabel = "Disabled";
        else if (setting.toLowerCase() === "auto") occLabel = "Auto";
        else if (setting.toLowerCase() === "vacancy") occLabel = "Vacancy";
        else occLabel = setting;
      } else if (action.action) {
        const setting = action.action;
        if (setting.toLowerCase() === "disabled") occLabel = "Disabled";
        else if (setting.toLowerCase() === "auto") occLabel = "Auto";
        else if (setting.toLowerCase() === "vacancy") occLabel = "Vacancy";
        else occLabel = setting;
      }
      return <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>Occupancy Setting: {occLabel}</div>;
    }

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
        shadeLevel = shadeLevel.includes('%') ? shadeLevel : `${shadeLevel}%`;
      }
      return <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>Shade: {action.shade_group_name} ({shadeLevel})</div>;
    }

    if (action.type === "device" && action.device) {
      return <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>Device: {action.device.name}</div>;
    }

    return <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>Unknown action</div>;
  };

  const fetchZoneNames = async (areaId, zoneId) => {
    try {
      const response = await BaseUrl.post("/area/zone_status", { area_id: areaId });
      const zones = response.data?.zones || [];
      const zone = zones.find(z => String(z.id || z.zone_id) === String(zoneId));
      return zone?.name || `Zone ${zoneId}`;
    } catch (error) {
      return `Zone ${zoneId}`;
    }
  };

  const getZoneName = async (areaId, zoneId) => {
    const cacheKey = `${areaId}-${zoneId}`;
    if (zoneNames[cacheKey]) {
      return zoneNames[cacheKey];
    }

    const zoneName = await fetchZoneNames(areaId, zoneId);
    setZoneNames(prev => ({ ...prev, [cacheKey]: zoneName }));
    return zoneName;
  };

  useEffect(() => {
    dispatch(fetchQuickControlDetails(id));

    if (location.state?.edit) {
      setEditMode(true);
    }

    return () => {
      dispatch(clearSelectedControl());
    };
  }, [dispatch, id]);

  useEffect(() => {
    if (selectedControl?.quick_control_areas) {
      selectedControl.quick_control_areas.forEach(area => {
        area.actions?.forEach(action => {
          if (action.type === 'zone_status' && action.zone_id && area.area_id) {
            getZoneName(area.area_id, action.zone_id);
          }
        });
      });
    }
  }, [selectedControl]);

  const handleTrigger = () => setShowConfirm(true);

  const doTrigger = async () => {
    setShowConfirm(false);
    try {
      if (selectedControl) await dispatch(triggerQuickControl(selectedControl.id));
      setToast({ open: true, message: "Triggered successfully!" });
    } catch (e) {
      setToast({ open: true, message: e?.message || "Trigger failed" });
    }
  };

  const handleDelete = () => {
    setShowDeleteQuickControlDialog(true);
  };

  const confirmDeleteQuickControl = async () => {
    if (!selectedControl) return;

    try {
      await dispatch(deleteQuickControl(selectedControl.id)).unwrap();
      navigate('/quickcontrols');
    } catch (error) {
      if (error && error.includes("being used by")) {
        setToast({
          open: true,
          message: error
        });
      } else {
        setToast({
          open: true,
          message: "Failed to delete Quick Control. Please try again."
        });
      }
    }

    setShowDeleteQuickControlDialog(false);
  };

  const handleCopy = () => {
    if (!selectedControl || updateStatus === 'loading') return;
    setEditMode(true);
    setIsCopyMode(true);
    const copy = JSON.parse(JSON.stringify(selectedControl));
    copy.name = `Copy of ${copy.name}`;
    copy.id = undefined;
    copy.quick_control_areas = tagAreasWithLoadedActions(copy.quick_control_areas);
    setEditableControl(copy);
  };

  const handleModify = () => {
    if (!selectedControl) return;
    setEditMode(true);
    const editable = JSON.parse(JSON.stringify(selectedControl));
    editable.quick_control_areas = tagAreasWithLoadedActions(editable.quick_control_areas);
    setEditableControl(editable);
  };

  const handleAddLocations = (areas) => {
    setEditableControl(prev => ({
      ...prev,
      quick_control_areas: [
        ...prev.quick_control_areas,
        ...areas.map(a => ({
          floor_id: a.floorId,
          floor_name: a.floorName,
          area_id: a.areaId,
          area_name: a.areaName,
          actions: []
        }))
      ]
    }));
  };

  const handleRemoveLocation = (index) => {
    setEditableControl(prev => ({
      ...prev,
      quick_control_areas: prev.quick_control_areas.filter((_, i) => i !== index)
    }));
  };

  const handleOpenActionDialog = (idx) => {
    if (!editableControl) {
      return;
    }
    setEditingActionIdx(null);
    setEditAllMode(false);
    setActionDialogIdx(idx);
    setSelectedActionData(null);
  };

  // Add / update action(s) on a location (supports All Zones expand + multi-action merge)
  const handleAddAction = (idx, actionData) => {
    const expanded = expandQuickControlActionData(actionData);
    setEditableControl(prev => ({
      ...prev,
      quick_control_areas: prev.quick_control_areas.map((loc, i) => {
        if (i !== idx) return loc;
        return {
          ...loc,
          actions: mergeExpandedActionsIntoLocation(loc.actions, expanded, {
            editingActionIdx: editAllMode ? null : editingActionIdx,
            editAllMode,
            withSource: withIndividualSource,
          }),
        };
      }),
    }));
    setActionDialogIdx(null);
    setSelectedActionData(null);
    setEditingActionIdx(null);
    setEditAllMode(false);
  };

  const openEditForAction = (locationIdx, actionIdx) => {
    const location = editableControl.quick_control_areas[locationIdx];
    const action = location.actions[actionIdx];
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
    const location = editableControl.quick_control_areas[locationIdx];
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
    const location = editableControl.quick_control_areas[locationIdx];
    const actions = location?.actions || [];
    if (actions.length === 0) {
      setActionToDelete({ areaIndex: locationIdx, area: location, deleteLocation: true });
      setShowDeleteActionDialog(true);
      return;
    }
    if (actions.length === 1) {
      setActionToDelete({
        areaIndex: locationIdx,
        area: location,
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
    const location = editableControl.quick_control_areas[locationIdx];
    if (pick === 'all') {
      setEditableControl((prev) => ({
        ...prev,
        quick_control_areas: prev.quick_control_areas.map((loc, i) =>
          i === locationIdx ? { ...loc, actions: [] } : loc
        ),
      }));
      return;
    }
    setActionToDelete({
      areaIndex: locationIdx,
      area: location,
      actionIndex: pick,
      action: location.actions[pick],
    });
    setShowDeleteActionDialog(true);
  };

  // Handle edit action - kept for compatibility
  const handleEditAction = (locationIdx, actionIdx) => {
    openEditForAction(locationIdx, actionIdx);
  };

  const handleCommonActionTypeSelect = async (actionType) => {
    setSelectedCommonActionType(actionType);
    setSelectedOccupancySetting(null);
    setSelectedZoneType('switched');

    if (actionType === 'occupancy') {
      setSelectedOccupancySetting("auto");
    }
  };

  const handleLightStatusSettingChange = async (type, setting, value) => {
    setLightStatusSettings(prev => ({
      ...prev,
      [type]: { ...prev[type], [setting]: value }
    }));
  };

  const handleOccupancySettingSelect = (setting) => {
    setSelectedOccupancySetting(setting);
  };

  const handleApplyCommonAction = () => {
    if (!editableControl || !editableControl.quick_control_areas) {
      resetCommonActionDialog();
      return;
    }

    if (editingAreaStatus != null && selectedCommonActionType === 'light_status') {
      const { locationIdx } = editingAreaStatus;
      const commonAction = {
        type: "area_status",
        area_status: lightStatusSettings.switched.on_off
      };
      setEditableControl(prev => ({
        ...prev,
        quick_control_areas: prev.quick_control_areas.map((area, i) =>
          i === locationIdx
            ? { ...area, actions: applyCommonActionToActions(area.actions, commonAction) }
            : area
        )
      }));
      resetCommonActionDialog();
      return;
    }

    if (selectedCommonActionType === 'light_status') {
      const commonAction = {
        type: "area_status",
        area_status: lightStatusSettings.switched.on_off
      };

      setEditableControl(prev => ({
        ...prev,
        quick_control_areas: prev.quick_control_areas.map(area => ({
          ...area,
          actions: applyCommonActionToActions(area.actions, commonAction)
        }))
      }));
    } else if (selectedCommonActionType === 'occupancy' && selectedOccupancySetting) {
      const commonAction = {
        type: "occupancy",
        occupancy_setting: selectedOccupancySetting
      };

      setEditableControl(prev => ({
        ...prev,
        quick_control_areas: prev.quick_control_areas.map(area => ({
          ...area,
          actions: applyCommonActionToActions(area.actions, commonAction)
        }))
      }));
    }

    resetCommonActionDialog();
  };

  const runSaveOnce = useMemo(() => createSingleFlight(), []);
  const handleSave = async () => runSaveOnce(async () => {
    if (!editableControl || updateStatus === 'loading') return;

    const hasLocationsWithoutActions = editableControl.quick_control_areas.some(area => !area.actions || area.actions.length === 0);
    if (hasLocationsWithoutActions) {
      setToast({ open: true, message: "All locations must have at least one action before saving." });
      return;
    }

    try {
      const payload = {
        name: editableControl.name,
        areas: editableControl.quick_control_areas.map(area => ({
          floor_id: area.floor_id,
          area_id: area.area_id,
          actions: area.actions.map((rawAction) => stripActionSource(rawAction))
        }))
      };

      if (isCopyMode || !editableControl.id) {
        const response = await dispatch(createQuickControl(payload)).unwrap();
        setToast({ open: true, message: "Quick Control created successfully!" });
        navigate('/quickcontrols');
      } else {
        await dispatch(updateQuickControl({
          controlId: editableControl.id,
          payload
        })).unwrap();

        setToast({ open: true, message: "Quick Control updated successfully!" });

        setEditMode(false);
        setEditableControl(null);

        await dispatch(fetchQuickControlDetails(id));
      }
    } catch (error) {
      setToast({
        open: true,
        message: error?.message || "Failed to save Quick Control"
      });
    }
  });

  const handleEditChange = (field, value) => {
    setEditableControl(prev => ({ ...prev, [field]: value }));
  };

  const handleDeleteAction = (areaIndex) => {
    handleDeleteButtonClick(areaIndex);
  };

  const confirmDeleteAction = () => {
    if (actionToDelete) {
      setEditableControl(prev => {
        const updatedAreas = [...prev.quick_control_areas];
        if (actionToDelete.deleteLocation) {
          updatedAreas.splice(actionToDelete.areaIndex, 1);
        } else if (actionToDelete.actionIndex != null) {
          const area = { ...updatedAreas[actionToDelete.areaIndex] };
          area.actions = (area.actions || []).filter((_, i) => i !== actionToDelete.actionIndex);
          updatedAreas[actionToDelete.areaIndex] = area;
        } else {
          updatedAreas.splice(actionToDelete.areaIndex, 1);
        }
        return { ...prev, quick_control_areas: updatedAreas };
      });
      setShowDeleteActionDialog(false);
      setActionToDelete(null);
    }
  };

  if (selectedControlLoading || !selectedControl) {
    return <div style={{ color: listChromeText, padding: 40 }}>Loading...</div>;
  }

  const quickControlAreas = editMode
    ? editableControl?.quick_control_areas
    : selectedControl?.quick_control_areas;

  const basePad = isTablet ? 24 : 40;

  return (
    <div
      style={{
        borderRadius: 20,
        minHeight: 500,
        maxWidth: 1200,
        position: 'relative',
        boxSizing: 'border-box',
        color: listChromeText,
        ...schedulePageWithFixedActionBarStyle(false, false, isTablet),
        paddingTop: basePad,
        paddingRight: basePad,
        paddingBottom: QUICK_CONTROL_DETAILS_BOTTOM_CLEARANCE,
        paddingLeft: basePad,
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexDirection: 'row',
        gap: isTablet ? 12 : 0
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          width: 'auto',
          flex: isTablet ? '1' : 'auto'
        }}>
          {editMode ? (
            <input
              value={editableControl.name}
              onChange={e => handleEditChange('name', e.target.value)}
              style={{
                fontSize: isTablet ? 20 : 24,
                fontWeight: 700,
                color: buttonColor,
                background: '#fff',
                border: '1px solid #ccc',
                borderRadius: 8,
                padding: '8px 16px',
                marginBottom: isTablet ? 16 : 24,
                minWidth: isTablet ? 200 : 300,
                width: 'auto'
              }}
            />
          ) : (
            <h2 style={{
              color: listChromeText,
              marginBottom: isTablet ? 16 : 24,
              fontSize: isTablet ? 20 : 24
            }}>
              Quick Control: {selectedControl?.name}
            </h2>
          )}
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isTablet ? 8 : 16,
          flexWrap: 'nowrap',
          justifyContent: 'flex-end',
          width: 'auto'
        }}>
          {!editMode && (
            <button
              style={{
                background: canTriggerQuickControl() ? ACTION_BLUE : '#666',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: isTablet ? '8px 20px' : '10px 28px',
                fontWeight: 500,
                fontSize: isTablet ? 13 : 14,
                cursor: canTriggerQuickControl() ? 'pointer' : 'not-allowed',
                minWidth: isTablet ? 100 : 100,
                opacity: canTriggerQuickControl() ? 1 : 0.6,
              }}
              onClick={canTriggerQuickControl() ? handleTrigger : undefined}
              disabled={triggerStatus === 'loading' || !canTriggerQuickControl()}
              title={!canTriggerQuickControl() ? 'You do not have permission to trigger Quick Controls' : ''}
            >
              {triggerStatus === 'loading' ? 'Triggering...' : 'Trigger'}
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          maxHeight: `calc(100vh - 220px - ${SCHEDULE_FIXED_ACTION_BAR_BOTTOM})`,
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
          color: whiteChrome ? '#fff' : listChromeText,
          background: whiteChrome ? '#1565C0' : 'transparent',
          borderBottom: whiteChrome ? '1px solid rgba(255,255,255,0.35)' : '1px solid #ccc',
          borderTopLeftRadius: whiteChrome ? 8 : 0,
          borderTopRightRadius: whiteChrome ? 8 : 0,
          padding: '10px 12px',
          marginBottom: 8,
          fontSize: 15,
          fontWeight: 700,
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
              onClick={() => {
                setEditingAreaStatus(null);
                setSelectedCommonActionType('light_status');
                setSelectedOccupancySetting(null);
                setSelectedZoneType('switched');
                setLightStatusSettings((prev) => ({
                  ...prev,
                  switched: { on_off: 'On' },
                }));
                setShowCommonActionDialog(true);
              }}
            >
              + Add Common Action
            </span>
          )}
        </div>

        <div style={quickControlDetailsTableScrollStyle}>
          {(quickControlAreas || []).map((area, aidx) => {
            const uniqueKey = `${area.floor_id}-${area.area_id}-${aidx}`;
            const hasActions = area.actions && area.actions.length > 0;
            const resolvedFromFloors =
              area?.area_id != null ? areaIdToFloor.get(String(area.area_id)) : null;
            const floorLabel =
              area?.floor_name ||
              (area?.floor_id != null ? floorNameById.get(String(area.floor_id)) : "") ||
              (resolvedFromFloors?.floorName || "") ||
              "";
            const locationText = floorLabel
              ? `${decodeHtmlEntities(floorLabel)} / ${decodeHtmlEntities(area.area_name)}`
              : `${decodeHtmlEntities(area.area_name)}`;
            return (
              <div key={uniqueKey} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: '1px solid #b2a98b',
                gap: 16,
                background: onContent.isLight
                  ? (aidx % 2 === 0 ? 'rgba(0,0,0,0.03)' : 'transparent')
                  : (aidx % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'transparent'),
              }}>
                <div style={{
                  flex: '0 0 300px',
                  fontSize: 15,
                  color: listChromeText,
                  textAlign: 'left',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {locationText}
                </div>
                <div style={{
                  flex: '1 1 300px',
                  fontSize: 15,
                  color: listChromeText,
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}>
                  {editMode ? (
                    hasActions ? (
                      <>
                        {area.actions.map((action, actidx) => {
                          const actionKey = `${uniqueKey}-action-${actidx}`;
                          return (
                            <div key={actionKey} style={{
                              wordWrap: 'break-word',
                              wordBreak: 'break-word',
                              lineHeight: '1.4',
                              width: '100%',
                              textAlign: 'left',
                            }}>
                              {renderActionDisplay(action)}
                            </div>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => handleOpenActionDialog(aidx)}
                          style={{
                            background: 'transparent',
                            color: ACTION_BLUE,
                            border: `1px solid ${ACTION_BLUE}`,
                            borderRadius: 4,
                            padding: '4px 8px',
                            cursor: 'pointer',
                            fontSize: 12,
                            alignSelf: 'flex-start',
                            marginTop: 4,
                          }}
                        >
                          + Add Action
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleOpenActionDialog(aidx)}
                        style={{
                          background: ACTION_BLUE,
                          border: 'none',
                          borderRadius: 4,
                          color: '#fff',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          fontSize: 12,
                          whiteSpace: 'nowrap',
                          alignSelf: 'flex-start',
                        }}
                      >
                        Add Action
                      </button>
                    )
                  ) : hasActions ? (
                    area.actions.map((action, actidx) => {
                      const actionKey = `${uniqueKey}-action-${actidx}`;
                      return (
                        <div key={actionKey} style={{
                          marginBottom: 4,
                          wordWrap: 'break-word',
                          wordBreak: 'break-word',
                          lineHeight: '1.4'
                        }}>
                          {renderActionDisplay(action)}
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ color: listChromeMuted, fontStyle: 'italic' }}>No action</div>
                  )}
                </div>
                {editMode && (
                  <div style={detailsRowActionControlsStyle(180)}>
                    {hasActions && (
                      <button
                        onClick={() => handleEditButtonClick(aidx)}
                        style={{
                          background: ACTION_BLUE,
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
                      onClick={() => handleDeleteButtonClick(aidx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: listChromeText,
                        padding: 0,
                        cursor: 'pointer',
                        fontSize: 18,
                        lineHeight: 1
                      }}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={scheduleFixedActionBarStyle(false, false, isTablet)}>
        {!editMode && (
          <>
            <button
              style={{
                background: canCreateQuickControl() ? ACTION_BLUE : '#666',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '10px 28px',
                fontWeight: 500,
                fontSize: 14,
                cursor: canCreateQuickControl() ? 'pointer' : 'not-allowed',
                opacity: canCreateQuickControl() ? 1 : 0.6,
              }}
              onClick={canCreateQuickControl() ? handleCopy : undefined}
              disabled={!canCreateQuickControl()}
              title={!canCreateQuickControl() ? 'You do not have permission to copy Quick Controls' : ''}
            >
              Copy
            </button>
            <button
              style={{
                background: canModifyQuickControl() ? ACTION_BLUE : '#666',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '10px 28px',
                fontWeight: 500,
                fontSize: 14,
                cursor: canModifyQuickControl() ? 'pointer' : 'not-allowed',
                opacity: canModifyQuickControl() ? 1 : 0.6,
              }}
              onClick={canModifyQuickControl() ? handleModify : undefined}
              disabled={!canModifyQuickControl()}
              title={!canModifyQuickControl() ? 'You do not have permission to modify Quick Controls' : ''}
            >
              Modify
            </button>
            <button
              style={{
                background: canDeleteQuickControl() ? ACTION_BLUE : '#666',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '10px 28px',
                fontWeight: 500,
                fontSize: 14,
                cursor: canDeleteQuickControl() ? 'pointer' : 'not-allowed',
                opacity: canDeleteQuickControl() ? 1 : 0.6,
              }}
              onClick={canDeleteQuickControl() ? handleDelete : undefined}
              disabled={deleteStatus === 'loading' || !canDeleteQuickControl()}
              title={!canDeleteQuickControl() ? 'You do not have permission to delete Quick Controls' : ''}
            >
              {deleteStatus === 'loading' ? 'Deleting...' : 'Delete'}
            </button>
            <button
              style={{
                background: ACTION_BLUE,
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '10px 28px',
                fontWeight: 500,
                fontSize: 14,
                cursor: 'pointer',
              }}
              onClick={() => navigate('/quickcontrols')}
            >
              Close
            </button>
          </>
        )}
        {editMode && (
          <>
            <button
              style={{
                background: (updateStatus === 'loading' || editableControl.quick_control_areas.some(area => !area.actions || area.actions.length === 0)) ? '#888' : ACTION_BLUE,
                color: '#fff',
                border: (updateStatus === 'loading' || editableControl.quick_control_areas.some(area => !area.actions || area.actions.length === 0)) ? '1px solid #888' : '1px solid #1565C0',
                borderRadius: 8,
                padding: '10px 28px',
                fontWeight: 500,
                fontSize: 14,
                cursor: (updateStatus === 'loading' || editableControl.quick_control_areas.some(area => !area.actions || area.actions.length === 0)) ? 'not-allowed' : 'pointer',
              }}
              onClick={handleSave}
              disabled={updateStatus === 'loading' || editableControl.quick_control_areas.some(area => !area.actions || area.actions.length === 0)}
            >
              {updateStatus === 'loading' ? 'Saving...' : 'Save'}
            </button>
            <button
              style={{
                background: '#fff',
                color: '#1565C0',
                border: '1px solid #1565C0',
                borderRadius: 8,
                padding: '10px 28px',
                fontWeight: 500,
                fontSize: 14,
                cursor: 'pointer',
              }}
              onClick={() => { setEditMode(false); setEditableControl(null); setIsCopyMode(false); }}
            >
              Cancel
            </button>
          </>
        )}
      </div>

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
            background: whiteChrome ? '#ffffff' : '#CDC0A0',
            border: whiteChrome ? '1px solid #e5e7eb' : 'none',
            borderRadius: whiteChrome ? 12 : 18,
            padding: 28,
            minWidth: 340,
            boxShadow: whiteChrome ? '0 4px 24px rgba(0,0,0,0.08)' : '0 4px 24px rgba(0,0,0,0.12)',
            position: "relative",
            color: whiteChrome ? '#000000' : buttonColor
          }}>
            <div style={{ marginBottom: 16, fontWeight: 600, fontSize: 18, color: dialogLabelColor }}>
              {editingAreaStatus ? 'Edit Action' : 'Add Common Action'}
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8, color: whiteChrome ? '#000000' : onContent.primary }}>Select Action Type</div>
              <select
                value={selectedCommonActionType}
                onChange={(e) => handleCommonActionTypeSelect(e.target.value)}
                disabled={!!editingAreaStatus}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: whiteChrome ? 10 : 6,
                  border: whiteChrome ? '1px solid #d1d5db' : '1px solid #ccc',
                  background: '#ffffff',
                  color: '#000000',
                  fontSize: 14
                }}
              >
                <option value="light_status">Light Status</option>
                {!editingAreaStatus && <option value="occupancy">Occupancy Setting</option>}
              </select>
            </div>

            {selectedCommonActionType === 'occupancy' && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 8, color: whiteChrome ? '#000000' : onContent.primary }}>Occupancy Setting</div>
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
                        color: selectedOccupancySetting === setting ? "#fff" : (whiteChrome ? '#000000' : buttonColor),
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

            {selectedCommonActionType === 'light_status' && (
              <div style={{ marginTop: 16 }}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8, color: whiteChrome ? '#000000' : onContent.primary }}>Light State</div>
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
                  color: '#1565C0',
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

      <AreaTreeDialog
        open={showLocationDialog}
        onClose={() => setShowLocationDialog(false)}
        onAdd={handleAddLocations}
      />

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
            background: whiteChrome ? '#ffffff' : '#CDC0A0',
            border: whiteChrome ? '1px solid #e5e7eb' : 'none',
            borderRadius: whiteChrome ? 12 : 18,
            padding: 28,
            minWidth: 340,
            boxShadow: whiteChrome ? '0 4px 24px rgba(0,0,0,0.08)' : '0 4px 24px rgba(0,0,0,0.12)',
            position: "relative",
            color: whiteChrome ? '#000000' : buttonColor
          }}>
            <div style={{ marginBottom: 16, fontWeight: 600, fontSize: 18, color: dialogLabelColor }}>
              {selectedActionData ? 'Edit Action' : 'Add Action'}
              {selectedActionData && (
                <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
                  {selectedActionData.type === "scene" && selectedActionData.scene && `Scene: ${selectedActionData.scene.name}`}
                  {selectedActionData.type === "zone" && selectedActionData.zone && `Zone: ${selectedActionData.zone.name}`}
                  {selectedActionData.type === "occupancy" && `Occupancy: ${selectedActionData.action}`}
                  {selectedActionData.type === "shade" && selectedActionData.shade && `Shade: ${selectedActionData.shade.name}`}
                </div>
              )}
            </div>
            <Action
              areaId={editableControl?.quick_control_areas[actionDialogIdx]?.area_id}
              onActionSelect={action => setSelectedActionData(action)}
              initialAction={selectedActionData}
              hideZoneOption={
                !editAllMode &&
                editingActionIdx == null &&
                locationHasSceneAction(
                  editableControl?.quick_control_areas?.[actionDialogIdx]?.actions
                )
              }
              hideSceneOption={
                !editAllMode &&
                editingActionIdx == null &&
                locationHasZoneAction(
                  editableControl?.quick_control_areas?.[actionDialogIdx]?.actions
                )
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
                onClick={() => { setActionDialogIdx(null); setSelectedActionData(null); }}
                style={{
                  padding: "10px 28px",
                  borderRadius: 8,
                  border: "1px solid #1565C0",
                  background: "#fff",
                  color: '#1565C0',
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

      <ConfirmDialog
        open={showConfirm}
        title="Are you sure?"
        message="Do you want to trigger this quick control?"
        onConfirm={doTrigger}
        onCancel={() => setShowConfirm(false)}
      />

      <ConfirmDialog
        open={showDeleteQuickControlDialog}
        title="Delete Quick Control"
        message={`Are you sure you want to delete quick control "${selectedControl?.name}"?`}
        onConfirm={confirmDeleteQuickControl}
        onCancel={() => setShowDeleteQuickControlDialog(false)}
      />

      <ConfirmDialog
        open={showDeleteActionDialog}
        title={actionToDelete?.deleteLocation ? "Delete Location" : "Delete Action"}
        message={
          actionToDelete?.deleteLocation
            ? `Are you sure you want to delete location "${actionToDelete?.area?.area_name}"?`
            : `Are you sure you want to delete "${getQuickControlActionShortLabel(actionToDelete?.action)}" from "${actionToDelete?.area?.area_name}"?`
        }
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
            ? editableControl?.quick_control_areas?.[actionChooser.locationIdx]?.actions || []
            : []
        }
        buttonColor={ACTION_BLUE}
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
    </div>
  );
};

export default QuickControlDetails;