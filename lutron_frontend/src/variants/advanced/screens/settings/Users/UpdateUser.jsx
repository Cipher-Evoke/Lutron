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
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Checkbox,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useDispatch, useSelector } from "react-redux";
import {
  updateUser,
  clearUpdateError,
  selectUpdateLoading,
} from "../../../redux/slice/settingsslice/user/usersSlice";
import { fetchFloors, selectFloors } from "../../../redux/slice/floor/floorSlice";
import { dispatchFetchFloorsOnce } from "../../../../../shared/utils/bootstrapFetchGuards";
import { selectApplicationTheme } from '../../../redux/slice/theme/themeSlice';
import {
  apiToPermissionLabel,
  buildUserPatchBody,
  hasUserUpdateChanges,
  serializeFloorsSelection,
  permissionOptions,
} from "../../../../../shared/settings/users/userUpdatePayload";
import {
  outlinedSelectFloorsLabelSx,
  outlinedSelectInputSurface,
  outlinedSelectLabelSx,
  premiumSelectMenuProps,
  usersFormFieldSx,
  usersReadonlyFieldSx,
} from './userSelectMenuProps';
import { getThemeButtonColor } from '../../../utils/themePageBackground';

const MIXED_ACCESS_SENTINEL = "__mixed_access__";

const fieldSx = usersFormFieldSx;

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

