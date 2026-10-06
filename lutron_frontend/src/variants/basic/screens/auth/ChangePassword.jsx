// src/screens/auth/ChangePassword.jsx
import React, { useState, useEffect, useMemo } from "react";
import { toSafeReactText } from '../../../../utils/safeReactText';
import { createSingleFlight } from "../../../../shared/utils/createSingleFlight";
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { resolveAuthPageBackgroundUrl } from "../../utils/normalizeBackgroundPath";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

// Auth thunks + selectors
import {
  changePassword,
  selectChangePasswordLoading,
  selectChangePasswordError,
  selectChangePasswordSuccess,
  resetChangePasswordState,
} from "../../redux/slice/auth/userlogin";

const QV_ACCENT = "#0d6ebc";
const QV_ACCENT_HOVER = "#0a5a9a";
const LOGIN_RADIUS_CARD = "24px";
const LOGIN_RADIUS_CONTROL = "14px";

const ChangePassword = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector(selectChangePasswordLoading);
  const error = useSelector(selectChangePasswordError);
  const success = useSelector(selectChangePasswordSuccess);

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Check if user is authenticated, if not redirect to login (but not if we're redirecting after success)
  useEffect(() => {
    if (isRedirecting) return;
    const token = localStorage.getItem("lutron");
    if (!token && !success) {
      navigate("/login", { replace: true });
    }
  }, [navigate, isRedirecting, success]);

  // Reset form when component mounts
  useEffect(() => {
    dispatch(resetChangePasswordState());
  }, [dispatch]);

  // Handle successful password change
  useEffect(() => {
    if (success && !isRedirecting) {
      setIsRedirecting(true);
      
      // Clear the change_password flag from localStorage if it exists
      localStorage.removeItem("change_password");
      
      // Clear authentication token and user data
      localStorage.removeItem("lutron");
      localStorage.removeItem("role");
      localStorage.removeItem("permission");
      localStorage.removeItem("userEmail");
      
      // Redirect to login page immediately after successful password change
      window.location.href = "/login";
    }
  }, [success, isRedirecting]);

  const validateField = (name, value) => {
    switch (name) {
      case "currentPassword":
        if (!value.trim()) return "Current password is required";
        return "";
      case "newPassword":
        if (!value.trim()) return "New password is required";
        if (value.length < 6) return "Password must be at least 6 characters";
        if (value === formData.currentPassword) {
          return "New password must be different from current password";
        }
        return "";
      case "confirmPassword":
        if (!value.trim()) return "Please confirm your new password";
        if (value !== formData.newPassword) {
          return "Passwords do not match";
        }
        return "";
      default:
        return "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const validationError = validateField(name, value);
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: validationError }));
  };

  const runSubmitOnce = useMemo(() => createSingleFlight(), []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    return runSubmitOnce(async () => {
    // Validate all fields
    const currentPasswordError = validateField("currentPassword", formData.currentPassword);
    const newPasswordError = validateField("newPassword", formData.newPassword);
    const confirmPasswordError = validateField("confirmPassword", formData.confirmPassword);
    setErrors({
      currentPassword: currentPasswordError,
      newPassword: newPasswordError,
      confirmPassword: confirmPasswordError,
    });
    if (currentPasswordError || newPasswordError || confirmPasswordError) {
      return;
    }
    // Dispatch change password action
    await dispatch(
      changePassword({
        current_password: formData.currentPassword,
        new_password: formData.newPassword,
      })
    );
  });
  };

  const pageBackgroundUrl = resolveAuthPageBackgroundUrl(
    theme?.palette?.custom?.backgroundImage
  );
  const authPageBackgroundSx = pageBackgroundUrl
    ? {
        backgroundImage: `url(${pageBackgroundUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }
    : {};

  const textFieldSx = {
    mb: 1.5,
    "& .MuiOutlinedInput-root": {
      backgroundColor: "#fff",
      borderRadius: LOGIN_RADIUS_CONTROL,
      color: "rgba(0, 0, 0, 0.87)",
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "rgba(0, 0, 0, 0.2)",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "rgba(0, 0, 0, 0.3)",
    },
    "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "rgba(0, 0, 0, 0.4)",
    },
    "& .MuiOutlinedInput-input::placeholder": {
      color: "rgba(0, 0, 0, 0.4)",
      opacity: 1,
    },
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "100vh",
        ...authPageBackgroundSx,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Card
        component="form"
        onSubmit={handleSubmit}
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 400,
          bgcolor: "#ffffff",
          borderRadius: LOGIN_RADIUS_CARD,
          px: { xs: 3, sm: 4 },
          pb: { xs: 3, sm: 4 },
          pt: { xs: 3, sm: 4 },
          boxShadow: "0 2px 16px rgba(0, 0, 0, 0.2)",
          alignSelf: "center",
          overflow: "hidden",
        }}
      >
        <Typography
          variant="h5"
          align="left"
          sx={{ color: "#000", mb: 0.5, fontWeight: 700, fontSize: "1.25rem" }}
        >
          Change Password
        </Typography>
        <Typography
          variant="body2"
          align="left"
          sx={{ color: "rgba(0, 0, 0, 0.6)", mb: 3 }}
        >
          Please set a new password for your account
        </Typography>

        {success && (
          <Alert
            severity="success"
            sx={{
              mb: 2,
              borderRadius: LOGIN_RADIUS_CONTROL,
            }}
          >
            Password changed successfully! Redirecting...
          </Alert>
        )}

        {error && (
          <Alert
            icon={<ErrorOutlineIcon sx={{ color: "#f44336" }} />}
            severity="error"
            sx={{
              mb: 2,
              color: "#000",
              backgroundColor: "#fff6f5",
              border: "1px solid #f44336",
              borderRadius: LOGIN_RADIUS_CONTROL,
            }}
          >
            {toSafeReactText(error)}
          </Alert>
        )}

        {!success && (
          <>
            <TextField
              fullWidth
              name="currentPassword"
              type={showCurrentPassword ? "text" : "password"}
              placeholder="Current Password"
              variant="outlined"
              value={formData.currentPassword}
              onChange={handleChange}
              disabled={loading}
              error={Boolean(errors.currentPassword)}
              sx={textFieldSx}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowCurrentPassword((prev) => !prev)}
                      edge="end"
                      sx={{ color: "rgba(0, 0, 0, 0.44)" }}
                    >
                      {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {Boolean(errors.currentPassword) && (
              <Typography
                variant="caption"
                sx={{ color: "#b71c1c", ml: 0.5, mt: -1, mb: 1, display: "block" }}
              >
                {errors.currentPassword}
              </Typography>
            )}

            <TextField
              fullWidth
              name="newPassword"
              type={showNewPassword ? "text" : "password"}
              placeholder="New Password"
              variant="outlined"
              value={formData.newPassword}
              onChange={handleChange}
              disabled={loading}
              error={Boolean(errors.newPassword)}
              sx={textFieldSx}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      edge="end"
                      sx={{ color: "rgba(0, 0, 0, 0.44)" }}
                    >
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {Boolean(errors.newPassword) && (
              <Typography
                variant="caption"
                sx={{ color: "#b71c1c", ml: 0.5, mt: -1, mb: 1, display: "block" }}
              >
                {errors.newPassword}
              </Typography>
            )}

            <TextField
              fullWidth
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm New Password"
              variant="outlined"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
              error={Boolean(errors.confirmPassword)}
              sx={textFieldSx}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      edge="end"
                      sx={{ color: "rgba(0, 0, 0, 0.44)" }}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {Boolean(errors.confirmPassword) && (
              <Typography
                variant="caption"
                sx={{ color: "#b71c1c", ml: 0.5, mt: -1, mb: 2, display: "block" }}
              >
                {errors.confirmPassword}
              </Typography>
            )}

            <Box sx={{ position: "relative", mt: 1 }}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  backgroundColor: QV_ACCENT,
                  color: "#ffffff",
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  height: 48,
                  borderRadius: LOGIN_RADIUS_CONTROL,
                  boxShadow: "none",
                  letterSpacing: 0.04,
                  "&:hover": {
                    backgroundColor: QV_ACCENT_HOVER,
                    boxShadow: "none",
                  },
                }}
              >
                {loading ? "Changing Password..." : "Change Password"}
              </Button>
              {loading && (
                <CircularProgress
                  size={24}
                  sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    mt: "-12px",
                    ml: "-12px",
                    color: "#ffffff",
                  }}
                />
              )}
            </Box>
          </>
        )}
      </Card>
    </Box>
  );
};

export default ChangePassword;
