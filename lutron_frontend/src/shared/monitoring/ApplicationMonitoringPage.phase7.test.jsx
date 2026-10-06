import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

const mockGetStatus = jest.fn();
const mockSetStatus = jest.fn();
const mockGetConnectivity = jest.fn();
const mockGetIssues = jest.fn();
const mockGetResources = jest.fn();
const mockGetSummary = jest.fn();
const mockGetAlerts = jest.fn();

const mockGetOpsOverview = jest.fn();

jest.mock("./monitoringApi", () => ({
  createMonitoringApi: () => ({
    getStatus: (...args) => mockGetStatus(...args),
    setStatus: (...args) => mockSetStatus(...args),
    getConnectivity: (...args) => mockGetConnectivity(...args),
    getIssues: (...args) => mockGetIssues(...args),
    getResources: (...args) => mockGetResources(...args),
    getSummary: (...args) => mockGetSummary(...args),
    getAlerts: (...args) => mockGetAlerts(...args),
    getOpsOverview: (...args) => mockGetOpsOverview(...args),
  }),
  getMonitoringErrorDetail: (error) => ({
    status: error?.response?.status,
    detail: error?.response?.data?.detail || error?.message || "error",
  }),
  isMonitoringDisabledError: (error) =>
    error?.response?.status === 503 &&
    String(error?.response?.data?.detail || "")
      .toLowerCase()
      .includes("monitoring is disabled"),
}));

import ApplicationMonitoringPage from "./ApplicationMonitoringPage";

describe("Phase 7 Monitoring toggle UI", () => {
  beforeEach(() => {
    mockGetStatus.mockResolvedValue({
      data: {
        enabled: true,
        monitoring_enabled: true,
        source: "installation_settings",
        writable: true,
        environment_enabled: true,
        configured_enabled: true,
        settings_available: true,
        flags: {},
        service: { running: true },
      },
    });
    mockGetConnectivity.mockResolvedValue({ data: { processors: [] } });
    mockGetIssues.mockResolvedValue({ data: { items: [], total: 0 } });
    mockGetResources.mockResolvedValue({
      data: { available: true, processes: [] },
    });
    mockGetOpsOverview.mockResolvedValue({
      data: {
        snapshot: { missed_snapshots: 0, duration_trend_ms: [] },
        bootstrap: { mapped_zones: 6087, expected_zones: 6087, complete: true, orphans: 0 },
        processors: { processors: [], healthy_count: 0, warning_count: 0, stale_count: 0 },
        gapfill: { status: "idle", backlog_hours: 0 },
        runtime: { process_health: {}, scheduler: { active_jobs: [] } },
        database: { connection_count: 0 },
      },
    });
    mockSetStatus.mockResolvedValue({
      data: {
        enabled: false,
        monitoring_enabled: false,
        source: "installation_settings",
        writable: true,
        environment_enabled: true,
        configured_enabled: false,
        settings_available: true,
        flags: {},
        service: { running: true },
      },
    });
  });

  test("renders ON and calls PATCH on toggle", async () => {
    render(<ApplicationMonitoringPage BaseUrl={{ get: jest.fn(), patch: jest.fn() }} />);
    expect(await screen.findByText("ON")).toBeInTheDocument();
    expect(mockGetStatus).toHaveBeenCalled();
    expect(screen.getByLabelText("Monitoring enabled")).toBeEnabled();
    fireEvent.click(screen.getByLabelText("Monitoring enabled"));
    await waitFor(() => expect(mockSetStatus).toHaveBeenCalledWith(false));
  });

  test("environment-forced OFF disables control", async () => {
    mockGetStatus.mockResolvedValue({
      data: {
        enabled: false,
        monitoring_enabled: false,
        source: "environment",
        writable: false,
        environment_enabled: false,
        configured_enabled: true,
        settings_available: true,
        flags: {},
        service: { running: false },
      },
    });
    mockGetConnectivity.mockRejectedValue({
      response: { status: 503, data: { detail: "Monitoring is disabled" } },
    });
    mockGetIssues.mockRejectedValue({
      response: { status: 503, data: { detail: "Monitoring is disabled" } },
    });
    mockGetResources.mockRejectedValue({
      response: { status: 503, data: { detail: "Monitoring is disabled" } },
    });
    render(<ApplicationMonitoringPage BaseUrl={{ get: jest.fn() }} />);
    expect(await screen.findByText("OFF")).toBeInTheDocument();
    expect(screen.getByLabelText("Monitoring enabled")).toBeDisabled();
    expect(screen.getByText(/Controlled by environment/i)).toBeInTheDocument();
    expect(screen.getByText(/Auto refresh \(30s\)/i)).toBeInTheDocument();
  });

  test("status GET failure does not invent OFF", async () => {
    mockGetStatus.mockRejectedValue({
      response: { status: 500, data: { detail: "status boom" } },
    });
    render(<ApplicationMonitoringPage BaseUrl={{ get: jest.fn() }} />);
    expect(await screen.findByText(/Monitoring status unavailable/i)).toBeInTheDocument();
    expect(screen.queryByText(/^OFF$/)).not.toBeInTheDocument();
  });

  test("PATCH failure keeps prior ON state after refresh", async () => {
    mockSetStatus.mockRejectedValue({
      response: { status: 409, data: { detail: "environment override" } },
    });
    render(<ApplicationMonitoringPage BaseUrl={{ get: jest.fn() }} />);
    expect(await screen.findByText("ON")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Monitoring enabled"));
    expect(await screen.findByText(/environment override/i)).toBeInTheDocument();
    expect(screen.getByText("ON")).toBeInTheDocument();
  });
});
