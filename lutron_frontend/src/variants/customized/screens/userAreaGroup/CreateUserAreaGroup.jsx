import React, { useMemo, useState } from 'react';
import {
    Box, Button, TextField, Typography,
    List, ListItem, IconButton, Divider, Snackbar, Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import SelectAreaDialog from '../../screens/create-area-model/SelectAreaDialog';
import { useDispatch } from 'react-redux';
import { createAreaGroup } from '../../redux/slice/floor/floorSlice';
import { fetchAreaGroups } from '../../redux/slice/settingsslice/heatmap/groupOccupancySlice';
import { createSingleFlight } from "../../../../shared/utils/createSingleFlight";

/** Aggregate per-floor area ids from all "Add location" batches (deduped). */
function buildFloorAreasFromLocations(locations) {
    const byFloor = new Map();
    for (const loc of locations) {
        const fid = parseInt(loc.floorId, 10);
        if (Number.isNaN(fid)) continue;
        if (!byFloor.has(fid)) byFloor.set(fid, new Set());
        for (const id of loc.areaIds || []) {
            const n = parseInt(id, 10);
            if (!Number.isNaN(n)) byFloor.get(fid).add(n);
        }
    }
    return Array.from(byFloor.entries())
        .map(([floor_id, set]) => ({
            floor_id,
            area_ids: Array.from(set),
        }))
        .filter((f) => f.area_ids.length > 0);
}

const CreateUserAreaGroup = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [groupName, setGroupName] = useState('');
    const [locations, setLocations] = useState([]);
    const [areaDialogOpen, setAreaDialogOpen] = useState(false);
    const [showCreateSuccess, setShowCreateSuccess] = useState(false);
    const [showCreateFailure, setShowCreateFailure] = useState(false);
    const [isDisable, setIsDisable] = useState(false);
    const floorAreas = useMemo(() => buildFloorAreasFromLocations(locations), [locations]);

    const totalAreaCount = useMemo(
        () => floorAreas.reduce((acc, f) => acc + (f.area_ids?.length || 0), 0),
        [floorAreas]
    );

    const handleAddLocation = () => {
        setAreaDialogOpen(true);
    };

    const handleAddFromDialog = ({ areaNames, areaCodes, areaIds, floorId, floorName }) => {
        const numericFloorId = parseInt(floorId, 10);
        const numericAreaIds = (areaIds || []).map((id) => parseInt(id, 10)).filter((n) => !Number.isNaN(n));
        if (!numericAreaIds.length) return;
        setLocations((prev) => [
            ...prev,
            {
                floorId: numericFloorId,
                floorName,
                areaNames: areaNames || [],
                areaCodes: areaCodes || [],
                areaIds: numericAreaIds,
            },
        ]);
    };

    const runSaveOnce = useMemo(() => createSingleFlight(), []);
    const handleSave = async () => runSaveOnce(async () => {
        setIsDisable(true);
        const trimmedName = String(groupName ?? '').trim();
        if (!trimmedName || floorAreas.length === 0) {
            setShowCreateFailure(true);
            setIsDisable(false);
            return;
        }

        const validFloorAreas = floorAreas
            .map((f) => ({
                floor_id: parseInt(f.floor_id, 10),
                area_ids: (f.area_ids || [])
                    .filter((id) => id != null && id !== undefined)
                    .map((id) => parseInt(id, 10)),
            }))
            .filter((f) => f.area_ids.length > 0);

        if (validFloorAreas.length === 0) {
            setShowCreateFailure(true);
            setIsDisable(false);
            return;
        }

        const payload = {
            name: trimmedName,
            special: false,
            floors: validFloorAreas,
        };

        dispatch(createAreaGroup(payload))
            .unwrap()
            .then(() => {
                setShowCreateSuccess(true);
                dispatch(fetchAreaGroups());
                setTimeout(() => navigate('/setting/manage-area-groups'), 1000);
                setIsDisable(false);
            })
            .catch(() => {
                setShowCreateFailure(true);
                setIsDisable(false);
            });
    });

    return (
        <Box
            className="area-group-container"
            sx={{
                minHeight: 'calc(100vh - 180px)',
                maxHeight: 'none',
                backgroundColor: 'white',
                padding: { xs: 2, sm: 3, md: 4 },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                overflow: 'visible',
                width: '100%',
                boxSizing: 'border-box',
            }}
        >
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', mb: 2, flexShrink: 0 }}>
                    <Typography variant="h6" fontWeight="bold" mb={1}>
                        Area Group Name
                    </Typography>
                    <TextField
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        size="small"
                        variant="outlined"
                        sx={{ width: 320 }}
                        placeholder="e.g. West wing zones"
                    />
                    <Alert severity="info" sx={{ mt: 2, maxWidth: 520, fontSize: 13 }}>
                        Add areas from any floor, as many times as you need. Each time you click{' '}
                        <strong>Add Location</strong>, pick a floor and select one or more areas (or whole branches).
                        Areas are merged into one group. After saving, select this group in the dashboard{' '}
                        <strong>Manage area groups</strong> control to filter{' '}
                        <strong>Consumption by area group</strong> (Energy) and{' '}
                        <strong>Utilization by area group</strong> (Space) together.
                    </Alert>
                    {floorAreas.length > 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                            Summary: {floorAreas.length} floor{floorAreas.length === 1 ? '' : 's'}, {totalAreaCount} area
                            {totalAreaCount === 1 ? '' : 's'} (deduplicated for the API).
                        </Typography>
                    )}
                    <Button
                        startIcon={<AddIcon />}
                        onClick={handleAddLocation}
                        sx={{
                            textTransform: 'none',
                            mt: 2,
                            pl: 0,
                        }}
                    >
                        Add Location
                    </Button>
                </Box>

                <Divider sx={{ my: 2, width: '40%', flexShrink: 0 }} />

                <Box
                    sx={{
                        flex: 1,
                        overflowY: 'auto',
                        minHeight: 0,
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                        p: 1,
                    }}
                >
                    {locations.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                            No areas yet. Use <strong>Add Location</strong> to choose floors and areas.
                        </Typography>
                    ) : (
                        <List disablePadding>
                            {locations.map((location, index) =>
                                location.areaNames.map((name, idx) => (
                                    <ListItem
                                        key={`${location.floorId}-${location.areaIds[idx]}-${index}-${idx}`}
                                        secondaryAction={
                                            <IconButton
                                                onClick={() => {
                                                    const updatedAreaCodes = [...location.areaCodes];
                                                    updatedAreaCodes.splice(idx, 1);
                                                    const updatedAreaNames = [...location.areaNames];
                                                    updatedAreaNames.splice(idx, 1);
                                                    const updatedAreaIds = [...location.areaIds];
                                                    updatedAreaIds.splice(idx, 1);
                                                    if (updatedAreaIds.length === 0) {
                                                        setLocations((prev) => prev.filter((_, i) => i !== index));
                                                    } else {
                                                        setLocations((prev) =>
                                                            prev.map((loc, i) =>
                                                                i === index
                                                                    ? {
                                                                          ...loc,
                                                                          areaCodes: updatedAreaCodes,
                                                                          areaNames: updatedAreaNames,
                                                                          areaIds: updatedAreaIds,
                                                                      }
                                                                    : loc
                                                            )
                                                        );
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
                                            },
                                        }}
                                    >
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                flexGrow: 1,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                minWidth: 0,
                                            }}
                                        >
                                            {location.floorName} / {name}
                                        </Typography>
                                    </ListItem>
                                ))
                            )}
                        </List>
                    )}
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
                    onClick={() => navigate('/setting/manage-area-groups')}
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
                        fontSize: 14,
                    },
                }}
            />

            <Snackbar
                open={showCreateFailure}
                autoHideDuration={3000}
                onClose={() => setShowCreateFailure(false)}
                message="Failed to create area group. Add a name, at least one area, and try again."
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                ContentProps={{
                    sx: {
                        backgroundColor: '#232323',
                        color: '#fff',
                        fontSize: 14,
                    },
                }}
            />
        </Box>
    );
};

export default CreateUserAreaGroup;
