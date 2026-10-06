// src/screens/authentication/Login.jsx
import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../settings/theme/ThemeContext";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

// Auth thunks + selectors
import {
  signIn,
  selectLoading as selectSignInLoading,
  selectError as selectSignInError,
  selectSigninData,
  fetchProfile,
} from "../../redux/slice/auth/userlogin";

// Theme settings
import {
  fetchThemeSettings,
  selectThemeSettings,
  selectThemeLoading,
  selectThemeError,
} from "../../redux/slice/theme/themeSlice";

const Login = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const loading = useSelector(selectSignInLoading);
  const error = useSelector(selectSignInError);
  const signinData = useSelector(selectSigninData);

  const themeSettings = useSelector(selectThemeSettings);
  const themeLoading = useSelector(selectThemeLoading);
  const themeError = useSelector(selectThemeError);

  const backgroundImage = theme.palette.custom.backgroundImage;

  const [creds, setCreds] = useState({ username: "", password: "" });
  const [errs, setErrs] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState(false);
  const [autoRedirect, setAutoRdirect] = useState(true)

  useEffect(() => {
    // dispatch(fetchThemeSettings());
    let token = localStorage.getItem('lutron')
    console.log("Token ===>", token);
    if (!token) {
      setAutoRdirect(false)
    } else {
      navigate('/dashboard')
    }
  }, []);

  useEffect(() => {
    const fetchAndNavigate = async () => {
      if (signinData?.access_token) {
        localStorage.setItem("lutron", signinData.access_token);
        localStorage.setItem("role", signinData?.role);

        // Check if user needs to change password
        if (signinData?.change_password === true) {
          // Store change_password flag in localStorage for reference
          localStorage.setItem("change_password", "true");
          // Force redirect to change password page
          navigate("/auth/change_password", { replace: true });
          return;
        }

        // Normal flow: fetch profile and go to dashboard
        await dispatch(fetchProfile());
        navigate("/dashboard");
      }
    };
    fetchAndNavigate();
  }, [signinData, dispatch, navigate]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const uErr = validateField("username", creds.username);
    const pErr = validateField("password", creds.password);
    setErrs({ username: uErr, password: pErr });
    if (uErr || pErr) return;

    setLoginError(false);
    const response = await dispatch(signIn(creds));
    if (!response.payload) {
      setLoginError(true);
    }
  };

  return (
    <>
      {!autoRedirect ?
        <Box
          sx={{
            width: "100%",
            height: "100vh",
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 2,
          }}
        >
          <Card
            component="form"
            onSubmit={handleSubmit}
            elevation={6}
            sx={{
              width: { xs: "100%", sm: 360 },
              maxWidth: 400,
              bgcolor: theme.palette.custom.navbarBg,
              borderRadius: "12px",
              p: { xs: 2, sm: 4 },
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
              }}
            />

            <Typography
              variant="h6"
              align="left"
              sx={{ color: theme.palette.text.secondary, mb: 3 }}
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
              sx={{
                mb: 2,
                "& .MuiFilledInput-root": {
                  backgroundColor: theme.palette.custom.containerBg,
                  borderRadius: "5px",
                  "&:hover": {
                    backgroundColor: theme.palette.custom.containerBg,
                  },
                  "&:before, &:after": {
                    borderBottom: "none",
                  },
                },
                "& .MuiFilledInput-input": {
                  color: theme.palette.text.primary,
                  px: 1.5,
                  py: 1,
                },
              }}
            />
            {Boolean(errs.username) && (
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, ml: 1.5, mt: 0.5 }}>
                {errs.username}
              </Typography>
            )}

            <TextField
              fullWidth
              name="password"
              type="password"
              placeholder="Password"
              variant="filled"
              value={creds.password}
              onChange={handleChange}
              disabled={loading}
              error={Boolean(errs.password)}
              sx={{
                mb: 2,
                "& .MuiFilledInput-root": {
                  backgroundColor: theme.palette.custom.containerBg,
                  borderRadius: "5px",
                  "&:hover": {
                    backgroundColor: theme.palette.custom.containerBg,
                  },
                  "&:before, &:after": {
                    borderBottom: "none",
                  },
                },
                "& .MuiFilledInput-input": {
                  color: theme.palette.text.primary,
                  px: 1.5,
                  py: 1,
                },
              }}
            />
            {Boolean(errs.password) && (
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, ml: 1.5, mt: 0.5, mb: 3 }}>
                {errs.password}
              </Typography>
            )}

            <Box sx={{ position: "relative" }}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  backgroundColor: theme.palette.custom.buttonBg,
                  color: theme.palette.text.secondary,
                  textTransform: "none",
                  height: 48,
                  borderRadius: "8px",
                  "&:hover": {
                    backgroundColor: theme.palette.custom.buttonBg,
                  },
                }}
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
                    color: theme.palette.text.secondary,
                  }}
                />
              )}
            </Box>
          </Card>
        </Box> :
        <Box
          sx={{
            width: "100%",
            height: "100vh",
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 2,
          }}
        >
          <Typography variant="h2" textAlign={"center"}>Loading...</Typography>
        </Box>
      }

    </>
  );
};

export default Login;
