// Permission Hierarchy:
// - Superadmin: Can create Admin and Operator users
// - Admin: Can only create Operator users
// - Operator: Cannot create any users
import React, { useState, useEffect, useMemo } from "react";
import { createSingleFlight } from "../../../../../shared/utils/createSingleFlight";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  InputAdornment,
  IconButton,
  Select,
  MenuItem,
  ListItemText,
  ListSubheader,
  Box,
  Checkbox,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useDispatch, useSelector } from "react-redux";
import {
  createUser,
  resetCreateState,
  selectCreateLoading,
  selectCreateError,
  selectCreateSuccess,
} from '../../../redux/slice/settingsslice/createUserSlice';
import { fetchFloors, selectFloors } from "../../../redux/slice/floor/floorSlice";
import { dispatchFetchFloorsOnce } from "../../../../../shared/utils/bootstrapFetchGuards";
import { selectApplicationTheme } from '../../../redux/slice/theme/themeSlice';
import { permissionMap, permissionOptions } from "../../../../../shared/settings/users/userUpdatePayload";
import {
  outlinedSelectFloorsLabelSx,
  outlinedSelectInputSurface,
  outlinedSelectLabelSx,
  premiumSelectMenuProps,
  usersFormFieldSx,
} from './userSelectMenuProps';
import { getThemeButtonColor } from '../../../utils/themePageBackground';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(value) {
  if (!value.trim()) {
    return "Email is required";
  }
  if (!emailRegex.test(value.trim())) {
    return "Enter a valid email";
  }
  return "";
}

const fieldSx = usersFormFieldSx;

const getAvailableRoles = (currentUserRole) => {
  switch (currentUserRole) {
    case 'Superadmin':
      return ['Admin', 'Operator'];
    case 'Admin':
      return ['Operator'];
    case 'Operator':
      return [];
    default:
      return [];
  }
};

