import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { BaseUrl } from "../../../BaseUrl"; // your Axios instance
import { clearDashboardData } from "../dashboard/dashboardSlice";
import { clearUserData as clearHeatmapUserData } from "../settingsslice/heatmap/HeatmapSlice";
import { clearAlertsState } from "../dashboard/alertsSlice";

// Get the token from localStorage, so that once signIn succeeds we can call /auth/me
export const getToken = () => localStorage.getItem("lutron");

// Validate if the current token is valid and matches the expected format
export const validateToken = (token) => {
  if (!token) return false;
  
  try {
    // Basic JWT structure validation (3 parts separated by dots)
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Check if token is not expired (basic check)
    const payload = JSON.parse(atob(parts[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    // If token has exp field, check if it's not expired
    if (payload.exp && payload.exp < currentTime) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

// Get token with validation
export const getValidToken = () => {
  const token = getToken();
  return validateToken(token) ? token : null;
};

export const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${getToken()}` }
});

/**
 * 1) signIn Thunk → POST /auth/login
 *    On success: response.data might look like { access_token: "...", expires_in: … }
 */
export const signIn = createAsyncThunk(
  "user/signIn",
  async (credentials, { rejectWithValue, dispatch }) => {
    try {
      // Clear any existing user data before signing in
      dispatch(clearDashboardData());
      dispatch(clearHeatmapUserData());
      dispatch(clearAlertsState());
      
      const response = await BaseUrl.post("/auth/login", credentials);
      return response.data; // e.g. { access_token: "…" }
    } catch (err) {
      return rejectWithValue("Authentication failed. Please check your credentials.");
    }
  }
);


/**
 * 2) fetchProfile Thunk → GET /auth/me
 *    We call this _after_ signIn succeeds and the token is in localStorage
 *    On success: response.data should be { name: "Admin User", email: "foo@bar.com", role: "admin" }
 */
export const fetchProfile = createAsyncThunk(
  "user/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {

      const response = await BaseUrl.get("/auth/me");

      return response.data;
    } catch (err) {
      return rejectWithValue("Failed to fetch user profile.");
    }
  }
);


/**
 * 3) logout Thunk → POST /auth/logout
 *    Sends current token for validation and clears the user's token on success
 */
export const logout = createAsyncThunk(
  "user/logout",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      // Get current token for validation
      const currentToken = getValidToken();
      
      if (!currentToken) {
        // If no valid token exists, just clear local state
        return { success: true, message: "No valid session to logout" };
      }

      // Send token for validation during logout
      const response = await BaseUrl.post("/auth/logout", {
        token: currentToken,
        logoutTime: new Date().toISOString()
      });
      
      return response.data || { success: true, message: "Logout successful" };
    } catch (err) {
      // Even if logout API fails, we should still clear local state
      // This handles cases where the token might be expired or invalid
      console.warn("Logout API failed, but clearing local state:", err);
      return { success: true, message: "Local logout completed" };
    } finally {
      // Always clear user-specific data from all slices
      dispatch(clearDashboardData());
      dispatch(clearHeatmapUserData());
      dispatch(clearAlertsState());
    }
  }
);

/**
 * 4) changePassword Thunk → POST /auth/change_password
 *    Changes user password
 */
export const changePassword = createAsyncThunk(
  "user/changePassword",
  async (passwordData, { rejectWithValue }) => {
    try {
      const response = await BaseUrl.post("/auth/change_password", passwordData);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || "Failed to change password. Please try again.";
      return rejectWithValue(errorMessage);
    }
  }
);


// 4) Create user slice
const userSlice = createSlice({
  name: "user",
  initialState: {
    // after signIn: { access_token: "...", … }
    signinData: {},
    loading: false,
    error: null,

    // after fetchProfile: { name, email, role, … }
    profile: null,
    profileLoading: false,
    profileError: null,

    logoutLoading: false,
    logoutError: null,

    // changePassword state
    changePasswordLoading: false,
    changePasswordError: null,
    changePasswordSuccess: false,
  },
  reducers: {
    resetChangePasswordState: (state) => {
      state.changePasswordLoading = false;
      state.changePasswordError = null;
      state.changePasswordSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── signIn ────────────────────────────────────────────────────────────────
      .addCase(signIn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.loading = false;
        state.signinData = action.payload; // e.g. { access_token: "…" }
        localStorage.setItem("lutron", action.payload.access_token); // Save token to localStorage
      })
      .addCase(signIn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Clear dashboard data when user logs in to prevent data from previous user
      .addCase(clearDashboardData, (state) => {
        // This will be handled by the dashboard slice
        // We just need to listen to it here to ensure it's called
      })

      // ── fetchProfile ─────────────────────────────────────────────────────────
      .addCase(fetchProfile.pending, (state) => {
        state.profileLoading = true;
        state.profileError = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.profile = action.payload; // e.g. { name: "Admin User", role: "admin", … }
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.profileError = action.payload;
      })

      // ── logout ────────────────────────────────────────────────────────────────
      .addCase(logout.pending, (state) => {
        state.logoutLoading = true;
        state.logoutError = null;
      })
      .addCase(logout.fulfilled, (state, action) => {
        state.logoutLoading = false;
        state.signinData = {};  // clear token
        state.profile = null;   // clear profile
        state.logoutError = null;
        
        // Clear all authentication-related data from localStorage
        localStorage.removeItem("lutron"); // Clear token
        localStorage.removeItem("role"); // Clear role
        localStorage.removeItem("permission"); // Clear permission
        localStorage.removeItem("userEmail"); // Clear saved email
        
        // Logout successful
      })
      .addCase(logout.rejected, (state, action) => {
        state.logoutLoading = false;
        state.logoutError = action.payload;
        
        // Even if logout API fails, clear local state for security
        state.signinData = {};
        state.profile = null;
        localStorage.removeItem("lutron");
        localStorage.removeItem("role");
        localStorage.removeItem("permission");
        localStorage.removeItem("userEmail");
        
        // Logout API failed, but local state cleared
      })

      // ── changePassword ────────────────────────────────────────────────────────────────
      .addCase(changePassword.pending, (state) => {
        state.changePasswordLoading = true;
        state.changePasswordError = null;
        state.changePasswordSuccess = false;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.changePasswordLoading = false;
        state.changePasswordSuccess = true;
        state.changePasswordError = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.changePasswordLoading = false;
        state.changePasswordError = action.payload;
        state.changePasswordSuccess = false;
      });
  },
});

export default userSlice.reducer;

// 5) Selectors
export const selectSigninData = (state) => state.user.signinData;
export const selectLoading = (state) => state.user.loading;
export const selectError = (state) => state.user.error;
export const selectProfile = (state) => state.user.profile;
export const selectProfileLoading = (state) => state.user.profileLoading;
export const selectProfileError = (state) => state.user.profileError;
export const selectLogoutLoading = (state) => state.user.logoutLoading;
export const selectLogoutError = (state) => state.user.logoutError;
export const selectChangePasswordLoading = (state) => state.user.changePasswordLoading;
export const selectChangePasswordError = (state) => state.user.changePasswordError;
export const selectChangePasswordSuccess = (state) => state.user.changePasswordSuccess;

// 6) Actions
export const { resetChangePasswordState } = userSlice.actions;
