import React, { useState, useEffect } from "react";
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
import { useTheme } from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";
import {
  updateUser,
  clearUpdateError,
  selectUpdateLoading,
} from "../../../redux/slice/settingsslice/user/usersSlice";
import { fetchFloors, selectFloors } from "../../../redux/slice/floor/floorSlice";
import {
  apiToPermissionLabel,
  buildUserPatchBody,
  hasUserUpdateChanges,
  serializeFloorsSelection,
} from "./userUpdatePayload";

const permissionOptions = [
  "Monitoring Only",
  "Monitoring and control",
  "Monitoring, edit and control",
];

const MIXED_ACCESS_SENTINEL = "__mixed_access__";

const outlinedSelectInputSurface = "#fff";

const outlinedSelectLabelSx = {
  zIndex: 1,
  "&.MuiInputLabel-shrink": {
    backgroundColor: outlinedSelectInputSurface,
    px: 0.75,
  },
};

const outlinedSelectFloorsLabelSx = {
  zIndex: 1,
  backgroundColor: outlinedSelectInputSurface,
  px: 0.75,
};

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
  const theme = useTheme();
  const updateLoading = useSelector(selectUpdateLoading);
  const floorList = useSelector(selectFloors);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      dispatch(fetchFloors());
    }
  }, [open, isOperator, dispatch]);

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

  const handleSave = async () => {
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
          "This display name is already used by another active user. Login uses the user’s name—choose a different name."
        );
      } else {
        setSnackbarMessage(msg);
      }
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

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
      PaperProps={{
        sx: {
          backgroundColor: theme.palette.custom.containerBg,
          borderRadius: 2,
          maxHeight: "80vh",
        },
      }}
    >
      <DialogTitle sx={{ color: theme.palette.text.primary, pb: 1 }}>
        <Typography component="span" variant="h6" sx={{ display: "block", fontWeight: 600 }}>
          Edit user
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: theme.palette.text.secondary, fontWeight: 400, mt: 0.75, pr: 1 }}
        >
          Change name, email, optional password, or floor access. Role cannot be changed.
        </Typography>
      </DialogTitle>
      <DialogContent
        dividers
        sx={{
          maxHeight: "calc(80vh - 120px)",
          overflowY: "auto",
          padding: 2,
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography sx={{ mb: 1, fontWeight: 500 }}>Name</Typography>
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ backgroundColor: "#fff", borderRadius: 1 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography sx={{ mb: 1, fontWeight: 500 }}>Email ID</Typography>
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
              sx={{ backgroundColor: "#fff", borderRadius: 1 }}
              error={Boolean(emailError)}
              helperText={emailError}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography sx={{ mb: 1, fontWeight: 500 }}>
              New password (optional)
            </Typography>
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
              sx={{ backgroundColor: "#fff", borderRadius: 1 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography sx={{ mb: 1, fontWeight: 500 }}>Role</Typography>
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              value={user.role || ""}
              disabled
              sx={{ backgroundColor: "#f0f0f0", borderRadius: 1 }}
            />
          </Grid>

          {isOperator && (
            <Grid item xs={12}>
              <Box
                sx={{
                  backgroundColor: theme.palette.custom.containerBg,
                  borderRadius: 2,
                  p: 2,
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography sx={{ fontWeight: 600, mb: 0.25 }}>Floors</Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: theme.palette.text.secondary, mb: 1.5 }}
                    >
                      Select one or more floors
                    </Typography>
                    {!floorList.length ? (
                      <Typography sx={{ color: theme.palette.text.secondary, fontSize: "0.875rem" }}>
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
                          MenuProps={floorSelectMenuProps}
                          inputProps={{ "aria-label": "Select floors" }}
                        >
                          <ListSubheader
                            sx={{
                              lineHeight: 1,
                              py: 1,
                              display: "flex",
                              gap: 0.5,
                              flexWrap: "wrap",
                            }}
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
                              sx={{ textTransform: "none" }}
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
                              sx={{ textTransform: "none" }}
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
                                  sx={{
                                    mr: 1,
                                    py: 0,
                                    color: theme.palette.text.secondary,
                                    "&.Mui-checked": {
                                      color: theme.palette.text.secondary,
                                    },
                                  }}
                                />
                                <ListItemText primary={label} />
                              </MenuItem>
                            );
                          })}
                          <ListSubheader
                            sx={{
                              lineHeight: 1.3,
                              textAlign: "center",
                              fontSize: "0.8rem",
                              fontWeight: 500,
                              color: theme.palette.text.secondary,
                            }}
                          >
                            {selectedFloors.length === 0
                              ? "No floors selected"
                              : `${selectedFloors.length} floor${selectedFloors.length === 1 ? "" : "s"} selected`}
                          </ListSubheader>
                        </Select>
                      </FormControl>
                    )}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography sx={{ fontWeight: 600, mb: 0.25 }}>Access level</Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: theme.palette.text.secondary, mb: 1.5 }}
                    >
                      Select the access level for the selected floors
                    </Typography>
                    <FormControl
                      fullWidth
                      size="small"
                      variant="outlined"
                      sx={{ backgroundColor: outlinedSelectInputSurface, borderRadius: 1, mb: 1.5 }}
                      disabled={!selectedFloors.length}
                    >
                      <InputLabel
                        id="edit-user-shared-access-label"
                        sx={outlinedSelectLabelSx}
                      >
                        Access level
                      </InputLabel>
                      <Select
                        labelId="edit-user-shared-access-label"
                        label="Access level"
                        value={sharedAccessSelectValue}
                        onChange={handleSharedAccessChange}
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
                        alignItems: "flex-start",
                        backgroundColor: "rgba(255, 248, 225, 0.95)",
                        color: theme.palette.text.primary,
                        "& .MuiAlert-message": { width: "100%" },
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
      <DialogActions>
        <Button onClick={handleClose} sx={{ textTransform: "none" }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!canSave}
          sx={{
            backgroundColor: theme.palette.custom.buttonBg,
            color: theme.palette.text.secondary,
            textTransform: "none",
          }}
        >
          {updateLoading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            "Save changes"
          )}
        </Button>
      </DialogActions>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={snackbarSeverity === "error" ? 8000 : 2000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Dialog>
  );
}
