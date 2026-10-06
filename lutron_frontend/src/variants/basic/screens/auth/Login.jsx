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
import { useTheme } from "@mui/material/styles";
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
  selectThemeLoading,
  selectThemeError,
} from "../../redux/slice/theme/themeSlice";
import { resolveAuthPageBackgroundUrl } from "../../utils/normalizeBackgroundPath";
import lutronLogo from "../../assets/images/lutron-logo.png";
import { resetAuthRedirectGuard } from "../../BaseUrl";
import { buildPasswordVisibilityInputProps } from "../../../../utils/passwordVisibilityAdornment";
import { dispatchFetchThemeSettingsOnce } from "../../../../shared/utils/bootstrapFetchGuards";
import { createSingleFlight } from "../../../../shared/utils/createSingleFlight";

const QV_ACCENT = "#0d6ebc";
const QV_ACCENT_HOVER = "#0a5a9a";
/** Rounded corners for login shell (visual only). */
const LOGIN_RADIUS_CARD = "24px";
/** Rounded corners for fields and Sign In button. */
const LOGIN_RADIUS_CONTROL = "14px";
/** Header: gap under logo before “Sign In”. */
const LOGIN_LOGO_TO_TITLE_GAP_PX = 2;
/** Header: space after title before inputs. */
const LOGIN_TITLE_TO_FIELDS_SPACING = 2.5;
/** Logo: max height (px) inside card — primary size control for wide marks. */
const LOGIN_LOGO_MAX_HEIGHT_PX = 120;
/** Logo: max width — keep within padded card (card maxWidth 400). */
const LOGIN_LOGO_MAX_WIDTH_PX = 360;

const Login = () => {
  const theme = useTheme();
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

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const loading = useSelector(selectSignInLoading);
  const error = useSelector(selectSignInError);
  const themeLoading = useSelector(selectThemeLoading);
  const themeError = useSelector(selectThemeError);

  const [creds, setCreds] = useState({ username: "", password: "" });
  const [errs, setErrs] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [autoRedirect, setAutoRdirect] = useState(true)

  useEffect(() => {
    resetAuthRedirectGuard();
    dispatchFetchThemeSettingsOnce(dispatch, fetchThemeSettings);
    const token = localStorage.getItem("lutron");
    if (!token) {
      setAutoRdirect(false);
    } else {
      navigate("/dashboard/overview");
    }
  }, [dispatch, navigate]);

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
      {!autoRedirect ? (
        <Box
          sx={{
            width: "100%",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: 2,
            bgcolor: theme.palette.background.default,
            ...authPageBackgroundSx,
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
              pt: { xs: 1, sm: 1.5 },
              boxShadow: "0 2px 16px rgba(0, 0, 0, 0.2)",
              alignSelf: "center",
              overflow: "hidden",
            }}
          >
            <Box sx={{ mb: LOGIN_TITLE_TO_FIELDS_SPACING, lineHeight: 0 }}>
              <Box
                component="img"
                src={lutronLogo}
                alt="Lutron"
                sx={{
                  display: "block",
                  width: "100%",
                  maxWidth: LOGIN_LOGO_MAX_WIDTH_PX,
                  height: "auto",
                  maxHeight: LOGIN_LOGO_MAX_HEIGHT_PX,
                  objectFit: "contain",
                  objectPosition: "left top",
                  m: 0,
                  mt: 0,
                  mb: `${LOGIN_LOGO_TO_TITLE_GAP_PX}px`,
                  lineHeight: 0,
                }}
              />
              <Typography
                component="h1"
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: "1.125rem", sm: "1.25rem" },
                  color: "#000",
                  lineHeight: 1.25,
                  letterSpacing: "0.02em",
                  m: 0,
                  display: "block",
                }}
              >
                Sign In
              </Typography>
            </Box>

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
                  borderRadius: LOGIN_RADIUS_CONTROL,
                }}
              >
                Failed to load theme settings: {themeError}
              </Alert>
            )}

            {(error || loginError) && (
              <Alert
                icon={<ErrorOutlineIcon sx={{ color: "#f44336" }} />}
                sx={{
                  mb: 2,
                  color: "#000",
                  backgroundColor: "#fff6f5",
                  border: "1px solid #f44336",
                  borderRadius: LOGIN_RADIUS_CONTROL,
                }}
              >
                Invalid username or password.
              </Alert>
            )}

            <TextField
              fullWidth
              name="username"
              placeholder="Username"
              variant="outlined"
              value={creds.username}
              onChange={handleChange}
              disabled={loading}
              error={Boolean(errs.username)}
              hiddenLabel
              inputProps={{ "aria-label": "Username" }}
              sx={{
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
              }}
            />
            {Boolean(errs.username) && (
              <Typography
                variant="caption"
                sx={{ color: "#b71c1c", ml: 0.5, mt: 0, mb: 1, display: "block" }}
              >
                {errs.username}
              </Typography>
            )}

            <TextField
              fullWidth
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              variant="outlined"
              value={creds.password}
              onChange={handleChange}
              disabled={loading}
              error={Boolean(errs.password)}
              hiddenLabel
              inputProps={{ "aria-label": "Password" }}
              InputProps={buildPasswordVisibilityInputProps(
                showPassword,
                setShowPassword,
                { color: "rgba(0, 0, 0, 0.44)" }
              )}
              sx={{
                mb: 2.5,
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
              }}
            />
            {Boolean(errs.password) && (
              <Typography
                variant="caption"
                sx={{ color: "#b71c1c", ml: 0.5, mt: 0, mb: 1.5, display: "block" }}
              >
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
                    color: "#ffffff",
                  }}
                />
              )}
            </Box>
          </Card>
        </Box>
      ) : (
        <Box
          sx={{
            width: "100%",
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 2,
            bgcolor: theme.palette.background.default,
            ...authPageBackgroundSx,
          }}
        >
          <Typography
            variant="h6"
            textAlign="center"
            sx={{
              color: "rgba(255,255,255,0.95)",
              textShadow: "0 1px 4px rgba(0,0,0,0.5)",
            }}
          >
            Loading...
          </Typography>
        </Box>
      )}
    </>
  );
};

export default Login;
