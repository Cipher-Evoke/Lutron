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
  selectFloorsLoading,
  selectFloorsError,
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
const roleOptions = ["Superadmin", "Admin", "Operator"];

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
  const [selectedFloors, setSelectedFloors] = useState([]);
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
      setSelectedFloors([]);
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
      // Check if it's a user already exists error
      if (createError.toLowerCase().includes('user already exists')) {
        showSnackbar('User with this email already exists. Please use a different email address.', 'error');
      } else if (createError.toLowerCase().includes('not permitted to create')) {
        showSnackbar('You do not have permission to create users with this role.', 'error');
      } else {
        showSnackbar(`Failed to create user: ${createError}`, 'error');
      }
    }
  }, [createError]);
  const toggleFloor = (floorId) => {
    setSelectedFloors((prev) => {
      const exists = prev.find((f) => f.id === floorId);
      if (exists) {
        return prev.filter((f) => f.id !== floorId);
      } else {
        return [...prev, { id: floorId, permission: permissionOptions[0] }];
      }
    });
  };
  const changePerm = (floorId, perm) => {
    setSelectedFloors((prev) =>
      prev.map((f) => (f.id === floorId ? { ...f, permission: perm } : f))
    );
  };
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
          ? selectedFloors.map((f) => ({
            floor_id: f.id,
            floor_permission: permissionMap[f.permission] || "monitor",
          }))
          : [],
    };
    dispatch(createUser(payload));
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
      maxWidth="sm"
      PaperProps={{
        sx: {
          backgroundColor: theme.palette.custom.containerBg,
          borderRadius: 2,
          maxHeight: '80vh',
        },
      }}
    >
      <DialogTitle sx={{ color: theme.palette.text.primary }}>
        Create New User
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
            <Typography sx={{ mb: 1, fontWeight: 500 }}>Password</Typography>
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
              {/* <Typography sx={{ mb: 1, fontWeight: 500 }}>Floors</Typography> */}
              <Box
                sx={{
                  backgroundColor: theme.palette.custom.containerBg,
                  borderRadius: 2,
                  p: 2,
                  maxHeight: 150, // Further reduced height for smaller modal
                  overflowY: "auto",
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <Box
                  sx={{
                    display: "inline-block",
                    px: 1.5,
                    py: 0.5,
                    backgroundColor: theme.palette.custom.navbarBg,
                    color: theme.palette.text.secondary,
                    borderRadius: 1,
                    mb: 1.5,
                  }}
                >
                  Floors
                </Box>
                {floorList.map((f) => {
                  const isSelected = selectedFloors.some((sf) => sf.id === f.id);
                  const permObj = selectedFloors.find((sf) => sf.id === f.id);
                  const currentPerm = permObj?.permission || permissionOptions[0];
                  return (
                    <Box
                      key={f.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        backgroundColor: theme.palette.custom.buttonBg,
                        borderRadius: 1,
                        p: 1,
                        mb: 1,
                      }}
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleFloor(f.id)}
                        sx={{
                          color: theme.palette.text.secondary,
                          "&.Mui-checked": {
                            color: theme.palette.text.secondary,
                          },
                        }}
                      />
                      <Typography
                        sx={{
                          flex: 1,
                          color: theme.palette.text.secondary,
                          ml: 1,
                        }}
                      >
                        {f.floor_name}
                      </Typography>

                      <FormControl
                        size="small"
                        sx={{
                          width: 180,
                          backgroundColor: "#fff",
                          borderRadius: 1,
                        }}
                        disabled={!isSelected}
                      >
                        <Select
                          value={currentPerm}
                          onChange={(e) => changePerm(f.id, e.target.value)}
                        >
                          {permissionOptions.map((opt) => (
                            <MenuItem key={opt} value={opt}>
                              {opt}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  );
                })}
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
            "Save"
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
