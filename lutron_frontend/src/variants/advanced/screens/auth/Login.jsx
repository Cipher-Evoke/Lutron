// src/screens/authentication/Login.jsx
import React, { useState, useEffect, useMemo } from "react";
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

// Auth thunks + selectors
import {
  signIn,
  selectLoading as selectSignInLoading,
  selectError as selectSignInError,
  fetchProfile,
} from "../../redux/slice/auth/userlogin";

// Theme settings
import {
  fetchThemeSettings,
  selectThemeSettings,
  selectThemeLoading,
  selectThemeError,
} from "../../redux/slice/theme/themeSlice";
import {
  authPageSx,
  authCardSx,
  authHeadingSx,
  authCaptionSx,
  authFieldSx,
  authButtonSx,
  authPasswordVisibilityIconSx,
} from "./authFormStyles";
import { resetAuthRedirectGuard } from "../../BaseUrl";
import { buildPasswordVisibilityInputProps } from "../../../../utils/passwordVisibilityAdornment";
import { createSingleFlight } from "../../../../shared/utils/createSingleFlight";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const loading = useSelector(selectSignInLoading);
  const error = useSelector(selectSignInError);
  const themeSettings = useSelector(selectThemeSettings);
  const themeLoading = useSelector(selectThemeLoading);
  const themeError = useSelector(selectThemeError);

  const [creds, setCreds] = useState({ username: "", password: "" });
  const [errs, setErrs] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [autoRedirect, setAutoRdirect] = useState(true)

  useEffect(() => {
    resetAuthRedirectGuard();
    const token = localStorage.getItem("lutron");
    if (!token) {
      setAutoRdirect(false);
    } else {
      navigate("/dashboard/overview");
    }
  }, [navigate]);

  const validateField = (name, value) => {
    switch (name) {
      case "username":
        if (!value.trim()) return "Username is required";

        // if (!emailRegex.test(value.trim())) return "Enter a valid email";
        return "";
      case "password":
        if (!value) return "Password is required";
        // if (value.length < 6) return "At least 6 characters";
        return "";
      default:
        return "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const validationError = validateField(name, value);
    setCreds((prev) => ({ ...prev, [name]: value }));
    setErrs((prev) => ({ ...prev, [name]: validationError }));
  };

  const completeLogin = async (data) => {
    if (!data?.access_token) {
      setLoginError(true);
      return;
    }

    localStorage.setItem("lutron", data.access_token);
    if (data?.role) {
      localStorage.setItem("role", data.role);
    }

    if (data?.change_password === true) {
      localStorage.setItem("change_password", "true");
      navigate("/auth/change_password", { replace: true });
      return;
    }

    try {
      await dispatch(fetchProfile()).unwrap();
    } catch {
      // Profile fetch failure should not block access when login succeeded
    }

    navigate("/dashboard/overview", { replace: true });
  };

  const runSubmitOnce = useMemo(() => createSingleFlight(), []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    return runSubmitOnce(async () => {
    const uErr = validateField("username", creds.username);
    const pErr = validateField("password", creds.password);
    setErrs({ username: uErr, password: pErr });
    if (uErr || pErr) return;

    resetAuthRedirectGuard();
    setLoginError(false);

    try {
      const data = await dispatch(signIn(creds)).unwrap();
      await completeLogin(data);
    } catch {
      setLoginError(true);
    }
  });
  };

  return (
    <>
      {!autoRedirect ?
        <Box className="auth-page" sx={authPageSx}>
          <Card
            component="form"
            onSubmit={handleSubmit}
            elevation={6}
            sx={{
              width: { xs: "100%", sm: 360 },
              maxWidth: 400,
              p: { xs: 2, sm: 4 },
              ...authCardSx,
            }}
          >
            {themeLoading && (
              <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}

            {themeError && (
              <Alert
                icon={<ErrorOutlineIcon sx={{ color: "#f44336" }} />}
                sx={{
                  mb: 2,
                  color: "#000",
                  backgroundColor: "#fff",
                }}
              >
                Failed to load theme settings: {themeError}
              </Alert>
            )}

            <Box
              component="img"
              src="/assets/loginlogo.png"
              alt="Lutron Logo"
              sx={{
                display: "block",
                width: 120,
                mb: 2,
                ml: 0,
                filter: 'var(--auth-logo-filter, none)',
              }}
            />

            <Typography
              variant="h6"
              align="left"
              sx={{ ...authHeadingSx, mb: 3 }}
            >
              Sign In
            </Typography>

            {(error || loginError) && (
              <Alert
                icon={<ErrorOutlineIcon sx={{ color: "#f44336" }} />}
                sx={{
                  mb: 2,
                  color: "#000",
                  backgroundColor: "#fff",
                  border: "1px solid #f44336",
                }}
              >
                Invalid username or password.
              </Alert>
            )}

            <TextField
              fullWidth
              name="username"
              placeholder="Username"
              variant="filled"
              value={creds.username}
              onChange={handleChange}
              disabled={loading}
              error={Boolean(errs.username)}
              sx={{ mb: 2, ...authFieldSx }}
            />
            {Boolean(errs.username) && (
              <Typography variant="caption" sx={{ ...authCaptionSx, ml: 1.5, mt: 0.5 }}>
                {errs.username}
              </Typography>
            )}

            <TextField
              fullWidth
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              variant="filled"
              value={creds.password}
              onChange={handleChange}
              disabled={loading}
              error={Boolean(errs.password)}
              InputProps={buildPasswordVisibilityInputProps(
                showPassword,
                setShowPassword,
                authPasswordVisibilityIconSx,
                "auth-password-visibility-btn"
              )}
              sx={{ mb: 2, ...authFieldSx }}
            />
            {Boolean(errs.password) && (
              <Typography variant="caption" sx={{ ...authCaptionSx, ml: 1.5, mt: 0.5, mb: 3 }}>
                {errs.password}
              </Typography>
            )}

            <Box sx={{ position: "relative" }}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={authButtonSx}
              >
                {loading ? "Signing In..." : "Sign In"}
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
          </Card>
        </Box> :
        <Box className="auth-page" sx={authPageSx}>
          <Typography
            variant="h2"
            textAlign="center"
            sx={{ color: 'var(--auth-card-text, #ffffff)' }}
          >
            Loading...
          </Typography>
        </Box>
      }

    </>
  );
};

export default Login;
