import React, { useEffect, useState } from 'react';
import {
    Box, Button, TextField, Typography,
    List, ListItem, IconButton, ListItemText, Divider, Snackbar,
    Grid,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { RiDeleteBin6Fill } from "react-icons/ri";
import SelectAreaDialog from '../../screens/create-area-model/SelectAreaDialog';
import { useDispatch, useSelector } from 'react-redux';
import { createAreaGroup } from '../../redux/slice/floor/floorSlice';
import { deleteAreaGroup, fetchAreaGroups, fetchSingleAreaGroups, getSingleAreaGroup, selectAreaGroups, updateAreaGroup } from '../../redux/slice/settingsslice/heatmap/groupOccupancySlice';
import { UseAuth, getOverallPermissionLevel } from '../../customhooks/UseAuth';
import { selectProfile } from '../../redux/slice/auth/userlogin';
import DeleteIcon from '@mui/icons-material/Delete';
import { selectApplicationTheme } from '../../redux/slice/theme/themeSlice';
import { ConfirmDialog } from '../../utils/FeedbackUI';

const UpdateUserAreaGroup = () => {
    const { id } = useParams()
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    // Get user authentication, role, and permission
    const { role } = UseAuth();
    const userProfile = useSelector(selectProfile);
    const overallPermission = getOverallPermissionLevel(userProfile);
    
    
    // Check if user has permission to view area group details
    const canViewAreaGroupDetails = () => {
        // Superadmin and Admin can always view
        if (role === 'Superadmin' || role === 'Admin') return true;
        // All Operator roles can view
        if (role === 'Operator') return true;
        return false;
    };
    
    // Check if user has permission to modify area groups
    const canModifyAreaGroup = () => {
        // Superadmin and Admin can always modify
        if (role === 'Superadmin' || role === 'Admin') return true;
        // Only Operator with "Monitoring, edit and control" permission can modify
        const canModify = role === 'Operator' && overallPermission === 'Monitoring, edit and control';
        return canModify;
    };
    
    // Check if user has permission to delete area groups
    const canDeleteAreaGroup = () => {
        // Superadmin and Admin can always delete
        if (role === 'Superadmin' || role === 'Admin') return true;
        // Only Operator with "Monitoring, edit and control" permission can delete
        const canDelete = role === 'Operator' && overallPermission === 'Monitoring, edit and control';
        return canDelete;
    };
    
    // Check if user has permission to copy area groups
    const canCopyAreaGroup = () => {
        // Superadmin and Admin can always copy
        if (role === 'Superadmin' || role === 'Admin') return true;
        // Only Operator with "Monitoring, edit and control" permission can copy
        const canCopy = role === 'Operator' && overallPermission === 'Monitoring, edit and control';
        return canCopy;
    };
    
    
    const areaGroups = useSelector(getSingleAreaGroup);
    const [groupName, setGroupName] = useState('');
    const [locations, setLocations] = useState([]);
    const [floorAreas, setFloorAreas] = useState([]);
    const [areaDialogOpen, setAreaDialogOpen] = useState(false);
    const [actionMode, setActionMode] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isCopyMode, setIsCopyMode] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [showSnackbar, setShowSnackbar] = useState(false);
    const [showCreateFailure, setShowCreateFailure] = useState(false);
    
    // Add confirmation dialog states
    const [showDeleteGroupDialog, setShowDeleteGroupDialog] = useState(false);
    const [showDeleteAreaDialog, setShowDeleteAreaDialog] = useState(false);
    const [areaToDelete, setAreaToDelete] = useState(null);

    const appTheme = useSelector(selectApplicationTheme);
    const backgroundColor = appTheme?.application_theme?.background || '#d2c4a2';
    const contentColor = appTheme?.application_theme?.content || 'rgba(128, 120, 100, 0.7)';
    const buttonColor = appTheme?.application_theme?.button || '#232323'
    const handleDelete = (groupIndex, areaIndex) => {
        // Set the area to delete and show confirmation dialog
        setAreaToDelete({ groupIndex, areaIndex });
        setShowDeleteAreaDialog(true);
    };

    const confirmDeleteArea = () => {
        if (!areaToDelete) return;
        
        const { groupIndex, areaIndex } = areaToDelete;
        const updatedLocations = [...locations];
        const locationGroup = updatedLocations[groupIndex];
        const removedAreaId = locationGroup.areaIds[areaIndex];  // Get the area ID to remove
        locationGroup.areaCodes.splice(areaIndex, 1);
        locationGroup.areaNames.splice(areaIndex, 1);
        locationGroup.areaIds.splice(areaIndex, 1);  // Also remove from areaIds
        if (locationGroup.areaIds.length === 0) {
            updatedLocations.splice(groupIndex, 1);
        }
        setLocations(updatedLocations);
        const updatedFloorAreas = floorAreas.map(floor => {
            if (floor.floor_id === locationGroup.floorId) {
                return {
                    ...floor,
                    area_ids: floor.area_ids.filter(id => id !== removedAreaId)  // Filter by area_ids
                };
            }
            return floor;
        }).filter(f => f.area_ids.length > 0);
        setFloorAreas(updatedFloorAreas);
        
        // Close dialog and reset state
        setShowDeleteAreaDialog(false);
        setAreaToDelete(null);
    };

    const handleDeleteGroup = () => {
        setShowDeleteGroupDialog(true);
    };

    const confirmDeleteGroup = () => {
        if (!id) return;
        dispatch(deleteAreaGroup(id))
            .unwrap()
            .then(() => {
                setSnackbarMessage("Area group deleted successfully!");
                setShowSnackbar(true);
                // Refresh the area groups list before navigating back
                dispatch(fetchAreaGroups());
                setTimeout(() => navigate('/manage-area-groups'), 1500);
            })
            .catch(() => {
                setSnackbarMessage("Failed to delete area group. Please try again.");
                setShowSnackbar(true);
            });
        
        // Close dialog
        setShowDeleteGroupDialog(false);
    };

    const handleAddLocation = () => {
        setAreaDialogOpen(true);
    };

    const handleAddFromDialog = ({ areaNames, areaCodes, areaIds, floorId, floorName }) => {

        const numericFloorId = parseInt(floorId);
        const numericAreaIds = areaIds.map(id => parseInt(id));
        setLocations(prev => [
            ...prev,
            { floorId: numericFloorId, floorName, areaNames, areaCodes: areaCodes, areaIds: numericAreaIds }
        ]);
        setFloorAreas(prev => {
            const updated = [...prev];
            const existing = updated.find(f => f.floor_id === numericFloorId);
            if (existing) {
                existing.area_ids = Array.from(new Set([...existing.area_ids, ...numericAreaIds]));
            } else {
                updated.push({ floor_id: numericFloorId, area_ids: numericAreaIds });
            }
            return updated;
        });
    };

    const handleSave = () => {
        if (!groupName || floorAreas.length === 0) {
            setShowCreateFailure(true);
            return;
        }

        // Validate that all area_ids are numbers and filter out null/undefined values
        const validFloorAreas = floorAreas.map(f => ({
            floor_id: parseInt(f.floor_id),
            area_ids: (f.area_ids || []).filter(id => id != null && id !== undefined).map(id => parseInt(id))
        })).filter(f => f.area_ids.length > 0);

        const payload = {
            name: groupName,
            special: false,
            floors: validFloorAreas
        };

        if (isCopyMode) {
            // Create new area group
            dispatch(createAreaGroup(payload))
                .unwrap()
                .then(() => {
                    setSnackbarMessage("Area group copied successfully!");
                    setShowSnackbar(true);
                    // Refresh the area groups list before navigating back
                    dispatch(fetchAreaGroups());
                    setTimeout(() => navigate('/manage-area-groups'), 1500);
                })
                .catch(() => {
                    setSnackbarMessage("Failed to copy area group. Please try again.");
                    setShowSnackbar(true);
                });
        } else {
            // Update existing area group
            dispatch(updateAreaGroup({ groupId: id, data: payload }))
                .unwrap()
                .then(() => {
                    setSnackbarMessage("Area group updated successfully!");
                    setShowSnackbar(true);
                    // Refresh the area groups list before navigating back
                    dispatch(fetchAreaGroups());
                    setTimeout(() => navigate('/manage-area-groups'), 1500);
                })
                .catch(() => {
                    setSnackbarMessage("Failed to update area group. Please try again.");
                    setShowSnackbar(true);
                });
        }
    };
    useEffect(() => {
        dispatch(fetchSingleAreaGroups(id));
        
        // Check if copy mode is requested from URL
        const mode = searchParams.get('mode');
        if (mode === 'copy') {
            setIsEditing(true);
            setIsCopyMode(true);
        }
    }, [dispatch, searchParams]);
    // useEffect(() => {
    //     if (areaGroups?.areas?.length) {
    //         const grouped = groupAreasByFloor(areaGroups.areas);
    //         setLocations(grouped);
    //     }
    //     if (areaGroups?.name) {
    //         setGroupName(areaGroups.name); // if you want to allow editing the group name
    //     }
    // }, [areaGroups]);
    useEffect(() => {
        if (areaGroups?.areas?.length) {
            const grouped = groupAreasByFloor(areaGroups.areas);
            setLocations(grouped);
            const initialFloorAreas = grouped.map(loc => ({
                floor_id: loc.floorId,
                area_ids: loc.areaIds.map(Number)  // Use area_ids instead of area_codes
            }));
            setFloorAreas(initialFloorAreas);
        }

        if (areaGroups?.name) {
            // If in copy mode, set the copy name, otherwise use original name
            if (isCopyMode) {
                const timestamp = new Date().toLocaleString();
                setGroupName(`Copy of ${areaGroups.name} - ${timestamp}`);
            } else {
                setGroupName(areaGroups.name);
            }
        }
    }, [areaGroups, isCopyMode]);

    const groupAreasByFloor = (areas = []) => {
        const grouped = {};

        areas.forEach((area) => {
            const key = area.floor_id;

            if (!grouped[key]) {
                grouped[key] = {
                    floorId: area.floor_id,
                    floorName: area.floor_name,
                    areaCodes: [],
                    areaNames: [],
                    areaIds: []  // Add area IDs array
                };
            }

            grouped[key].areaCodes.push(parseInt(area.code));
            grouped[key].areaNames.push(area.name);
            grouped[key].areaIds.push(parseInt(area.id));  // Track area IDs
        });

        return Object.values(grouped);
    };
    return (
        <Box className="area-group-container" sx={{
            minHeight: 'calc(100vh - 180px)',
            maxHeight: 'none',
            backgroundColor: 'white',
            padding: { xs: 2, sm: 3, md: 4 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'visible',
            width: '100%',
            boxSizing: 'border-box'
        }}>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

                {/* Header Row */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', mb: 3, flexShrink: 0 }}>
                    {/* Group Name - Editable in copy mode, read-only in modify mode */}
                    {isCopyMode ? (
                        <TextField
                            label="Area Group Name"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            variant="outlined"
                            fullWidth
                            sx={{ mb: 2 }}
                            InputProps={{
                                sx: {
                                    backgroundColor: 'white',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#ccc',
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#999',
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: buttonColor,
                                    },
                                }
                            }}
                            InputLabelProps={{
                                sx: {
                                    color: '#666',
                                    '&.Mui-focused': {
                                        color: buttonColor,
                                    },
                                }
                            }}
                        />
                    ) : (
                        <Typography variant="h6" fontWeight="bold" mb={1}>
                            Area Group : {areaGroups?.name}
                        </Typography>
                    )}
                    
                    {/* Add Location Button - Show in both copy and modify modes */}
                    {canModifyAreaGroup() && isEditing && (
                        <Button
                            startIcon={<AddIcon />}
                            onClick={handleAddLocation}
                            sx={{
                                border: "1px solid grey",
                                textTransform: 'none',
                                p: 1,
                                mt: 3,
                            }}
                        >
                            Add Location
                        </Button>
                    )}
                </Box>

                <Divider sx={{ my: 2, width: '40%', flexShrink: 0 }} />

                {/* Scrollable List Box - Takes remaining space */}
                <Box sx={{ 
                    flex: 1, 
                    overflowY: 'auto', 
                    minHeight: 0,
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    p: 1
                }}>
                    <List disablePadding>
                        {locations.map((location, groupIndex) =>
                            location.areaNames.map((name, areaIndex) => (
                                <ListItem
                                    key={`${location.floorId}-${name}-${areaIndex}`}
                                    secondaryAction={
                                        isEditing && (
                                            <IconButton
                                                onClick={() => handleDelete(groupIndex, areaIndex)}
                                                sx={{
                                                    ml: 1,
                                                    backgroundColor: '#232323',
                                                    borderRadius: 1,
                                                    color: '#fff',
                                                    '&:hover': { backgroundColor: '#444' },
                                                }}
                                            >
                                                <span style={{ fontSize: 16, fontWeight: 'bold' }}>🗑️</span>
                                            </IconButton>
                                        )
                                    }
                                    sx={{ 
                                        py: 1, 
                                        px: 2,
                                        borderRadius: 1,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease-in-out',
                                        '&:hover': {
                                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                            transform: 'translateX(4px)',
                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                        },
                                        '&:active': {
                                            backgroundColor: 'rgba(0, 0, 0, 0.08)',
                                            transform: 'translateX(2px)',
                                        }
                                    }}
                                >
                                    <Typography variant="body1" sx={{ 
                                        flexGrow: 1,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        minWidth: 0
                                    }}>
                                        {location.floorName} &gt; {name}
                                    </Typography>
                                </ListItem>
                            ))
                        )}
                    </List>
                </Box>

                <SelectAreaDialog
                    open={areaDialogOpen}
                    onClose={() => setAreaDialogOpen(false)}
                    onAdd={handleAddFromDialog}
                />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, flexShrink: 0, mt: 2 }}>
                {/* Default mode (Copy, Modify, Delete, Close) */}
                {!isEditing && (
                    <>
                        {canCopyAreaGroup() && (
                            <Button
                                variant="contained"
                                onClick={() => {
                                    setIsEditing(true);
                                    setIsCopyMode(true);
                                    // Set the copy name with a timestamp to make it unique
                                    const timestamp = new Date().toLocaleString();
                                    setGroupName(`Copy of ${areaGroups?.name || groupName} - ${timestamp}`);
                                }}
                                sx={{ backgroundColor: 'buttonColor', color: '#fff' }}
                            >
                                Copy
                            </Button>
                        )}

                        {canModifyAreaGroup() && (
                            <Button
                                variant="contained"
                                onClick={() => setIsEditing(true)} // Start modify mode
                                sx={{ backgroundColor: 'buttonColor', color: '#fff' }}
                            >
                                Modify
                            </Button>
                        )}
                        {canDeleteAreaGroup() && (
                            <Button
                                variant="contained"
                                onClick={handleDeleteGroup}
                                sx={{ backgroundColor: 'buttonColor', color: '#fff' }}
                            >
                                Delete
                            </Button>
                        )}
                        <Button
                            variant="contained"
                            onClick={() => navigate('/manage-area-groups')}
                            sx={{ backgroundColor: 'buttonColor', color: '#fff' }}
                        >
                            Close
                        </Button>
                    </>
                )}

                {/* Edit mode (Save and Cancel) */}
                {isEditing && (
                    <>
                        <Button
                            variant="contained"
                            onClick={() => {
                                setIsEditing(false); // Cancel editing
                                setIsCopyMode(false); // Reset copy mode
                                // Reset group name to original
                                setGroupName(areaGroups?.name || '');
                                // Reload original data
                                dispatch(fetchSingleAreaGroups(id));
                            }}
                            sx={{ backgroundColor: 'buttonColor', color: '#fff' }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSave}
                            sx={{ backgroundColor: 'buttonColor', color: '#fff' }}
                        >
                            Save
                        </Button>
                    </>
                )}
            </Box>

            {/* Snackbar for success */}
            <Snackbar
                    open={showSnackbar}
                    autoHideDuration={3000}
                    onClose={() => setShowSnackbar(false)}
                    message={snackbarMessage}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    ContentProps={{
                        sx: {
                            backgroundColor: '#232323',
                            color: '#fff',
                            fontSize: 14
                        }
                    }}
            />

            {/* Confirmation Dialog for deleting an area */}
            <ConfirmDialog
                    open={showDeleteAreaDialog}
                    title="Remove Area"
                    message="Are you sure you want to remove this area from the group?"
                    onConfirm={confirmDeleteArea}
                    onCancel={() => {
                        setShowDeleteAreaDialog(false);
                        setAreaToDelete(null);
                    }}
            />

            {/* Confirmation Dialog for deleting the entire group */}
            <ConfirmDialog
                    open={showDeleteGroupDialog}
                    title="Delete Area Group"
                    message={`Are you sure you want to delete area group "${groupName}"?`}
                    onConfirm={confirmDeleteGroup}
                    onCancel={() => setShowDeleteGroupDialog(false)}
            />
        </Box>
    );
}

export default UpdateUserAreaGroup