export default function CreateUser({ open, onClose }) {
  const dispatch = useDispatch();
  const floorList = useSelector(selectFloors);
  const appTheme = useSelector(selectApplicationTheme);
  const buttonColor = getThemeButtonColor(appTheme?.application_theme?.button, appTheme?.application_theme?.background);
  const currentUserRole = localStorage.getItem('role');
  const availableRoles = getAvailableRoles(currentUserRole);

  const createLoading = useSelector(selectCreateLoading);
  const createError = useSelector(selectCreateError);
  const createSuccess = useSelector(selectCreateSuccess);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("");
  const [selectedFloorIds, setSelectedFloorIds] = useState([]);
  const [sharedAccessLevel, setSharedAccessLevel] = useState(permissionOptions[0]);
  const [emailError, setEmailError] = useState("");
  const [nameError, setNameError] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  useEffect(() => {
    dispatchFetchFloorsOnce(dispatch, fetchFloors, Boolean(floorList?.length));
  }, [dispatch, floorList?.length]);

  useEffect(() => {
    if (open && availableRoles.length === 0) {
      onClose();
    }
  }, [open, availableRoles, onClose]);

  useEffect(() => {
    if (open) {
      setName("");
      setEmail("");
      setPassword("");
      setShowPassword(false);
      if (currentUserRole === 'Admin') {
        setRole('Operator');
      } else if (currentUserRole === 'Superadmin') {
        setRole('Admin');
      } else {
        setRole("");
      }
      setSelectedFloorIds([]);
      setSharedAccessLevel(permissionOptions[0]);
      setEmailError("");
      setNameError("");
      setSnackbarOpen(false);
      dispatch(resetCreateState());
    }
  }, [open, dispatch, currentUserRole]);

  useEffect(() => {
    if (createSuccess) {
      setSnackbarMessage('User created successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [createSuccess, onClose]);

  useEffect(() => {
    if (createError) {
      const lower = createError.toLowerCase();
      let msg = `Failed to create user: ${createError}`;
      if (lower.includes("user already exists")) {
        msg = "A user with this email already exists. Use a different email address.";
      } else if (lower.includes("username already exists")) {
        msg =
          "This display name is already used by another active user. Login uses the user's name (not email)—choose a different name.";
      } else if (lower.includes("not permitted to create")) {
        msg = "You do not have permission to create users with this role.";
      }
      setSnackbarMessage(msg);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  }, [createError]);

  const selectAllFloors = () => {
    setSelectedFloorIds(floorList.map((f) => f.id));
  };
  const clearFloorSelection = () => setSelectedFloorIds([]);

  const canSave = Boolean(
    name.trim() &&
    email.trim() &&
    password.trim() &&
    role &&
    !emailError
  );

  const runSaveOnce = useMemo(() => createSingleFlight(), []);
  const handleSave = () =>
    runSaveOnce(async () => {
    if (!name.trim()) {
      setNameError("Name is required");
      setSnackbarMessage("Name is required");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }
    setNameError("");
    const payload = {
      name: name.trim(),
      email: email.trim(),
      password: password.trim(),
      role: role,
      floor:
        role === "Operator"
          ? selectedFloorIds.map((id) => ({
            floor_id: id,
            floor_permission: permissionMap[sharedAccessLevel] || "monitor",
          }))
          : [],
    };
    dispatch(createUser(payload));
  });

  const handleClose = () => {
    onClose();
    setSnackbarOpen(false);
    dispatch(resetCreateState());
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      BackdropProps={{
        sx: { backgroundColor: 'transparent' },
      }}
      PaperProps={{
        sx: {
          backgroundColor: 'transparent',
          boxShadow: 'none',
          maxHeight: '80vh',
        },
      }}
    >
      <Box
        className="users-modal-shell"
        sx={{
          background: 'var(--users-modal-bg, #d6dde8)',
          borderRadius: '16px',
          boxShadow: '0 10px 28px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--users-border, rgba(74, 67, 52, 0.28))',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <DialogTitle sx={{ color: 'var(--settings-panel-text, #2c2820)', pb: 1 }}>
          <Typography component="span" variant="h6" sx={{ display: "block", fontWeight: 600 }}>
            Create new user
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: 'var(--settings-panel-muted-text, #4A586C)', fontWeight: 400, mt: 0.75, pr: 1 }}
          >
            Add login details and a role. For operators, select floors, then one access level for all of them.
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', color: 'var(--settings-panel-muted-text, #4A586C)', mt: 0.5 }}>
            Sign in uses Name and Password (not email).
          </Typography>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            maxHeight: 'calc(80vh - 120px)',
            overflowY: 'auto',
            padding: 2,
            borderColor: 'var(--users-border, #C5CDD8)',
          }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ mb: 1, fontWeight: 500, color: 'var(--settings-panel-text, #1c2330)' }}>Name</Typography>
              <TextField
                fullWidth
                size="small"
                variant="outlined"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError("");
                }}
                onBlur={() => {
                  if (!name.trim()) setNameError("Name is required");
                }}
                sx={fieldSx}
                error={Boolean(nameError)}
                helperText={nameError}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ mb: 1, fontWeight: 500, color: 'var(--settings-panel-text, #1c2330)' }}>Email ID</Typography>
              <TextField
                fullWidth
                size="small"
                variant="outlined"
                value={email}
                onChange={(e) => {
                  const val = e.target.value;
                  setEmail(val);
                  setEmailError(validateEmail(val));
                }}
                onBlur={(e) => setEmailError(validateEmail(e.target.value))}
                sx={fieldSx}
                error={Boolean(emailError)}
                helperText={emailError}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ mb: 1, fontWeight: 500, color: 'var(--settings-panel-text, #1c2330)' }}>Password (required)</Typography>
              <TextField
                fullWidth
                size="small"
                variant="outlined"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={fieldSx}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword((prev) => !prev)}
                        onMouseDown={(e) => e.preventDefault()}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ mb: 1, fontWeight: 500, color: 'var(--settings-panel-text, #1c2330)' }}>Role</Typography>
              <FormControl fullWidth size="small" sx={fieldSx}>
                <Select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  MenuProps={premiumSelectMenuProps}
                >
                  {availableRoles.map((r) => (
                    <MenuItem key={r} value={r}>
                      {r}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {role === "Operator" && (
              <Grid item xs={12}>
                <Box
                  sx={{
                    backgroundColor: 'var(--users-modal-inner-bg, #ffffff)',
                    borderRadius: 2,
                    p: 2,
                    border: '1px solid var(--users-border, #C5CDD8)',
                  }}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography sx={{ fontWeight: 600, mb: 0.25, color: 'var(--settings-panel-text, #1c2330)' }}>Floors</Typography>
                      <Typography variant="body2" sx={{ color: 'var(--settings-panel-muted-text, #4A586C)', mb: 1.5 }}>
                        Select one or more floors
                      </Typography>
                      {!floorList.length ? (
                        <Typography sx={{ color: 'var(--settings-panel-muted-text, #4A586C)', fontSize: '0.875rem' }}>
                          Loading floors or none available.
                        </Typography>
                      ) : (
                        <FormControl
                          fullWidth
                          size="small"
                          variant="outlined"
                          sx={{ backgroundColor: outlinedSelectInputSurface, borderRadius: 1 }}
                        >
                          <InputLabel
                            id="create-user-floors-label"
                            shrink
                            sx={outlinedSelectFloorsLabelSx}
                          >
                            Select floors
                          </InputLabel>
                          <Select
                            labelId="create-user-floors-label"
                            label="Select floors"
                            multiple
                            displayEmpty
                            value={selectedFloorIds}
                            onChange={(e) => {
                              const v = e.target.value;
                              setSelectedFloorIds(
                                typeof v === "string" ? v.split(",").filter(Boolean) : [...v]
                              );
                            }}
                            renderValue={(selected) =>
                              selected.length === 0
                                ? "Select floors"
                                : `${selected.length} floor${selected.length === 1 ? "" : "s"} selected`
                            }
                            MenuProps={premiumSelectMenuProps}
                          >
                            <ListSubheader
                              sx={{ lineHeight: 1, py: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                            >
                              <Button
                                size="small"
                                variant="text"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  selectAllFloors();
                                }}
                                disabled={!floorList.length}
                                sx={{ textTransform: 'none', color: buttonColor }}
                              >
                                Select all
                              </Button>
                              <Button
                                size="small"
                                variant="text"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearFloorSelection();
                                }}
                                disabled={!selectedFloorIds.length}
                                sx={{ textTransform: 'none', color: buttonColor }}
                              >
                                Clear
                              </Button>
                            </ListSubheader>
                            {floorList.map((f) => (
                              <MenuItem key={f.id} value={f.id} dense>
                                <Checkbox
                                  checked={selectedFloorIds.includes(f.id)}
                                  size="small"
                                  sx={{ mr: 1, py: 0 }}
                                />
                                <ListItemText primary={f.floor_name} />
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography sx={{ fontWeight: 600, mb: 0.25, color: 'var(--settings-panel-text, #1c2330)' }}>Access level</Typography>
                      <Typography variant="body2" sx={{ color: 'var(--settings-panel-muted-text, #4A586C)', mb: 1.5 }}>
                        Select the access level for the selected floors
                      </Typography>
                      <FormControl
                        fullWidth
                        size="small"
                        variant="outlined"
                        sx={{ backgroundColor: outlinedSelectInputSurface, borderRadius: 1, mb: 1.5 }}
                        disabled={!selectedFloorIds.length}
                      >
                        <InputLabel id="create-user-shared-access-label" sx={outlinedSelectLabelSx}>
                          Access level
                        </InputLabel>
                        <Select
                          labelId="create-user-shared-access-label"
                          label="Access level"
                          value={sharedAccessLevel}
                          onChange={(e) => setSharedAccessLevel(e.target.value)}
                          MenuProps={premiumSelectMenuProps}
                        >
                          {permissionOptions.map((opt) => (
                            <MenuItem key={opt} value={opt}>
                              {opt}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Alert
                        severity="info"
                        sx={{
                          alignItems: 'flex-start',
                          backgroundColor: 'var(--users-modal-info-bg, #D6DDE8)',
                          color: 'var(--settings-panel-text, #1c2330)',
                          border: '1px solid var(--users-border, #C5CDD8)',
                          '& .MuiAlert-message': { width: '100%' },
                        }}
                      >
                        The selected access level will be applied to all selected floors.
                      </Alert>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
          <Button
            onClick={handleClose}
            variant="outlined"
            sx={{
              textTransform: 'none',
              borderColor: buttonColor,
              color: buttonColor,
              backgroundColor: 'var(--users-input-bg, #fff)',
              borderRadius: '8px',
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            className="users-create-submit-btn"
            onClick={handleSave}
            disabled={!canSave || createLoading}
            sx={{
              backgroundColor: buttonColor,
              color: "#fff",
              textTransform: "none",
              borderRadius: "8px",
              boxShadow: "none",
              "&:hover": {
                backgroundColor: buttonColor,
                opacity: 0.92,
                boxShadow: "none",
              },
              "&.Mui-disabled": {
                background: "#A6A49A !important",
                backgroundColor: "#A6A49A !important",
                backgroundImage: "none !important",
                color: "#fff !important",
                opacity: "1 !important",
                boxShadow: "none !important",
              },
            }}
          >
            {createLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Create user"
            )}
          </Button>
        </DialogActions>
      </Box>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Dialog>
  );
}
