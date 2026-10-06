// src/components/Users/CreateUser.jsx
// Permission Hierarchy:
// - Superadmin: Can create Admin, Operator, and Superadmin users
// - Admin: Can only create Operator users
// - Operator: Cannot create any users
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
  Checkbox,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";
import {
  createUser,
  resetCreateState,
  selectCreateLoading,
  selectCreateError,
  selectCreateSuccess,
} from '../../../redux/slice/settingsslice/createUserSlice'
import { fetchFloors, selectFloors } from "../../../redux/slice/floor/floorSlice";
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
const permissionOptions = [
  "Monitoring Only",
  "Monitoring and control",
  "Monitoring, edit and control",
];

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

// Filter role options based on current user's role
const getAvailableRoles = (currentUserRole) => {
  switch (currentUserRole) {
    case 'Superadmin':
      return ['Admin', 'Operator']; // Superadmin can create Admin and Operator (not Superadmin)
    case 'Admin':
      return ['Operator']; // Admin can only create Operators
    case 'Operator':
      return []; // Operators cannot create users
    default:
      return []; // Default fallback
  }
};
export default function CreateUser({ open, onClose }) {
  const dispatch = useDispatch();
  const floorList = useSelector(selectFloors)
  useEffect(() => {
    dispatch(fetchFloors())
  }, [dispatch])
  const theme = useTheme();
  const currentUserRole = localStorage.getItem('role');
  
  // Get available roles based on current user's permissions
  const availableRoles = getAvailableRoles(currentUserRole);
  
  // Prevent dialog from opening if user doesn't have permission to create users
  useEffect(() => {
    if (open && availableRoles.length === 0) {
      onClose();
      return;
    }
  }, [open, availableRoles, onClose]);
  // Redux slice state
  const createLoading = useSelector(selectCreateLoading);
  const createError = useSelector(selectCreateError);
  const createSuccess = useSelector(selectCreateSuccess);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [selectedFloorIds, setSelectedFloorIds] = useState([]);
  const [sharedAccessLevel, setSharedAccessLevel] = useState(permissionOptions[0]);
  const [emailError, setEmailError] = useState("");
  
  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  
  // Snackbar handlers
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };
  
  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };
  
  useEffect(() => {
    if (open) {
      setName("");
      setEmail("");
      setPassword("");
      // For Admin, force role to Operator; Superadmin can choose Admin or Operator; Operator won't see dialog
      if (currentUserRole === 'Admin') {
        setRole('Operator');
      } else if (currentUserRole === 'Superadmin') {
        setRole('Admin'); // Default to Admin for Superadmin
      } else {
        setRole(""); // Fallback
      }
      setSelectedFloorIds([]);
      setSharedAccessLevel(permissionOptions[0]);
      setEmailError("");            // clear email error as well
      setSnackbarOpen(false);       // clear any existing snackbar
      dispatch(resetCreateState());
    }
  }, [open, dispatch]);
  useEffect(() => {
    if (createSuccess) {
      showSnackbar('User created successfully!', 'success');
      const timer = setTimeout(() => {
        onClose();
      }, 2000); // Close after 2 seconds
      return () => clearTimeout(timer);
    }
  }, [createSuccess, onClose]);
  
  useEffect(() => {
    if (createError) {
      const lower = createError.toLowerCase();
      if (lower.includes("user already exists")) {
        showSnackbar(
          "A user with this email already exists. Use a different email address.",
          "error"
        );
      } else if (lower.includes("username already exists")) {
        showSnackbar(
          "This display name is already used by another active user. Login uses the user’s name (not email)—choose a different name.",
          "error"
        );
      } else if (lower.includes("not permitted to create")) {
        showSnackbar("You do not have permission to create users with this role.", "error");
      } else {
        showSnackbar(`Failed to create user: ${createError}`, "error");
      }
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
  const permissionMap = {
    "Monitoring Only": "monitor",
    "Monitoring and control": "monitor_control",
    "Monitoring, edit and control": "monitor_control_edit",
  };
  const handleSave = () => {
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
  };

  const floorSelectMenuProps = {
    autoFocus: false,
    PaperProps: { style: { maxHeight: 320 } },
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        onClose();
        setSnackbarOpen(false);
        dispatch(resetCreateState());
      }}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          backgroundColor: theme.palette.custom.containerBg,
          borderRadius: 2,
          maxHeight: '80vh',
        },
      }}
    >
      <DialogTitle sx={{ color: theme.palette.text.primary, pb: 1 }}>
        <Typography component="span" variant="h6" sx={{ display: "block", fontWeight: 600 }}>
          Create new user
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: theme.palette.text.secondary, fontWeight: 400, mt: 0.75, pr: 1 }}
        >
          Add login details and a role. For operators, select floors, then one access level for all of them.
        </Typography>
      </DialogTitle>
      <DialogContent 
        dividers 
        sx={{ 
          maxHeight: 'calc(80vh - 120px)',
          overflowY: 'auto',
          padding: 2
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
                setEmailError(validateEmail(val)); // run validation
              }}
              onBlur={(e) => {
                setEmailError(validateEmail(e.target.value));
              }}
              sx={{ backgroundColor: "#fff", borderRadius: 1 }}
              error={Boolean(emailError)}
              helperText={emailError}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography sx={{ mb: 1, fontWeight: 500 }}>Password (required)</Typography>
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ backgroundColor: "#fff", borderRadius: 1 }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography sx={{ mb: 1, fontWeight: 500 }}>Role</Typography>
            <FormControl fullWidth size="small" sx={{ backgroundColor: "#fff", borderRadius: 1 }}>

              <Select
                value={role}
                onChange={(e) => setRole(e.target.value)}
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
                              disabled={!selectedFloorIds.length}
                              sx={{ textTransform: "none" }}
                            >
                              Clear
                            </Button>
                          </ListSubheader>
                          {floorList.map((f) => (
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
                              <ListItemText primary={f.floor_name} />
                            </MenuItem>
                          ))}
                          <ListSubheader
                            sx={{
                              lineHeight: 1.3,
                              textAlign: "center",
                              fontSize: "0.8rem",
                              fontWeight: 500,
                              color: theme.palette.text.secondary,
                            }}
                          >
                            {selectedFloorIds.length === 0
                              ? "No floors selected"
                              : `${selectedFloorIds.length} floor${selectedFloorIds.length === 1 ? "" : "s"} selected`}
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
                      disabled={!selectedFloorIds.length}
                    >
                      <InputLabel
                        id="create-user-shared-access-label"
                        sx={outlinedSelectLabelSx}
                      >
                        Access level
                      </InputLabel>
                      <Select
                        labelId="create-user-shared-access-label"
                        label="Access level"
                        value={sharedAccessLevel}
                        onChange={(e) => setSharedAccessLevel(e.target.value)}
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
        <Button
          onClick={() => {
            onClose();
            setSnackbarOpen(false);
            dispatch(resetCreateState());
          }}
          sx={{ textTransform: "none" }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!canSave || createLoading}
          sx={{
            backgroundColor: theme.palette.custom.buttonBg,
            color: theme.palette.text.secondary,
            textTransform: "none",
          }}
        >
          {createLoading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            "Create user"
          )}
        </Button>
      </DialogActions>
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Dialog>
  );
}
