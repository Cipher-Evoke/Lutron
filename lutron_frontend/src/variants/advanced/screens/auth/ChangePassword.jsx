// src/screens/auth/ChangePassword.jsx
import React, { useState, useEffect, useMemo } from "react";
import { createSingleFlight } from "../../../../shared/utils/createSingleFlight";
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import LockIcon from "@mui/icons-material/Lock";
// Auth thunks + selectors
import {
  changePassword,
  selectChangePasswordLoading,
  selectChangePasswordError,
  selectChangePasswordSuccess,
  resetChangePasswordState,
} from "../../redux/slice/auth/userlogin";
import {
  authPageSx,
  authCardSx,
  authHeadingSx,
  authSubtextSx,
  authCaptionSx,
  authFieldSx,
  authButtonSx,
  authIconSx,
  authPasswordVisibilityIconSx,
} from "./authFormStyles";
import { buildPasswordVisibilityInputProps } from "../../../../utils/passwordVisibilityAdornment";

const ChangePassword = () => {
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
      // User needs to login again with new password
      // Use window.location for a hard redirect to ensure it works
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
  return (
    <Box className="auth-page" sx={authPageSx}>
      <Card
        component="form"
        onSubmit={handleSubmit}
        elevation={6}
        sx={{
          width: { xs: "100%", sm: 420 },
          maxWidth: 450,
          p: { xs: 3, sm: 4 },
          ...authCardSx,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 2,
          }}
        >
          <LockIcon sx={{ fontSize: 48, ...authIconSx }} />
        </Box>
        <Typography
          variant="h5"
          align="center"
          sx={{ ...authHeadingSx, mb: 1, fontWeight: 600 }}
        >
          Change Password
        </Typography>
        <Typography
          variant="body2"
          align="center"
          sx={{ ...authSubtextSx, mb: 3 }}
        >
          Please set a new password for your account
        </Typography>
        {success && (
          <Alert
            severity="success"
            sx={{
              mb: 2,
              color: "#000",
              backgroundColor: "#d4edda",
              border: "1px solid #c3e6cb",
            }}
          >
            Password changed successfully! Redirecting to login page. Please login with your new password.
          </Alert>
        )}
        {error && (
          <Alert
            icon={<ErrorOutlineIcon sx={{ color: "#f44336" }} />}
            severity="error"
            sx={{
              mb: 2,
              color: "#000",
              backgroundColor: "#fff",
              border: "1px solid #f44336",
            }}
          >
            {error}
          </Alert>
        )}
        {!success && (
          <>
        <TextField
          fullWidth
          name="currentPassword"
          type={showCurrentPassword ? "text" : "password"}
          placeholder="Current Password"
          variant="filled"
          value={formData.currentPassword}
          onChange={handleChange}
          onBlur={(e) => {
            const error = validateField("currentPassword", e.target.value);
            setErrors((prev) => ({ ...prev, currentPassword: error }));
          }}
          disabled={loading || success}
          error={Boolean(errors.currentPassword)}
          InputProps={buildPasswordVisibilityInputProps(
            showCurrentPassword,
            setShowCurrentPassword,
            authPasswordVisibilityIconSx,
            "auth-password-visibility-btn"
          )}
          sx={{ mb: 1, ...authFieldSx }}
        />
        {Boolean(errors.currentPassword) && (
          <Typography
            variant="caption"
            sx={{ ...authCaptionSx, ml: 1.5, mb: 1, display: "block" }}
          >
            {errors.currentPassword}
          </Typography>
        )}
        <TextField
          fullWidth
          name="newPassword"
          type={showNewPassword ? "text" : "password"}
          placeholder="New Password"
          variant="filled"
          value={formData.newPassword}
          onChange={handleChange}
          onBlur={(e) => {
            const error = validateField("newPassword", e.target.value);
            setErrors((prev) => ({ ...prev, newPassword: error }));
            // Re-validate confirm password if it has a value
            if (formData.confirmPassword) {
              const confirmError = validateField("confirmPassword", formData.confirmPassword);
              setErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
            }
          }}
          disabled={loading || success}
          error={Boolean(errors.newPassword)}
          InputProps={buildPasswordVisibilityInputProps(
            showNewPassword,
            setShowNewPassword,
            authPasswordVisibilityIconSx,
            "auth-password-visibility-btn"
          )}
          sx={{ mb: 1, ...authFieldSx }}
        />
        {Boolean(errors.newPassword) && (
          <Typography
            variant="caption"
            sx={{ ...authCaptionSx, ml: 1.5, mb: 1, display: "block" }}
          >
            {errors.newPassword}
          </Typography>
        )}
        <TextField
          fullWidth
          name="confirmPassword"
          type={showConfirmPassword ? "text" : "password"}
          placeholder="Confirm New Password"
          variant="filled"
          value={formData.confirmPassword}
          onChange={handleChange}
          onBlur={(e) => {
            const error = validateField("confirmPassword", e.target.value);
            setErrors((prev) => ({ ...prev, confirmPassword: error }));
          }}
          disabled={loading || success}
          error={Boolean(errors.confirmPassword)}
          InputProps={buildPasswordVisibilityInputProps(
            showConfirmPassword,
            setShowConfirmPassword,
            authPasswordVisibilityIconSx,
            "auth-password-visibility-btn"
          )}
          sx={{ mb: 1, ...authFieldSx }}
        />
        {Boolean(errors.confirmPassword) && (
          <Typography
            variant="caption"
            sx={{ ...authCaptionSx, ml: 1.5, mb: 2, display: "block" }}
          >
            {errors.confirmPassword}
          </Typography>
        )}
            <Box sx={{ position: "relative", mt: 2 }}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading || success}
                sx={authButtonSx}
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
                    color: '#ffffff',
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
