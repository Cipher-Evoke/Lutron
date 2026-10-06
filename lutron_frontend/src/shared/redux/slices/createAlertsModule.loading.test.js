/**
 * @jest-environment node
 */
import { configureStore } from "@reduxjs/toolkit";
import { createAlertsModule } from "./createAlertsModule";

function mockBaseUrl(impl) {
  return {
    get: jest.fn(impl),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  };
}

describe("createAlertsModule loading", () => {
  test("first visit empty list sets loadingAlerts", () => {
    const BaseUrl = mockBaseUrl(() => new Promise(() => {}));
    const mod = createAlertsModule({ BaseUrl });
    const store = configureStore({ reducer: { alerts: mod.reducer } });
    store.dispatch(mod.fetchActiveAlerts());
    const state = store.getState();
    expect(state.alerts.loadingAlerts).toBe(true);
    expect(mod.selectAlertsLoading(state)).toBe(true);
  });

  test("refresh with existing rows does not flash loading", async () => {
    let resolveGet;
    const BaseUrl = mockBaseUrl(
      () =>
        new Promise((resolve) => {
          resolveGet = resolve;
        })
    );
    const mod = createAlertsModule({ BaseUrl });
    const store = configureStore({ reducer: { alerts: mod.reducer } });

    store.dispatch({
      type: mod.fetchActiveAlerts.fulfilled.type,
      payload: [{ alert_type: "Ballast Failure", device_name: "C16" }],
    });
    expect(store.getState().alerts.alerts).toHaveLength(1);
    expect(mod.selectAlertsLoading(store.getState())).toBe(false);

    const pending = store.dispatch(mod.fetchActiveAlerts());
    const mid = store.getState();
    expect(mid.alerts.alerts).toHaveLength(1);
    expect(mid.alerts.loadingAlerts).toBe(false);
    expect(mod.selectAlertsLoading(mid)).toBe(false);

    resolveGet({ data: { alerts: [{ alert_type: "Ballast Failure", device_name: "C16" }] } });
    await pending;
    expect(store.getState().alerts.alerts).toHaveLength(1);
  });

  test("rejected keeps previous rows", async () => {
    const BaseUrl = mockBaseUrl(() => Promise.reject(new Error("net")));
    const mod = createAlertsModule({ BaseUrl });
    const store = configureStore({ reducer: { alerts: mod.reducer } });
    store.dispatch({
      type: mod.fetchActiveAlerts.fulfilled.type,
      payload: [{ alert_type: "Lamp Failure" }],
    });
    await store.dispatch(mod.fetchActiveAlerts());
    expect(store.getState().alerts.alerts).toHaveLength(1);
    expect(store.getState().alerts.alerts[0].alert_type).toBe("Lamp Failure");
  });

  test("selectAlertsLoading does not OR loadingTypes", () => {
    const mod = createAlertsModule({ BaseUrl: mockBaseUrl() });
    const state = {
      alerts: {
        alerts: [{ alert_type: "Ballast Failure" }],
        loadingAlerts: false,
        loadingTypes: true,
      },
    };
    expect(mod.selectAlertsLoading(state)).toBe(false);
    expect(mod.isAlertsTableLoading(state)).toBe(false);
  });
});
