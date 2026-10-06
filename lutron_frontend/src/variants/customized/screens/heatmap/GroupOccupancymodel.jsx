import React, { useEffect, useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  IconButton,
  Button,
  OutlinedInput,
  CircularProgress,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAreaGroups,
  fetchGroupOccupancyStatus,
  updateGroupOccupancy,
  selectAreaGroups,
  selectGroupOccupancyStatus,
  selectGroupOccupancyLoading,
  selectGroupOccupancyUpdating,
} from '../../redux/slice/settingsslice/heatmap/groupOccupancySlice';
import { selectApplicationTheme } from '../../redux/slice/theme/themeSlice';
import { darken } from '@mui/material/styles';
import { normalizeOccupancyModeString } from '../../redux/slice/settingsslice/heatmap/occupancyModeUtils';

const modeOptions = ['Disabled', 'Auto', 'Vacancy'];

const normalizeSelectableMode = (raw) => {
  const n = normalizeOccupancyModeString(raw);
  return modeOptions.includes(n) ? n : '';
};

const GroupOccupancyModel = ({ open, onClose, currentUserRole }) => {
  const dispatch = useDispatch();
  const areaGroups = useSelector(selectAreaGroups);
  const status = useSelector(selectGroupOccupancyStatus);
  const loading = useSelector(selectGroupOccupancyLoading);
  const updating = useSelector(selectGroupOccupancyUpdating);
  const appTheme = useSelector(selectApplicationTheme);
  const backgroundColor = appTheme?.application_theme?.background || '#d2c4a2';
  const buttonColor = appTheme?.application_theme?.button || '#232323';

  const [selectedGroup, setSelectedGroup] = useState("");
  const [localMode, setLocalMode] = useState('');
  const [pendingMode, setPendingMode] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const allSelectableGroups = useMemo(() => {
    const user = areaGroups?.user_area_groups || [];
    const seen = new Set();
    const out = [];
    for (const g of user) {
      const id = String(g.group_id);
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(g);
    }
    return out;
  }, [areaGroups]);

  // Fetch area groups on open and reset selection when closed
  useEffect(() => {
    if (open) {
      dispatch(fetchAreaGroups());
    } else {
      setSelectedGroup('');
      setLocalMode('');
      setPendingMode(false);
      setIsUpdating(false);
      setShowSuccessMessage(false);
    }
  }, [open, dispatch]);

  // Auto-select first group when area groups are loaded
  useEffect(() => {
    if (allSelectableGroups.length > 0 && !selectedGroup) {
      setSelectedGroup(String(allSelectableGroups[0].group_id));
    }
  }, [allSelectableGroups, selectedGroup]);

  // Fetch group occupancy status when group changes
  useEffect(() => {
    if (open && selectedGroup) {
      dispatch(fetchGroupOccupancyStatus(selectedGroup));
    }
  }, [open, selectedGroup, dispatch]);

  // Keep local highlight in sync with backend status (unless a click is pending).
  useEffect(() => {
    if (!open) return;
    const normalized = normalizeSelectableMode(status);
    if (pendingMode) {
      if (normalized && normalized === localMode) {
        setPendingMode(false);
      }
      return;
    }
    if (normalized) {
      setLocalMode(normalized);
    }
  }, [status, open, pendingMode, localMode]);

  const handleModeChange = (mode) => {
    if (!selectedGroup || isUpdating || updating || loading) return;
    const nextMode = normalizeSelectableMode(mode) || mode;

    setLocalMode(nextMode);
    setPendingMode(true);
    setIsUpdating(true);
    setShowSuccessMessage(false);

    dispatch(updateGroupOccupancy({ groupId: selectedGroup, mode: nextMode }))
      .unwrap()
      .then(() => {
        setPendingMode(false);
        setIsUpdating(false);
        setShowSuccessMessage(true);
        dispatch(fetchGroupOccupancyStatus(selectedGroup));
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 3000);
      })
      .catch(() => {
        setPendingMode(false);
        setIsUpdating(false);
        setLocalMode(normalizeSelectableMode(status));
      });
  };

  const fetchConsumption = async (areaIds) => {
    try {
      const res = await fetch(
        `/dashboard/total_consumption/by_area?area_ids=${areaIds.join(",")}`
      );
      await res.json();
  
    } catch (err) {
      console.error("Consumption error:", err);
    }
  };
  
  const fetchUtilization = async (areaIds) => {
    try {
      const res = await fetch(
        `/dashboard/space_utilization_per?area_ids=${areaIds.join(",")}`
      );
      await res.json();
  
    } catch (err) {
      console.error("Utilization error:", err);
    }
  };

  const handleGroupChange = (e) => {
    const groupId = e.target.value;
    setSelectedGroup(groupId);
    setLocalMode('');
    setPendingMode(false);
    setShowSuccessMessage(false);

    const group = allSelectableGroups.find(
      (g) => String(g.group_id) === String(groupId)
    );

    if (!group) return;

    const areaIds = group.floors?.flatMap((f) => f.area_ids || []) || [];
    fetchConsumption(areaIds);
    fetchUtilization(areaIds);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }
      }}
      PaperProps={{ 
        sx: { 
          borderRadius: 2,
          position: 'relative'
        } 
      }}
    >
      <Box
        sx={{
          backgroundColor: backgroundColor,
          borderRadius: 2,
          px: 5,
          py: 2,
          minWidth: 400,
          position: 'relative',
        }}
      >
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: '#fff',
          }}
        >
          <CloseIcon />
        </IconButton>

        <DialogTitle sx={{ fontWeight: 'bold', fontSize: 20, px: 0, pt: 0 }}>
          Edit Occupancy
        </DialogTitle>

        <DialogContent sx={{ px: 0 }}>
          {/* Group/Area Dropdown */}
          {/* <FormControl fullWidth size="small" sx={{ mt: 2, mb: 3 }}>
            <InputLabel id="group-label"></InputLabel>
            <Select
              labelId="group-label"
              value={selectedGroup}
              onChange={handleGroupChange}
              displayEmpty
              input={
                <OutlinedInput
                  placeholder="Select Areagroup"
                  notched={false}
                  sx={{
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none',
                    },
                    px: 1.5,
                  }}
                />
              }
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: '#ffffff',
                    borderRadius: '10px',
                  },
                },
              }}
            >
              <MenuItem value="">
                <em>Select Areagroup</em>
              </MenuItem>
              {allSelectableGroups.map((group) => (
                <MenuItem key={group.group_id} value={String(group.group_id)}>
                  {group.name.toUpperCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl> */}
          <FormControl fullWidth size="small" sx={{ mt: 2, mb: 3 }}>
            <InputLabel id="group-label"></InputLabel>
            <Select
              labelId="group-label"
              value={selectedGroup}
              onChange={handleGroupChange}
              displayEmpty
              input={
                <OutlinedInput
                  placeholder="Select Areagroup"
                  notched={false}
                  sx={{
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none',
                    },
                    px: 1.5,
                  }}
                />
              }
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: '#ffffff',
                    borderRadius: '10px',
                  },
                },
              }}
            >
              {/* User + dashboard chart groups (no special groups) */}
              {allSelectableGroups.map((group) => (
                <MenuItem
                  key={`user-${group.group_id}`}
                  value={String(group.group_id)}
                  sx={{
                    pl: 2,
                    fontWeight: 500,
                  }}
                >
                  {group.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Mode Toggle Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
            {modeOptions.map((mode) => {
              const isActive = Boolean(localMode) && localMode === mode;
              const isCurrentModeUpdating = isUpdating && isActive;
              
              return (
                <Button
                  key={mode}
                  onClick={() => handleModeChange(mode)}
                  disabled={!selectedGroup || loading || updating || isUpdating}
                  sx={{
                    borderRadius: 1,
                    textTransform: 'none',
                    minWidth: 100,
                    height: 45,
                    fontWeight: 500,
                    fontSize: 15,
                    backgroundColor: isActive ? buttonColor : '#fff',
                    color: isActive ? '#fff' : buttonColor,
                    border: isActive ? 'none' : `1px solid ${buttonColor}`,
                    boxShadow: 1,
                    '&:hover': {
                      backgroundColor: isActive ? darken(buttonColor, 0.12) : '#eee',
                    },
                    position: 'relative',
                  }}
                >
                  {isCurrentModeUpdating ? (
                    <CircularProgress 
                      size={20} 
                      sx={{ color: '#fff' }} 
                    />
                  ) : (
                    mode.toUpperCase()
                  )}
                </Button>
              );
            })}
          </Box>
          {selectedGroup && status === "Mixed" && (
            <Box sx={{ textAlign: 'center', mt: 1, color: 'red', fontWeight: 500 }}>
              Occupancy status is mixed for this group.
            </Box>
          )}
          {selectedGroup && !loading && !localMode && String(status).toLowerCase() === 'unknown' && (
            <Box sx={{ textAlign: 'center', mt: 1, color: '#666', fontWeight: 500, fontSize: 13 }}>
              Current occupancy mode unavailable. Select a mode below.
            </Box>
          )}
          
          {/* Success Message */}
          {showSuccessMessage && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Alert 
                severity="success" 
                sx={{ 
                  backgroundColor: '#4caf50',
                  color: '#fff',
                  '& .MuiAlert-icon': {
                    color: '#fff'
                  }
                }}
              >
                Occupancy mode updated successfully!
              </Alert>
            </Box>
          )}
        </DialogContent>
      </Box>
    </Dialog>
  );
};

export default GroupOccupancyModel;