export default function UpdateUser({ open, user, onClose }) {
  const dispatch = useDispatch();
  const appTheme = useSelector(selectApplicationTheme);
  const buttonColor = getThemeButtonColor(appTheme?.application_theme?.button, appTheme?.application_theme?.background);
  const updateLoading = useSelector(selectUpdateLoading);
  const floorList = useSelector(selectFloors);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedFloors, setSelectedFloors] = useState([]);
  const [initialName, setInitialName] = useState("");
  const [initialEmail, setInitialEmail] = useState("");
  const [initialFloorsJson, setInitialFloorsJson] = useState("[]");
  const [emailError, setEmailError] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const isOperator = user?.role === "Operator";

  useEffect(() => {
    if (open && isOperator) {
      dispatchFetchFloorsOnce(dispatch, fetchFloors, Boolean(floorList?.length));
    }
  }, [open, isOperator, dispatch, floorList?.length]);

  useEffect(() => {
    if (open && user) {
      const n = (user.name || "").trim();
      setName(n);
      setInitialName(n);
      const em = (user.email || "").trim();
      setEmail(em);
      setInitialEmail(em);
      setEmailError("");
      setPassword("");
      setShowPassword(false);
      dispatch(clearUpdateError());
      setSnackbarOpen(false);
      const perms = user.user_permissions || [];
      const floors = perms.map((p) => ({
        id: p.floor_id,
        permission: apiToPermissionLabel(p.permission_type),
        floorName: p.floor_name || `Floor ${p.floor_id}`,
      }));
      setSelectedFloors(floors);
      setInitialFloorsJson(serializeFloorsSelection(floors));
    }
  }, [open, user, dispatch]);

  const permissionIsUniform =
    selectedFloors.length === 0 ||
    selectedFloors.every((f) => f.permission === selectedFloors[0].permission);

  const sharedAccessSelectValue =
    selectedFloors.length === 0
      ? permissionOptions[0]
      : permissionIsUniform
        ? selectedFloors[0].permission
        : MIXED_ACCESS_SENTINEL;

  const canSave =
    Boolean(name.trim() && email.trim() && !emailError) &&
    hasUserUpdateChanges({
      name,
      initialName,
      email,
      initialEmail,
      password,
      isOperator,
      selectedFloors,
      initialFloorsJson,
    }) &&
    !updateLoading;

  const handleSharedAccessChange = (e) => {
    const v = e.target.value;
    if (v === MIXED_ACCESS_SENTINEL) return;
    setSelectedFloors((prev) => prev.map((f) => ({ ...f, permission: v })));
  };

  const applySelectedFloorIds = (nextIds) => {
    setSelectedFloors((prev) => {
      const byId = new Map(prev.map((f) => [f.id, f]));
      const uniformNow =
        prev.length === 0 || prev.every((f) => f.permission === prev[0].permission);
      const defaultPerm =
        uniformNow && prev.length ? prev[0].permission : permissionOptions[0];
      return nextIds.map((id) => {
        const existing = byId.get(id);
        if (existing) return existing;
        const floorMeta = floorList.find((fl) => fl.id === id);
        return {
          id,
          permission: defaultPerm,
          floorName: floorMeta?.floor_name || `Floor ${id}`,
        };
      });
    });
  };

  const selectAllFloors = () => {
    const level =
      selectedFloors.length > 0 && permissionIsUniform
        ? selectedFloors[0].permission
        : permissionOptions[0];
    setSelectedFloors(
      floorList.map((f) => ({
        id: f.id,
        permission: level,
        floorName: f.floor_name,
      }))
    );
  };

  const clearFloorSelection = () => setSelectedFloors([]);

  const floorSelectMenuProps = {
    autoFocus: false,
    PaperProps: { style: { maxHeight: 320 } },
  };

  const selectedFloorIds = selectedFloors.map((f) => f.id);

  const runSaveOnce = useMemo(() => createSingleFlight(), []);
  const handleSave = () =>
    runSaveOnce(async () => {
    if (!user?.id || !canSave) return;
    const body = buildUserPatchBody({
      name,
      initialName,
      email,
      initialEmail,
      password,
      isOperator,
      selectedFloors,
      initialFloorsJson,
    });
    if (Object.keys(body).length === 0) return;
    try {
      await dispatch(updateUser({ userId: user.id, body })).unwrap();
      setSnackbarMessage("User updated successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      const msg = String(err || "Update failed");
      const lower = msg.toLowerCase();
      if (lower.includes("user already exists")) {
        setSnackbarMessage(
          "Another active user already uses this email. Choose a different address."
        );
      } else if (lower.includes("username already exists")) {
        setSnackbarMessage(
          "This display name is already used by another active user. Login uses the user's name—choose a different name."
        );
      } else {
        setSnackbarMessage(msg);
      }
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  });

  const handleClose = () => {
    setSnackbarOpen(false);
    dispatch(clearUpdateError());
    onClose();
  };

  if (!user) return null;

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
            Edit user
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--settings-panel-muted-text, #4A586C)', fontWeight: 400, mt: 0.75, pr: 1 }}>
            Change name, email, optional password, or floor access. Role cannot be changed.
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
                onChange={(e) => setName(e.target.value)}
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ mb: 1, fontWeight: 500, color: '#1c2330' }}>Email ID</Typography>
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
              <Typography sx={{ mb: 1, fontWeight: 500, color: '#1c2330' }}>
                New password (optional)
              </Typography>
              <TextField
                fullWidth
                size="small"
                variant="outlined"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
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
              <Typography sx={{ mb: 1, fontWeight: 500, color: '#1c2330' }}>Role</Typography>
              <TextField
                fullWidth
                size="small"
                variant="outlined"
                value={user.role || ""}
                disabled
                sx={usersReadonlyFieldSx}
              />
            </Grid>

            {isOperator && (
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
                      <Typography sx={{ fontWeight: 600, mb: 0.25, color: '#1c2330' }}>Floors</Typography>
                      <Typography variant="body2" sx={{ color: 'var(--settings-panel-muted-text, #4A586C)', mb: 1.5 }}>
                        Select one or more floors
                      </Typography>
                      {!floorList.length ? (
                        <Typography sx={{ color: 'var(--settings-panel-muted-text, #4A586C)', fontSize: '0.875rem' }}>
                          Loading floors or none available. Saved assignments appear once the list loads.
                        </Typography>
                      ) : (
                        <FormControl
                          fullWidth
                          size="small"
                          variant="outlined"
                          sx={{ backgroundColor: outlinedSelectInputSurface, borderRadius: 1 }}
                        >
                          <InputLabel
                            id="edit-user-floors-label"
                            shrink
                            sx={outlinedSelectFloorsLabelSx}
                          >
                            Select floors
                          </InputLabel>
                          <Select
                            labelId="edit-user-floors-label"
                            label="Select floors"
                            multiple
                            displayEmpty
                            value={selectedFloorIds}
                            onChange={(e) => {
                              const v = e.target.value;
                              const next =
                                typeof v === "string" ? v.split(",").filter(Boolean) : [...v];
                              applySelectedFloorIds(next);
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
                                disabled={!selectedFloors.length}
                                sx={{ textTransform: 'none', color: buttonColor }}
                              >
                                Clear
                              </Button>
                            </ListSubheader>
                            {floorList.map((f) => {
                              const permObj = selectedFloors.find((sf) => sf.id === f.id);
                              const label = f.floor_name || permObj?.floorName || `Floor ${f.id}`;
                              return (
                                <MenuItem key={f.id} value={f.id} dense>
                                  <Checkbox
                                    checked={selectedFloorIds.includes(f.id)}
                                    size="small"
                                    sx={{ mr: 1, py: 0 }}
                                  />
                                  <ListItemText primary={label} />
                                </MenuItem>
                              );
                            })}
                          </Select>
                        </FormControl>
                      )}
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography sx={{ fontWeight: 600, mb: 0.25, color: '#1c2330' }}>Access level</Typography>
                      <Typography variant="body2" sx={{ color: 'var(--settings-panel-muted-text, #4A586C)', mb: 1.5 }}>
                        Select the access level for the selected floors
                      </Typography>
                      <FormControl
                        fullWidth
                        size="small"
                        variant="outlined"
                        sx={{ backgroundColor: outlinedSelectInputSurface, borderRadius: 1, mb: 1.5 }}
                        disabled={!selectedFloors.length}
                      >
                        <InputLabel id="edit-user-shared-access-label" sx={outlinedSelectLabelSx}>
                          Access level
                        </InputLabel>
                        <Select
                          labelId="edit-user-shared-access-label"
                          label="Access level"
                          value={sharedAccessSelectValue}
                          onChange={handleSharedAccessChange}
                          MenuProps={premiumSelectMenuProps}
                        >
                          <MenuItem value={MIXED_ACCESS_SENTINEL} disabled>
                            <em>Various levels — choose one to apply to all</em>
                          </MenuItem>
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
            onClick={handleSave}
            disabled={!canSave}
            sx={{
              backgroundColor: 'var(--app-button, #232323)',
              color: '#fff',
              textTransform: 'none',
              borderRadius: '8px',
              boxShadow: 'none',
              '&:hover': { backgroundColor: 'var(--app-button, #232323)', opacity: 0.92 },
              '&.Mui-disabled': {
                background: '#A6A49A !important',
                backgroundColor: '#A6A49A !important',
                backgroundImage: 'none !important',
                color: '#fff !important',
                opacity: '1 !important',
              },
            }}
          >
            {updateLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              'Save changes'
            )}
          </Button>
        </DialogActions>
      </Box>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={snackbarSeverity === "error" ? 8000 : 2000}
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
