// src/redux/slice/settingsslice/createUserSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { BaseUrl } from "../../../BaseUrl";

// Thunk: create a new user 
//   Expects payload: 
//   { name: string, email: string, password: string, role: string, floors: Array<{ id: number, permission: string }> }
export const createUser = createAsyncThunk(
  "createUser/create",
  async (userData, { rejectWithValue }) => {
    try {
      // 1) Ensure we have a token in localStorage
      const token = localStorage.getItem("lutron");
      if (!token) {
        return rejectWithValue("Not logged in");
      }

      // 2) POST to /users/create with JSON body and Bearer token
      const response = await BaseUrl.post(
        "/users/create",
        userData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (err) {
      // 3) Bubble up the backend’s 422 or other error message
      return rejectWithValue(
        err.response?.data?.message ||
        err.response?.statusText ||
        err.message
      );
    }
  }
);

const createUserSlice = createSlice({
  name: "createUser",
  initialState: {
    createLoading: false,
    createError: null,
    createSuccess: false,
  },
  reducers: {
    // Call this if the dialog is closed or after a successful create,
    // so that createError/createSuccess toggle back to “clean”
    resetCreateState(state) {
      state.createLoading = false;
      state.createError = null;
      state.createSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createUser.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
        state.createSuccess = false;
      })
      .addCase(createUser.fulfilled, (state) => {
        state.createLoading = false;
        state.createSuccess = true;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload || action.error.message;
      });
  },
});

export const { resetCreateState } = createUserSlice.actions;
export default createUserSlice.reducer;

// Selectors so that CreateUser.jsx can do:
//    const createLoading = useSelector(selectCreateLoading);
export const selectCreateLoading = (state) => state.createUser.createLoading;
export const selectCreateError = (state) => state.createUser.createError;
export const selectCreateSuccess = (state) => state.createUser.createSuccess;
