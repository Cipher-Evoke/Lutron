import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { MemoryRouter } from "react-router-dom";

import alertsDisplayReducer from "../../../redux/slice/settingsslice/alerts/alertsDisplaySlice";

// Mock API module used by thunks.
const mockGet = jest.fn();
const mockPost = jest.fn();
jest.mock("../../../BaseUrl", () => ({
  BaseUrl: {
    get: (...args) => mockGet(...args),
    post: (...args) => mockPost(...args),
  },
}));

// Mock auth + sidebar so the test focuses on the toggle flow.
jest.mock("../../../customhooks/UseAuth", () => ({
  UseAuth: () => ({ role: "Superadmin" }),
  getVisibleSidebarItemsWithPaths: () => [],
}));

import AlertsComponent from "./AlertsComponent";

const renderWithStore = (preloadedState = {}) => {
  const store = configureStore({
    reducer: {
      alertsDisplay: alertsDisplayReducer,
    },
    preloadedState,
  });

  return render(
    <Provider store={store}>
      <ThemeProvider theme={createTheme()}>
        <MemoryRouter initialEntries={["/alerts"]}>
          <AlertsComponent />
        </MemoryRouter>
      </ThemeProvider>
    </Provider>
  );
};

beforeEach(() => {
  localStorage.setItem("lutron", "test-token");
  mockGet.mockReset();
  mockPost.mockReset();
});

test("loads 5 alert switches on mount", async () => {
  mockGet.mockResolvedValueOnce({
    data: {
      toggles: [
        { alert_type: "Processor Not Responding", display: true },
        { alert_type: "Device Not Responding", display: true },
        { alert_type: "Ballast Failure", display: false },
        { alert_type: "Lamp Failure", display: true },
        { alert_type: "Other Warnings", display: false },
      ],
    },
  });

  renderWithStore();

  // The toggles are rendered after the thunk resolves.
  await expect(screen.findByRole("checkbox", { name: "Processor Not Responding" })).resolves.toBeDefined();

  // Check the presence + state of each switch.
  expect(screen.getByRole("checkbox", { name: "Processor Not Responding" })).toBeChecked();
  expect(screen.getByRole("checkbox", { name: "Device Not Responding" })).toBeChecked();
  expect(screen.getByRole("checkbox", { name: "Ballast Failure" })).not.toBeChecked();
  expect(screen.getByRole("checkbox", { name: "Lamp Failure" })).toBeChecked();
  expect(screen.getByRole("checkbox", { name: "Other Warnings" })).not.toBeChecked();
});

test("toggling a switch calls disable_alerts then refreshes display status", async () => {
  // Initial GET
  mockGet.mockResolvedValueOnce({
    data: {
      toggles: [
        { alert_type: "Processor Not Responding", display: true },
        { alert_type: "Device Not Responding", display: true },
        { alert_type: "Ballast Failure", display: true },
        { alert_type: "Lamp Failure", display: true },
        { alert_type: "Other Warnings", display: true },
      ],
    },
  });

  // POST success
  mockPost.mockResolvedValueOnce({
    data: { status: "success" },
  });

  // Refresh GET after POST
  mockGet.mockResolvedValueOnce({
    data: {
      toggles: [
        { alert_type: "Processor Not Responding", display: true },
        { alert_type: "Device Not Responding", display: true },
        { alert_type: "Ballast Failure", display: false },
        { alert_type: "Lamp Failure", display: true },
        { alert_type: "Other Warnings", display: true },
      ],
    },
  });

  renderWithStore();

  // Wait for initial load.
  const ballastSwitch = await screen.findByRole("checkbox", { name: "Ballast Failure" });
  expect(ballastSwitch).toBeChecked();

  // Turn it off (checked -> false).
  fireEvent.click(ballastSwitch);

  await waitFor(() => {
    expect(mockPost).toHaveBeenCalledTimes(1);
  });

  // The component sends the canonical alert type string.
  expect(mockPost).toHaveBeenCalledWith(
    "/settings/disable_alerts",
    { alert_type: "Ballast Failure", display: false },
    expect.objectContaining({ headers: expect.any(Object) })
  );

  // After POST, component should refresh by calling GET again.
  await waitFor(() => {
    expect(mockGet).toHaveBeenCalledTimes(2);
  });

  // The UI state should reflect the refreshed toggles.
  await waitFor(() => {
    expect(screen.getByRole("checkbox", { name: "Ballast Failure" })).not.toBeChecked();
  });
});

test("turning a switch On calls disable_alerts with display:true then refreshes", async () => {
  // Initial GET: Ballast Failure is Off (display:false).
  mockGet.mockResolvedValueOnce({
    data: {
      toggles: [
        { alert_type: "Processor Not Responding", display: true },
        { alert_type: "Device Not Responding", display: true },
        { alert_type: "Ballast Failure", display: false },
        { alert_type: "Lamp Failure", display: true },
        { alert_type: "Other Warnings", display: true },
      ],
    },
  });

  // POST success (expect display:true for turning On).
  mockPost.mockResolvedValueOnce({
    data: { status: "success" },
  });

  // Refresh GET after POST: Ballast Failure becomes On.
  mockGet.mockResolvedValueOnce({
    data: {
      toggles: [
        { alert_type: "Processor Not Responding", display: true },
        { alert_type: "Device Not Responding", display: true },
        { alert_type: "Ballast Failure", display: true },
        { alert_type: "Lamp Failure", display: true },
        { alert_type: "Other Warnings", display: true },
      ],
    },
  });

  renderWithStore();

  const ballastSwitch = await screen.findByRole("checkbox", { name: "Ballast Failure" });
  expect(ballastSwitch).not.toBeChecked();

  // Turn it on (checked:false -> true).
  fireEvent.click(ballastSwitch);

  await waitFor(() => {
    expect(mockPost).toHaveBeenCalledTimes(1);
  });

  expect(mockPost).toHaveBeenCalledWith(
    "/settings/disable_alerts",
    { alert_type: "Ballast Failure", display: true },
    expect.objectContaining({ headers: expect.any(Object) })
  );

  await waitFor(() => {
    expect(screen.getByRole("checkbox", { name: "Ballast Failure" })).toBeChecked();
  });
});

