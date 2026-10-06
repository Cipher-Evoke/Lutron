import React, { useEffect, useState } from 'react';
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
  ListSubheader,
  CircularProgress,
  Alert,
  Snackbar
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
  selectAreaGroupsLoading
} from '../../redux/slice/settingsslice/heatmap/groupOccupancySlice';
import { selectApplicationTheme } from '../../redux/slice/theme/themeSlice';
import { HEATMAP_SETTINGS_DIALOG_PAPER_BG } from './AreaSettingsDialog';
import { getThemeButtonColor } from '../../utils/themePageBackground';
import { normalizeOccupancyModeString } from '../../redux/slice/settingsslice/heatmap/occupancyModeUtils';

function toTitleCase(str) {
  return str.replace(/\w\S*/g, (txt) =>
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

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
  const areaGroupsLoading = useSelector(selectAreaGroupsLoading);
  const appTheme = useSelector(selectApplicationTheme);
  const buttonColor = getThemeButtonColor(appTheme?.application_theme?.button, appTheme?.application_theme?.background);

  const [selectedGroup, setSelectedGroup] = useState("");
  const [localMode, setLocalMode] = useState('');
  const [pendingMode, setPendingMode] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

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
    const userGroups = areaGroups?.user_area_groups || [];
    if (userGroups.length > 0 && !selectedGroup) {
      setSelectedGroup(String(userGroups[0].group_id));
    }
  }, [areaGroups, selectedGroup]);

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

  const handleGroupChange = (e) => {
    setSelectedGroup(e.target.value);
    setLocalMode('');
    setPendingMode(false);
    setShowSuccessMessage(false);
  };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      BackdropProps={{
        sx: {
          // Match Add Action dialog overlay
          backgroundColor: 'rgba(0, 0, 0, 0.25)',
        },
      }}
      PaperProps={{
        sx: {
          backgroundColor: 'transparent',
          boxShadow: 'none',
          position: 'relative',
        },
      }}
    >
      {/* Previous dark premium panel - kept for quick rollback
      background: linear-gradient(160deg, #0a1428 0%, #152238 45%, #1a2d4a 100%)
      */}
      <Box
        sx={{
          px: 3.5,
          py: 2.5,
          minWidth: 400,
          maxWidth: '90vw',
          position: 'relative',
          background: HEATMAP_SETTINGS_DIALOG_PAPER_BG,
          borderRadius: '18px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12)',
          color: buttonColor,
        }}
      >
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: buttonColor,
            '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.06)' },
          }}
        >
          <CloseIcon />
        </IconButton>

        <DialogTitle
          sx={{
            fontWeight: 600,
            fontSize: 18,
            px: 0,
            pt: 0,
            pb: 1,
            color: buttonColor,
          }}
        >
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
              {(areaGroups?.user_area_groups || []).map((group) => (
                <MenuItem key={group.group_id} value={String(group.group_id)}>
                  {group.name.toUpperCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl> */}
          <FormControl fullWidth size="small" sx={{ mt: 2, mb: 3 }}>
            <InputLabel id="group-label" sx={{ display: 'none' }} />
            <Select
              labelId="group-label"
              value={selectedGroup}
              onChange={handleGroupChange}
              displayEmpty
              sx={{
                color: '#111',
                '& .MuiSelect-icon': { color: '#111' },
              }}
              input={
                <OutlinedInput
                  placeholder="Select Areagroup"
                  notched={false}
                  sx={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    color: buttonColor,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#cccccc',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: buttonColor,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: buttonColor,
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
              {/* User Groups - No label, no special groups for any user */}
              {(areaGroups?.user_area_groups || []).map((group) => (
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

          {/* Mode buttons — same pattern as Add Action > Occupancy in Action.jsx */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
            {modeOptions.map((mode) => {
              const isActive = Boolean(localMode) && localMode === mode;
              const isCurrentModeUpdating = isUpdating && isActive;
              const accent = buttonColor || "var(--app-button, #3d4a5c)";

              return (
                <Button
                  key={mode}
                  className={
                    isActive
                      ? "asd-occupancy-mode-btn asd-occupancy-mode-btn--active"
                      : "asd-occupancy-mode-btn"
                  }
                  onClick={() => handleModeChange(mode)}
                  disabled={!selectedGroup || loading || updating || isUpdating}
                  disableElevation
                  variant="contained"
                  sx={{
                    borderRadius: "999px",
                    textTransform: "uppercase",
                    minWidth: 100,
                    height: 45,
                    fontWeight: 700,
                    fontSize: 16,
                    boxShadow: "none !important",
                    backgroundImage: "none !important",
                    filter: "none !important",
                    opacity: "1 !important",
                    ...(isActive
                      ? {
                          background: `${accent} !important`,
                          backgroundColor: `${accent} !important`,
                          color: "#ffffff !important",
                          WebkitTextFillColor: "#ffffff",
                          border: `2px solid ${accent} !important`,
                          outline: `2px solid #ffffff`,
                          outlineOffset: 1,
                          "&:hover": {
                            background: `${accent} !important`,
                            backgroundColor: `${accent} !important`,
                            backgroundImage: "none !important",
                            color: "#ffffff !important",
                            opacity: "1 !important",
                            filter: "none !important",
                          },
                        }
                      : {
                          background: "#ffffff !important",
                          backgroundColor: "#ffffff !important",
                          color: "#111111 !important",
                          WebkitTextFillColor: "#111111",
                          border: `2px solid ${accent} !important`,
                          outline: "none",
                          "&:hover": {
                            background: "#f3f3f3 !important",
                            backgroundColor: "#f3f3f3 !important",
                            backgroundImage: "none !important",
                            color: "#111111 !important",
                            opacity: "1 !important",
                            filter: "none !important",
                          },
                        }),
                    "&.Mui-disabled": {
                      opacity: "0.55 !important",
                    },
                  }}
                >
                  {isCurrentModeUpdating ? (
                    <CircularProgress size={20} sx={{ color: "#ffffff" }} />
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