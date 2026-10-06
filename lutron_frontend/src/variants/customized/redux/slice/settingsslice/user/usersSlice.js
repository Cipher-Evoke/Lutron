// src/redux/slice/settingsslice/usersSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { BaseUrl } from "../../../../BaseUrl";

export function formatApiError(err) {
  const data = err?.response?.data;
  const detail = data?.detail;
  if (Array.isArray(detail)) {
    return detail.map((x) => x.msg || JSON.stringify(x)).join("; ");
  }
  if (typeof detail === "string") {
    return detail;
  }
  return data?.message || err?.response?.statusText || err?.message || "Request failed";
}

// Thunk to fetch users with Bearer token
export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async (_, { rejectWithValue }) => {
    // 1) Read the token from localStorage
    const token = localStorage.getItem("lutron");
    if (!token) {
      // If there is no token, bail out early
      return rejectWithValue("Not logged in");
    }

    try {
      // 2) Make a GET /users call, passing the Bearer token
      const response = await BaseUrl.get("/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Extract the data array from the nested response structure
      // API returns: { status: "success", count: 3, data: [...] }
      const usersData = response.data?.data || response.data;
      
      // Ensure we return an array
      if (Array.isArray(usersData)) {
        return usersData;
      } else {
        console.error('Unexpected API response structure:', response.data);
        return rejectWithValue("Invalid API response structure");
      }
    } catch (err) {
      // 3) If the API returns an error, extract its message
      return rejectWithValue(
        err.response?.data?.message ||
        err.response?.statusText ||
        err.message
      );
    }
  }
);

// Thunk to update user with Bearer token
export const updateUser = createAsyncThunk(
  "users/updateUser",
  async ({ userId, body }, { rejectWithValue }) => {
    if (!userId || isNaN(Number(userId))) {
      return rejectWithValue("Invalid user ID");
    }
    const token = localStorage.getItem("lutron");
    if (!token) {
      return rejectWithValue("Not logged in");
    }
    try {
      const response = await BaseUrl.patch("/users/update", { ...body, user_id: Number(userId) }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(formatApiError(err));
    }
  }
);

// Thunk to delete user with Bearer token
export const deleteUser = createAsyncThunk(
  "users/deleteUser",
  async (userId, { rejectWithValue }) => {
    // Validate userId is a valid number
    if (!userId || isNaN(Number(userId))) {
      return rejectWithValue("Invalid user ID");
    }
    
    const token = localStorage.getItem("lutron");
    if (!token) {
      return rejectWithValue("Not logged in");
    }

    try {
      // Backend expects user_id as query parameter
      const response = await BaseUrl.post("/users/delete",
        { user_id: Number(userId) },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      return { userId, message: response.data?.message || "User deleted successfully" };
    } catch (err) {
      // Log detailed error information for debugging
      console.error('Delete user error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });
      
      return rejectWithValue(
        err.response?.data?.message ||
        err.response?.statusText ||
        err.message
      );
    }
  }
);

const usersSlice = createSlice({
  name: "users",
  initialState: {
    usersList: [], // will hold the array of users once fetched

    loading:   false,
    error:     null,
    deleteLoading: false,
    deleteError: null,
    updateLoading: false,
    updateError: null,

  },
  reducers: {
    // Clear delete error
    clearDeleteError: (state) => {
      state.deleteError = null;
    },
    clearUpdateError: (state) => {
      state.updateError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // When the fetchUsers thunk first runs:
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // When the fetchUsers thunk succeeds:
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.usersList = Array.isArray(action.payload)
          ? action.payload
          : action.payload?.data || [];// array of users
      })
      // When the fetchUsers thunk fails:
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;

        state.error   = action.payload || action.error.message;
      })
      // Delete user cases
      .addCase(deleteUser.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.deleteLoading = false;
        // Remove the deleted user from the list
        state.usersList = state.usersList.filter(user => user.id !== action.payload.userId);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload || action.error.message;

      })
      .addCase(updateUser.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(updateUser.fulfilled, (state) => {
        state.updateLoading = false;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload || action.error.message;
      });
  },
});

export const { clearDeleteError, clearUpdateError } = usersSlice.actions;
export default usersSlice.reducer;

// Selectors so components can read exactly what they need:
export const selectUsers = (state) => state.users.usersList;
export const selectUsersLoading = (state) => state.users.loading;

export const selectUsersError   = (state) => state.users.error;
export const selectDeleteLoading = (state) => state.users.deleteLoading;
export const selectDeleteError = (state) => state.users.deleteError;
export const selectUpdateLoading = (state) => state.users.updateLoading;
export const selectUpdateError = (state) => state.users.updateError;

