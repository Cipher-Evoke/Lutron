import React, { useEffect, useState, useRef } from "react";
import {
    Box, Button, Checkbox, Chip, FormControlLabel, Grid, Stack, TextField, Typography, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Tooltip
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AddIcon from "@mui/icons-material/Add";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import SelectAreaDialog from "../create-area-model/SelectAreaDialog";
import { useDispatch, useSelector } from "react-redux";
import { 
    fetchActivityReport,
    downloadActivityReport,
    sendActivityReportEmail,
    selectActivityReport,
    getActivityReportLoading,
    getActivityReportError,
    selectActivityReportExportLoading,
    selectActivityReportExportError,
    selectActivityReportExportSuccess,
    selectActivityReportExportSuccessTimestamp,
    selectActivityReportEmailLoading,
    selectActivityReportEmailError,
    selectActivityReportEmailSuccess,
    selectActivityReportEmailSuccessTimestamp,
    fetchEmailConfigs,
    clearExportSuccess,
    clearEmailSuccess
} from "../../redux/slice/settingsslice/heatmap/groupOccupancySlice";
import ActivityReportTable from "./ActivityReportTable";
import {selectApplicationTheme } from "../../redux/slice/theme/themeSlice";
import { UseAuth } from "../../customhooks/UseAuth";
import { fetchProfile } from "../../redux/slice/auth/userlogin";

// Activity type mapping for API
const ACTIVITY_TYPE_MAPPING = {
    "User": "User",
    "QuickControl": "QuickControl", 
    "Schedule": "Schedule",
    "AreaGroup": "AreaGroup",
    "Device Control": "DeviceControl",
    "Shades": "Shades",
    "Lights": "Lights",
    "Occupancy": "Occupancy",
    "Scene": "Scene"
};

// Custom Time Input Component to ensure 24-hour format
const TimeInput24Hour = ({ value, onChange, sx, ...props }) => {
    const handleTimeChange = (e) => {
        const timeValue = e.target.value;
        // Ensure the time is in 24-hour format
        if (timeValue && timeValue.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
            onChange(e);
        }
    };

    return (
        <TextField
            type="time"
            value={value}
            onChange={handleTimeChange}
            inputProps={{
                step: 300, // 5 minutes
                pattern: "[0-9]{2}:[0-9]{2}", // 24-hour format pattern
            }}
            sx={{
                ...sx,
                "& input[type='time']": {
                    "&::-webkit-calendar-picker-indicator": {
                        filter: "invert(0)",
                    },
                },
            }}
            InputLabelProps={{
                shrink: true,
            }}
            inputMode="numeric"
            {...props}
        />
    );
};

const ActivityReport = ({ onGenerate }) => {
    const dispatch = useDispatch();
    
    // Get user authentication and role
    const { role } = UseAuth();
    const userProfile = useSelector((state) => state.user?.profile);
    
    // Direct role checking for Activity Report permissions
    const canAccessActivityReport = () => {
        const allowedRoles = [
            'Superadmin',
            'Admin',
            'Operator'
        ];
        const hasAccess = allowedRoles.includes(role);
        return hasAccess;
    };
    
    const hasLimitedAccess = () => {
        // According to the access control sheet:
        // - Admin: Required (full access)
        // - Operator-Monitor-Control-and-Edit: Required only for mapped floor (limited access)
        // - Other Operators: Required only for mapped floor (limited access)
        
        // Superadmin and Admin have full access
        if (role === 'Superadmin' || role === 'Admin') {
            return false;
        }
        
        // All Operator users have limited access (only to their assigned areas)
        return role === 'Operator';
    };
    
    const [dialogOpen, setDialogOpen] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [startTime, setStartTime] = useState("00:00");
    const [endDate, setEndDate] = useState("");
    const [endTime, setEndTime] = useState("23:59");
    const [selectedAreas, setSelectedAreas] = useState([]);
    const [showExportDropdown, setShowExportDropdown] = useState(false);
    const exportDropdownRef = useRef(null);
    
    // Snackbar state
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    
    // Track if component has just mounted to prevent showing stale success messages
    const [hasMounted, setHasMounted] = useState(false);
    
    // Email dialog state
    // Email dialog state - DISABLED: No popup, using saved email only
    // State variables kept for compatibility but not used
    const [emailDialogOpen] = useState(false);
    const [emailInput] = useState('');
    const [pendingEmailAction] = useState(null);

    // Redux selectors for activity report data
    const rows = useSelector(selectActivityReport) || [];
    const loading = useSelector(getActivityReportLoading);
    const error = useSelector(getActivityReportError);
    
    // Redux selectors for export functionality
    const exportLoading = useSelector(selectActivityReportExportLoading);
    const exportError = useSelector(selectActivityReportExportError);
    const exportSuccess = useSelector(selectActivityReportExportSuccess);
    const exportSuccessTimestamp = useSelector(selectActivityReportExportSuccessTimestamp);
    const emailLoading = useSelector(selectActivityReportEmailLoading);
    const emailError = useSelector(selectActivityReportEmailError);
    const emailSuccess = useSelector(selectActivityReportEmailSuccess);
    const emailSuccessTimestamp = useSelector(selectActivityReportEmailSuccessTimestamp);

    const appTheme = useSelector(selectApplicationTheme);
    const backgroundColor = appTheme?.application_theme?.background || '#d2c4a2';
    const contentColor = appTheme?.application_theme?.content || 'rgba(128, 120, 100, 0.7)';
    const buttonColor = appTheme?.application_theme?.button || '#232323';

    const openDialog = () => setDialogOpen(true);
    const closeDialog = () => setDialogOpen(false);
    
    // Snackbar handlers
    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };
    
    const showSnackbar = (message, severity = 'success') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };
    
    // Email dialog handlers - Send email directly to logged-in user
    const handleEmailDialogOpen = async (action) => {
        // Check if mail server is configured first
        try {
            const result = await dispatch(fetchEmailConfigs()).unwrap();
            
            // Check if we have email configurations and they are properly set up
            if (!Array.isArray(result) || result.length === 0) {
                showSnackbar('Email Server settings not configured', 'error');
                return;
            }
            
            const latestConfig = result[0];
            const hasServerName = latestConfig.server_name && latestConfig.server_name.trim() !== '';
            const hasPort = latestConfig.port && latestConfig.port > 0;
            const hasServerEmail = latestConfig.server_email && latestConfig.server_email.trim() !== '';
            const hasSenderName = latestConfig.sender_name && latestConfig.sender_name.trim() !== '';
            
            if (!hasServerName || !hasPort || !hasServerEmail || !hasSenderName) {
                showSnackbar('Email Server settings not configured', 'error');
                return;
            }
        } catch (error) {
            showSnackbar('Email Server settings not configured', 'error');
            return;
        }
        
        // Use logged-in user's email from profile
        if (userProfile && userProfile.email && userProfile.email.trim() !== '') {
            if (typeof action === 'function') {
                action(userProfile.email.trim());
            }
            return;
        }
        
        // If no user email in profile, show error
        showSnackbar('No email address found for logged-in user. Please check your profile.', 'error');
    };

    const activityTypes = [
        { key: "User", label: "User", canFilterByArea: false },
        { key: "QuickControl", label: "Quick Control", canFilterByArea: false },
        { key: "Schedule", label: "Schedule", canFilterByArea: false },
        { key: "AreaGroup", label: "Area Group", canFilterByArea: false },
        { key: "Device Control", label: "Device Control", canFilterByArea: true },
        { key: "Shades", label: "Shades", canFilterByArea: true },
        { key: "Lights", label: "Lights", canFilterByArea: true },
        { key: "Occupancy", label: "Occupancy", canFilterByArea: true },
        { key: "Scene", label: "Scene", canFilterByArea: true },
    ];

    // Initialize all activity types as checked by default
    const [checked, setChecked] = useState(() => {
        const defaultChecked = {};
        activityTypes.forEach((t) => {
            defaultChecked[t.key] = true;
        });
        return defaultChecked;
    });

    // Auto-uncheck disabled activity types when areas are selected
    useEffect(() => {
        if (selectedAreas.length > 0) {
            setChecked(prev => {
                const updated = { ...prev };
                activityTypes.forEach(t => {
                    if (!t.canFilterByArea) {
                        updated[t.key] = false;
                    }
                });
                return updated;
            });
        } else {
            // Re-check all when no areas are selected
            setChecked(prev => {
                const updated = { ...prev };
                activityTypes.forEach(t => {
                    updated[t.key] = true;
                });
                return updated;
            });
        }
    }, [selectedAreas]);

    const handleGenerate = async () => {
        // Handle cases where no areas are selected - use all areas by default
        const floor_ids = selectedAreas.length > 0 ? Array.from(new Set(selectedAreas.map((a) => a.floorId))) : undefined;
        const area_ids = selectedAreas.length > 0 ? selectedAreas.map((a) => a.areaId).filter(id => id !== null) : undefined;

        const activity_desc_keywords = Object.entries(checked)
            .filter(([, v]) => v)
            .map(([k]) => ACTIVITY_TYPE_MAPPING[k])
            .filter(Boolean);

        const withSeconds = (t) => (t ? (t.length === 5 ? `${t}:00` : t) : "");

        // Get current date in local timezone to avoid timezone issues
        const today = new Date();
        const todayString = today.getFullYear() + '-' + 
                           String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                           String(today.getDate()).padStart(2, '0');
        
        const params = {
            activity_type: undefined,
            floor_ids,
            area_ids,
            activity_description: activity_desc_keywords.length > 0 ? activity_desc_keywords : undefined,
            start_date: startDate || todayString,
            start_time: withSeconds(startTime) || "00:00:00",
            end_date: endDate || todayString,
            end_time: withSeconds(endTime) || "23:59:59",
        };
        try {
            await dispatch(fetchActivityReport(params)).unwrap();
            onGenerate?.(params);
        } catch (e) {
            showSnackbar('Failed to load activity report. Please try again.', 'error');
        }
    };

    // Handle export actions
    const handleExport = async (action) => {
        
        // Use today's date if no dates are selected
        const today = new Date();
        const todayString = today.getFullYear() + '-' + 
                           String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                           String(today.getDate()).padStart(2, '0');
        
        const finalStartDate = startDate || todayString;
        const finalEndDate = endDate || todayString;

        const activityTypesSelected = Object.keys(checked).filter(key => checked[key]);
        if (activityTypesSelected.length === 0) {
            showSnackbar('Please select at least one activity type before exporting', 'error');
            setShowExportDropdown(false);
            return;
        }

        // Map frontend keys to API values
        const apiActivityDescriptions = activityTypesSelected.map(key => {
            const apiValue = ACTIVITY_TYPE_MAPPING[key] || key;
            return apiValue;
        });

        // Prepare parameters - handle cases where no areas are selected
        const floorIds = selectedAreas.length > 0 ? [...new Set(selectedAreas.map(a => a.floorId))] : undefined;
        const areaIds = selectedAreas.length > 0 ? selectedAreas.map(a => a.areaId).filter(id => id !== null) : undefined;
        
        const withSeconds = (t) => (t ? (t.length === 5 ? `${t}:00` : t) : "");
        
        // Ensure dates are in correct format for export
        const formatDateForAPI = (dateStr) => {
            if (!dateStr) return null;
            // If date is already in YYYY-MM-DD format, return as is
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                return dateStr;
            }
            // Otherwise, convert to YYYY-MM-DD format
            const date = new Date(dateStr);
            return date.getFullYear() + '-' + 
                   String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(date.getDate()).padStart(2, '0');
        };
        
        const params = {
            floor_ids: floorIds,
            area_ids: areaIds,
            activity_description: apiActivityDescriptions.length > 0 ? apiActivityDescriptions : undefined,
            start_date: formatDateForAPI(finalStartDate),
            start_time: withSeconds(startTime),
            end_date: formatDateForAPI(finalEndDate),
            end_time: withSeconds(endTime)
        };

        
        if (action === 'email') {
            // Handle email export
            const emailAction = async (email) => {
                try {
                    const result = await dispatch(sendActivityReportEmail({ toEmail: email, ...params }));
                    if (result.type.endsWith('/fulfilled')) {
                        // Check if payload contains error status
                        if (result.payload && typeof result.payload === 'object' && (result.payload.status === 'error' || result.payload.state === 'error')) {
                            // API returned error in payload even though action was fulfilled
                            const errorMessage = result.payload.message || 'Unknown error occurred';
                            showSnackbar(`Email sending failed. Following is the error: ${errorMessage}`, 'error');
                        } else {
                            // Success
                            showSnackbar('Activity report sent by email successfully!', 'success');
                        }
                    } else {
                        const errorMessage = result.payload?.message || result.payload || 'Unknown error occurred';
                        showSnackbar(`Email sending failed. Following is the error: ${errorMessage}`, 'error');
                    }
                } catch (error) {
                    showSnackbar('Failed to send email. Please try again.', 'error');
                }
            };
            handleEmailDialogOpen(emailAction);
        } else if (action === 'download') {
            // Handle download export
            try {
                const result = await dispatch(downloadActivityReport(params));
                if (result.type.endsWith('/fulfilled')) {
                    // Check if payload contains error status
                    if (result.payload && typeof result.payload === 'object' && (result.payload.status === 'error' || result.payload.state === 'error')) {
                        // API returned error in payload even though action was fulfilled - show generic error like Dashboard
                        showSnackbar('Failed to start download. Please try again.', 'error');
                    } else {
                        // Success
                        showSnackbar('Activity report downloaded successfully!', 'success');
                    }
                } else {
                    showSnackbar(result.payload || 'Failed to start download. Please try again.', 'error');
                }
            } catch (error) {
                showSnackbar('Failed to start download. Please try again.', 'error');
            }
        }
        setShowExportDropdown(false);
    };

    const handleAdd = ({ floorId, floorName, areaCodes = [], areaNames = [], areaIds = [] }) => {
        const incoming = areaCodes.map((code, i) => ({
            floorId,
            floorName,
            areaCode: code,
            areaName: areaNames[i] ?? code,
            areaId: areaIds[i] ?? null,
        }));
        setSelectedAreas((prev) => {
            const key = (a) => `${a.floorId}-${a.areaCode}`;
            const map = new Map(prev.map((a) => [key(a), a]));
            incoming.forEach((a) => map.set(key(a), a));
            return Array.from(map.values());
        });
        closeDialog();
    };

    const removeArea = (floorId, areaCode) =>
        setSelectedAreas((prev) => prev.filter((a) => !(a.floorId === floorId && a.areaCode === areaCode)));

    // Function to intelligently group and display areas
    const getIntelligentAreaDisplay = (areas) => {
        if (!areas || areas.length === 0) return [];

        // First, try to group by area groups across all floors
        const allAreaGroups = {};
        const individualAreas = [];
        
        areas.forEach(area => {
            const areaName = area.areaName || area.areaCode;
            
            // Check for area group patterns
            let groupName = null;
            
            // Check for numbered area groups (Area Group 1, Area Group 2, etc.)
            const areaGroupMatch = areaName.match(/AREA\s*GROUP\s*(\d+)/i);
            if (areaGroupMatch) {
                groupName = `Area Group ${areaGroupMatch[1]}`;
            }
            // Check for MEETING ROOMS first (more specific)
            else if (areaName.match(/MEETING|CONFERENCE/i)) {
                groupName = 'MEETING ROOMS';
            }
            // Check for LMS patterns (more flexible)
            else if (areaName.match(/LMS|LM\d+/i)) {
                groupName = 'LMS ROOM';
            } 
            // Check for Workstation patterns (more flexible)
            else if (areaName.match(/WS\(|WORKSTATION/i)) {
                groupName = 'WORKSTATION';
            } 
            // Check for other room patterns
            else if (areaName.match(/PANTRY/i)) {
                groupName = 'PANTRY';
            } else if (areaName.match(/LIBRARY/i)) {
                groupName = 'LIBRARY';
            } else if (areaName.match(/RECOVERY/i)) {
                groupName = 'RECOVERY ROOM';
            } else if (areaName.match(/SHORT\s*STAY/i)) {
                groupName = 'SHORT STAY';
            } else if (areaName.match(/HYBRID/i)) {
                groupName = 'HYBRID ROOM';
            } else if (areaName.match(/SOLO/i)) {
                groupName = 'SOLO ROOM';
            } else if (areaName.match(/PASSAGE/i)) {
                groupName = 'PASSAGE';
            }
            // Check for specific area patterns from your data (only if not already categorized)
            else if (areaName.match(/KANHA|PENCH|RANTHAMBORE|MOLLEM|PERIYAR|BANDIPUR|SUNDARBAN|KAZIRANGA|JIM\s*CORBETT|HEMIS|TADOBA/i)) {
                groupName = 'LMS ROOM';
            }
            
            if (groupName) {
                if (!allAreaGroups[groupName]) {
                    allAreaGroups[groupName] = [];
                }
                allAreaGroups[groupName].push(area);
            } else {
                individualAreas.push(area);
            }
        });

        const displayItems = [];

        // Add area groups (prioritize these over floor grouping)
        Object.entries(allAreaGroups).forEach(([groupName, groupAreas]) => {
            if (groupAreas.length >= 2) {
                // Group by floor within the area group
                const floorGroups = {};
                groupAreas.forEach(area => {
                    if (!floorGroups[area.floorId]) {
                        floorGroups[area.floorId] = {
                            floorName: area.floorName,
                            areas: []
                        };
                    }
                    floorGroups[area.floorId].areas.push(area);
                });

                Object.entries(floorGroups).forEach(([floorId, floorData]) => {
                    displayItems.push({
                        type: 'areaGroup',
                        floorId: floorId,
                        floorName: floorData.floorName,
                        groupName: groupName,
                        areaCount: floorData.areas.length,
                        areas: floorData.areas
                    });
                });
            } else {
                // Show individual areas if group is small
                groupAreas.forEach(area => {
                    displayItems.push({
                        type: 'individual',
                        floorId: area.floorId,
                        floorName: area.floorName,
                        areaCode: area.areaCode,
                        areaName: area.areaName,
                        area: area
                    });
                });
            }
        });

        // Add individual areas
        individualAreas.forEach(area => {
            displayItems.push({
                type: 'individual',
                floorId: area.floorId,
                floorName: area.floorName,
                areaCode: area.areaCode,
                areaName: area.areaName,
                area: area
            });
        });

        // Check if we should show floor-level grouping
        // Show floor name if most areas of a floor are selected (threshold: 20+ areas)
        const floorGroups = {};
        areas.forEach(area => {
            if (!floorGroups[area.floorId]) {
                floorGroups[area.floorId] = {
                    floorName: area.floorName,
                    areas: []
                };
            }
            floorGroups[area.floorId].areas.push(area);
        });

        // Check for full floor selections per floor (very high threshold to indicate full floor)
        const floorDisplayItems = [];
        Object.entries(floorGroups).forEach(([floorId, floorData]) => {
            if (floorData.areas.length >= 50) {
                // This looks like a full floor selection - show floor name instead of area groups
                floorDisplayItems.push({
                    type: 'floor',
                    floorId: floorId,
                    floorName: floorData.floorName,
                    areaCount: floorData.areas.length,
                    areas: floorData.areas
                });
            } else {
                // For this floor, add area groups and individual areas
                const floorAreaGroups = {};
                const floorIndividualAreas = [];
                
                floorData.areas.forEach(area => {
                    const areaName = area.areaName || area.areaCode;
                    
                    // Check for area group patterns
                    let groupName = null;
                    
                    // Check for numbered area groups (Area Group 1, Area Group 2, etc.)
                    const areaGroupMatch = areaName.match(/AREA\s*GROUP\s*(\d+)/i);
                    if (areaGroupMatch) {
                        groupName = `Area Group ${areaGroupMatch[1]}`;
                    }
                    // Check for MEETING ROOMS first (more specific)
                    else if (areaName.match(/MEETING|CONFERENCE/i)) {
                        groupName = 'MEETING ROOMS';
                    }
                    // Check for LMS patterns (more flexible)
                    else if (areaName.match(/LMS|LM\d+/i)) {
                        groupName = 'LMS ROOM';
                    } 
                    // Check for Workstation patterns (more flexible)
                    else if (areaName.match(/WS\(|WORKSTATION/i)) {
                        groupName = 'WORKSTATION';
                    } 
                    // Check for other room patterns
                    else if (areaName.match(/PANTRY/i)) {
                        groupName = 'PANTRY';
                    } else if (areaName.match(/LIBRARY/i)) {
                        groupName = 'LIBRARY';
                    } else if (areaName.match(/RECOVERY/i)) {
                        groupName = 'RECOVERY ROOM';
                    } else if (areaName.match(/SHORT\s*STAY/i)) {
                        groupName = 'SHORT STAY';
                    } else if (areaName.match(/HYBRID/i)) {
                        groupName = 'HYBRID ROOM';
                    } else if (areaName.match(/SOLO/i)) {
                        groupName = 'SOLO ROOM';
                    } else if (areaName.match(/PASSAGE/i)) {
                        groupName = 'PASSAGE';
                    }
                    // Check for specific area patterns from your data (only if not already categorized)
                    else if (areaName.match(/KANHA|PENCH|RANTHAMBORE|MOLLEM|PERIYAR|BANDIPUR|SUNDARBAN|KAZIRANGA|JIM\s*CORBETT|HEMIS|TADOBA/i)) {
                        groupName = 'LMS ROOM';
                    }
                    
                    if (groupName) {
                        if (!floorAreaGroups[groupName]) {
                            floorAreaGroups[groupName] = [];
                        }
                        floorAreaGroups[groupName].push(area);
                    } else {
                        floorIndividualAreas.push(area);
                    }
                });

                // Add area groups for this floor
                Object.entries(floorAreaGroups).forEach(([groupName, groupAreas]) => {
                    if (groupAreas.length >= 2) {
                        floorDisplayItems.push({
                            type: 'areaGroup',
                            floorId: floorId,
                            floorName: floorData.floorName,
                            groupName: groupName,
                            areaCount: groupAreas.length,
                            areas: groupAreas
                        });
                    } else {
                        // Show individual areas if group is small
                        groupAreas.forEach(area => {
                            floorDisplayItems.push({
                                type: 'individual',
                                floorId: area.floorId,
                                floorName: area.floorName,
                                areaCode: area.areaCode,
                                areaName: area.areaName,
                                area: area
                            });
                        });
                    }
                });

                // Add individual areas for this floor
                floorIndividualAreas.forEach(area => {
                    floorDisplayItems.push({
                        type: 'individual',
                        floorId: area.floorId,
                        floorName: area.floorName,
                        areaCode: area.areaCode,
                        areaName: area.areaName,
                        area: area
                    });
                });
            }
        });

        return floorDisplayItems;
    };

    const inputSx = {
        bgcolor: "white",
        borderRadius: 1,
        minWidth: 150,
        "& .MuiInputBase-input": { py: 1, px: 1.25 },
    };

    // Add click outside handler to close export dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target)) {
                setShowExportDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Handle export success and error states - Keep for Redux state updates
    useEffect(() => {
        if (exportSuccess && hasMounted) {
            // Success message is already shown in handleExport
        }
        if (exportError) {
            // Error message is already shown in handleExport, but show Redux error if different
            if (exportError) {
                showSnackbar(`Download failed: ${exportError}`, 'error');
            }
        }
    }, [exportSuccess, exportError, hasMounted]);

    // Handle email success and error states - Keep for Redux state updates
    useEffect(() => {
        if (emailSuccess && hasMounted) {
            // Success message is already shown in handleExport
        }
        if (emailError) {
            // Error message is already shown in handleExport, but show Redux error if different
            if (emailError) {
                showSnackbar(`Email send failed: ${emailError}`, 'error');
            }
        }
    }, [emailSuccess, emailError, hasMounted]);

    // Fetch user profile on component mount
    useEffect(() => {
        dispatch(fetchProfile());
    }, [dispatch]);

    // Clear ALL success states when component mounts to prevent showing stale success messages
    useEffect(() => {
        // Always clear success states when component mounts to prevent stale messages
        // This ensures no unwanted popups appear when navigating to the page
        dispatch(clearExportSuccess());
        dispatch(clearEmailSuccess());
        
        // Set mounted flag after a short delay to allow legitimate success messages to show
        const timer = setTimeout(() => {
            setHasMounted(true);
        }, 100);
        
        return () => clearTimeout(timer);
    }, []); // Empty dependency array means this runs only on mount

    // Check if user has permission to access Activity Report
    if (!canAccessActivityReport()) {
        return (
            <Box sx={{ p: 2.5, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                    Access Denied
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    You don't have permission to access Activity Reports.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 2.5, position: 'relative' }}>
            {/* Limited Access Notice for Operators */}
            {hasLimitedAccess() && (
                <Box sx={{ 
                    mb: 2, 
                    p: 2, 
                    //backgroundColor: 'rgba(255, 193, 7, 0.1)', 
                    //border: '1px solid rgba(255, 193, 7, 0.3)',
                    //borderRadius: 1
                }}>
                    
                </Box>
            )}

            {/* Export Button - Top Right */}
            <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }} ref={exportDropdownRef}>
                <Button
                    variant="text"
                    startIcon={<FileUploadIcon sx={{ color: '#fff' }} />}
                    sx={{ 
                        color: '#fff',
                        textTransform: 'none',
                        fontWeight: 500,
                        '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.1)'
                        }
                    }}
                    onClick={() => setShowExportDropdown(!showExportDropdown)}
                >
                    Export
                </Button>
                {showExportDropdown && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            backgroundColor: '#CDC0A0',
                            border: '1px solid #444',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            zIndex: 1000,
                            minWidth: '180px',
                            padding: '8px 0',
                            marginTop: '4px'
                        }}
                    >
                        <button
                            onClick={() => {
                                handleExport('email');
                                setShowExportDropdown(false);
                            }}
                            disabled={emailLoading}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: 'none',
                                background: 'none',
                                cursor: emailLoading ? 'not-allowed' : 'pointer',
                                textAlign: 'left',
                                fontSize: '14px',
                                color: emailLoading ? '#888' : '#fff',
                                fontWeight: '500',
                                borderBottom: '1px solid #444',
                                opacity: emailLoading ? 0.6 : 1
                            }}
                        >
                            {emailLoading ? 'Sending...' : 'Send By Email'}
                        </button>
                        <button
                            onClick={() => {
                                handleExport('download');
                                setShowExportDropdown(false);
                            }}
                            disabled={exportLoading}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: 'none',
                                background: 'none',
                                cursor: exportLoading ? 'not-allowed' : 'pointer',
                                textAlign: 'left',
                                fontSize: '14px',
                                color: exportLoading ? '#888' : '#fff',
                                fontWeight: '500',
                                opacity: exportLoading ? 0.6 : 1
                            }}
                        >
                            {exportLoading ? 'Downloading...' : 'Download to PC'}
                        </button>
                    </div>
                )}
            </div>

            <Grid container alignItems="center" columnSpacing={2} rowSpacing={1} sx={{ mb: 1 }}>
                <Grid item xs={12} md={9.5}>
                    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#fff", width: "7em", textDecoration: "underline" }}>
                            Areas
                        </Typography>

                        <Button
                            onClick={() => setDialogOpen(true)}
                            startIcon={<AddIcon sx={{ fontSize: 18 }} />}
                            sx={{
                                textTransform: "none",
                                borderRadius: 2,
                                px: 1.25,
                                py: 0.25,
                                color: "#fff",
                                minHeight: 32,
                                "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
                            }}
                        >
                            Add Areas
                        </Button>

                        <Stack direction="row" spacing={1} flexWrap="wrap">
                            {getIntelligentAreaDisplay(selectedAreas).map((item, index) => {
                                if (item.type === 'floor') {
                                    return (
                                        <Chip
                                            size="small"
                                            key={`floor-${item.floorId}-${index}`}
                                            label={`${item.floorName} (${item.areaCount} areas)`}
                                            onDelete={() => {
                                                // Remove all areas in this floor
                                                item.areas.forEach(area => {
                                                    removeArea(area.floorId, area.areaCode);
                                                });
                                            }}
                                            deleteIcon={<CloseRoundedIcon sx={{ color: "#fff" }} />}
                                            sx={{
                                                borderRadius: "18px",
                                                bgcolor: "transparent",
                                                color: "#fff",
                                                border: "1px solid rgba(255,255,255,0.6)",
                                                "& .MuiChip-deleteIcon": { ml: 0.25 },
                                                height: 30,
                                                fontWeight: 600,
                                            }}
                                            variant="outlined"
                                        />
                                    );
                                } else if (item.type === 'areaGroup') {
                                    return (
                                        <Chip
                                            size="small"
                                            key={`areaGroup-${item.floorId}-${item.groupName}-${index}`}
                                            label={`${item.groupName} (${item.areaCount}) - ${item.floorName}`}
                                            onDelete={() => {
                                                // Remove all areas in this area group
                                                item.areas.forEach(area => {
                                                    removeArea(area.floorId, area.areaCode);
                                                });
                                            }}
                                            deleteIcon={<CloseRoundedIcon sx={{ color: "#fff" }} />}
                                            sx={{
                                                borderRadius: "18px",
                                                bgcolor: "transparent",
                                                color: "#fff",
                                                border: "1px solid rgba(255,255,255,0.6)",
                                                "& .MuiChip-deleteIcon": { ml: 0.25 },
                                                height: 30,
                                                fontWeight: 600,
                                            }}
                                            variant="outlined"
                                        />
                                    );
                                } else {
                                    return (
                                        <Chip
                                            size="small"
                                            key={`${item.floorId}-${item.areaCode}`}
                                            label={item.areaName}
                                            onDelete={() => removeArea(item.floorId, item.areaCode)}
                                            deleteIcon={<CloseRoundedIcon sx={{ color: "#fff" }} />}
                                            sx={{
                                                borderRadius: "18px",
                                                bgcolor: "transparent",
                                                color: "#fff",
                                                border: "1px solid rgba(255,255,255,0.6)",
                                                "& .MuiChip-deleteIcon": { ml: 0.25 },
                                                height: 30,
                                            }}
                                            variant="outlined"
                                        />
                                    );
                                }
                            })}
                        </Stack>
                    </Stack>
                </Grid>
            </Grid>

            <Grid container sx={{ mt: 1, mb: 1.5 }}>
                <Grid item xs="auto" sx={{ pr: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#fff", textDecoration: "underline" }}>
                        Activity Type:
                    </Typography>
                </Grid>
                <Grid item xs>
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "repeat(2, minmax(160px, 1fr))",
                                sm: "repeat(3, minmax(160px, 1fr))",
                                md: "repeat(4, minmax(180px, 1fr))",
                                lg: "repeat(5, minmax(200px, 1fr))",
                            },
                            columnGap: 0,
                            rowGap: 0.5,
                            alignItems: "center",
                        }}
                    >
                        {activityTypes.map((t) => {
                            const isDisabled = selectedAreas.length > 0 && !t.canFilterByArea;
                            const tooltipText = isDisabled 
                                ? `You can't add ${t.label} and area filters together`
                                : '';
                            
                            return (
                                <Tooltip key={t.key} title={tooltipText} arrow>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                size="small"
                                                color="default"
                                                checked={checked[t.key]}
                                                onChange={(e) =>
                                                    setChecked((prev) => ({ ...prev, [t.key]: e.target.checked }))
                                                }
                                                disabled={isDisabled}
                                                disableRipple
                                                sx={{ 
                                                    p: 1.5, 
                                                    "& .MuiSvgIcon-root": { fontSize: 20 },
                                                    "&.Mui-disabled": {
                                                        color: "rgba(255, 255, 255, 0.3)"
                                                    }
                                                }}
                                            />
                                        }
                                        label={
                                            <Typography sx={{ 
                                                color: isDisabled ? "rgba(255, 255, 255, 0.3)" : "#fff", 
                                                whiteSpace: "nowrap" 
                                            }}>
                                                {t.label}
                                            </Typography>
                                        }
                                        sx={{ m: 0, height: 32, alignItems: "center" }}
                                    />
                                </Tooltip>
                            );
                        })}
                    </Box>
                </Grid>
            </Grid>

            <Grid container alignItems="center" columnSpacing={2} rowSpacing={1.5} sx={{ mt: 0.5 }}>
                <Grid item xs="auto">
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#fff", width: "8em", textDecoration: "underline" }}>
                        Select Duration
                    </Typography>
                </Grid>

                <Grid item xs="auto">
                    <TextField
                        type="date"
                        size="small"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        sx={{
                            ...inputSx,
                            bgcolor: "#FFFFFF",
                            input: { color: "#000" } // black text inside
                        }}
                        placeholder={"start date"}
                    />
                </Grid>

                <Grid item xs="auto" sx={{ display: "flex", alignItems: "end" }}>
                    <TimeInput24Hour
                        size="small"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        sx={{
                            ...inputSx,
                            minWidth: 110,
                            bgcolor: "#FFFFFF",
                            input: { color: "#000" }
                        }}
                    />
                </Grid>

                <Grid item xs="auto" sx={{ display: "flex", alignItems: "center", mx: 1 }}>
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)" }}>
                        to
                    </Typography>
                </Grid>

                <Grid item xs="auto">
                    <TextField
                        type="date"
                        size="small"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        sx={{
                            ...inputSx,
                            bgcolor: "#FFFFFF",
                            input: { color: "#000" }
                        }}
                    />
                </Grid>

                <Grid item xs="auto" sx={{ display: "flex", alignItems: "end" }}>
                    <TimeInput24Hour
                        size="small"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        sx={{
                            ...inputSx,
                            minWidth: 110,
                            bgcolor: "#FFFFFF",
                            input: { color: "#000" }
                        }}
                    />
                </Grid>

                <Grid item xs="auto" sx={{ display: "flex", alignItems: "end", ml: 2 }}>
                    <Button
                        variant="contained"
                        onClick={handleGenerate}
                        sx={{
                            padding: "10px 28px",
                            borderRadius: 0.6,
                            border: "none",
                            background: buttonColor,
                            color: "#fff",
                            fontWeight: 500,
                            cursor: "pointer",
                            textTransform: "none",
                            "&:hover": {
                                backgroundColor: buttonColor,
                                opacity: 0.9
                            }
                        }}
                    >
                        Generate
                    </Button>
                </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
                <ActivityReportTable rows={rows} loading={loading} error={error} selectedAreas={selectedAreas} />
            </Box>
            <SelectAreaDialog open={dialogOpen} onClose={closeDialog} onAdd={handleAdd} />
            
            {/* MUI Snackbar for notifications */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleSnackbarClose}
                    severity={snackbarSeverity}
                    sx={{
                        width: '100%',
                        backgroundColor: 'white',
                        color: 'black',
                        border: snackbarSeverity === 'error'
                            ? '1px solid #f44336'
                            : snackbarSeverity === 'warning'
                                ? '1px solid #ff9800'
                                : '1px solid #4CAF50',
                        '& .MuiAlert-icon': {
                            color: snackbarSeverity === 'error'
                                ? '#f44336'
                                : snackbarSeverity === 'warning'
                                    ? '#ff9800'
                                    : '#4CAF50'
                        }
                    }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
            
            {/* Email Input Dialog - DISABLED: No popup, using saved email only */}
        </Box>
    );
};

export default ActivityReport;