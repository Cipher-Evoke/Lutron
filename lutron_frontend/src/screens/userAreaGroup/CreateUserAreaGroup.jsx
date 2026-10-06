import React, { useEffect, useState } from 'react';
import {
    Box, Button, TextField, Typography,
    List, ListItem, IconButton, ListItemText, Divider, Snackbar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { RiDeleteBin6Fill } from "react-icons/ri";
import SelectAreaDialog from '../../screens/create-area-model/SelectAreaDialog';
import { useDispatch, useSelector } from 'react-redux';
import { createAreaGroup } from '../../redux/slice/floor/floorSlice';
import { selectApplicationTheme } from '../../redux/slice/theme/themeSlice';
import { fetchAreaGroups } from '../../redux/slice/settingsslice/heatmap/groupOccupancySlice';

const CreateUserAreaGroup = () => {
    const role = localStorage.getItem("role")
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [groupName, setGroupName] = useState('');
    const [locations, setLocations] = useState([]);
    const [floorAreas, setFloorAreas] = useState([]);
    const [areaDialogOpen, setAreaDialogOpen] = useState(false);
    const [showCreateSuccess, setShowCreateSuccess] = useState(false);
    const [showCreateFailure, setShowCreateFailure] = useState(false);
    const [isDisable, setIsDisable] = useState(false);
    const appTheme = useSelector(selectApplicationTheme);
    const backgroundColor = appTheme?.application_theme?.background || '#d2c4a2';
    const contentColor = appTheme?.application_theme?.content || 'rgba(128, 120, 100, 0.7)';
    const buttonColor = appTheme?.application_theme?.button || '#232323'
    const handleDelete = (index) => {
        const updatedLocations = [...locations];
        const removed = updatedLocations.splice(index, 1)[0];
        setLocations(updatedLocations);
        const removedFloorId = removed.floorId;
        const removedAreaIds = new Set(removed.areaIds);
        const updatedFloorAreas = floorAreas.map(floor => {
            if (floor.floor_id === removedFloorId) {
                const filteredIds = floor.area_ids.filter(id => !removedAreaIds.has(id));
                return { ...floor, area_ids: filteredIds };
            }
            return floor;
        }).filter(f => f.area_ids.length > 0);
        setFloorAreas(updatedFloorAreas);
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
        setIsDisable(true)
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
        dispatch(createAreaGroup(payload))
            .unwrap()
            .then(() => {
                setShowCreateSuccess(true);
                // Refresh the area groups list before navigating back
                dispatch(fetchAreaGroups());
                setTimeout(() => navigate('/manage-area-groups'), 1000);
                setIsDisable(false)
            })
            .catch(() => {
                setShowCreateFailure(true);
                setIsDisable(false)
            });
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
                        <Typography variant="h6" fontWeight="bold" mb={1}>
                            Area Group Name
                        </Typography>
                        <TextField
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            size="small"
                            variant="outlined"
                            sx={{ width: 320 }}
                        />
                        <Button
                            startIcon={<AddIcon />}
                            onClick={handleAddLocation}
                            sx={{
                                textTransform: 'none',
                                mt: 3,
                                pl: 0,
                            }}
                        >
                            Add Location
                        </Button>
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
                            {locations.map((location, index) =>
                                location.areaNames.map((name, idx) => (
                                    <ListItem
                                        key={`${location.floorId}-${name}`}
                                        secondaryAction={
                                            <IconButton
                                                onClick={() => {
                                                    // Remove this area from this location
                                                    const updatedAreaCodes = [...location.areaCodes];
                                                    updatedAreaCodes.splice(idx, 1);
                                                    const updatedAreaNames = [...location.areaNames];
                                                    updatedAreaNames.splice(idx, 1);
                                                    const updatedAreaIds = [...location.areaIds];
                                                    updatedAreaIds.splice(idx, 1);
                                                    if (updatedAreaIds.length === 0) {
                                                        // Remove the whole location if no areas left
                                                        setLocations(prev => prev.filter((_, i) => i !== index));
                                                    } else {
                                                        // Update the location with the removed area
                                                        setLocations(prev => prev.map((loc, i) =>
                                                            i === index
                                                                ? { ...loc, areaCodes: updatedAreaCodes, areaNames: updatedAreaNames, areaIds: updatedAreaIds }
                                                                : loc
                                                        ));
                                                    }
                                                }}
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
                    <Button
                        variant="contained"
                        onClick={() => navigate('/manage-area-groups')}
                        sx={{ backgroundColor: 'buttonColor', color: '#fff' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        disabled={isDisable}
                        variant="contained"
                        onClick={handleSave}
                        sx={{ backgroundColor: 'buttonColor', color: '#fff' }}
                    >
                        Save
                    </Button>
                </Box>

                {/* Snackbar for success */}
                <Snackbar
                    open={showCreateSuccess}
                    autoHideDuration={3000}
                    onClose={() => setShowCreateSuccess(false)}
                    message="Area group created successfully!"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    ContentProps={{
                        sx: {
                            backgroundColor: '#232323',
                            color: '#fff',
                            fontSize: 14
                        }
                    }}
                />

                {/* Snackbar for failure */}
                <Snackbar
                    open={showCreateFailure}
                    autoHideDuration={3000}
                    onClose={() => setShowCreateFailure(false)}
                    message="Failed to create area group. Please try again."
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    ContentProps={{
                        sx: {
                            backgroundColor: '#232323',
                            color: '#fff',
                            fontSize: 14
                        }
                    }}
                />
        </Box>
    )
}

export default CreateUserAreaGroup