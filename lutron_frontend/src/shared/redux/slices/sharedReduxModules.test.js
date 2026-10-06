/**
 * Phase 5.1 — shared redux slice parity tests
 */
jest.mock("sweetalert2", () => ({
  __esModule: true,
  default: {
    fire: jest.fn(),
    mixin: jest.fn(),
  },
}));

import { createAlertsModule } from "./createAlertsModule";
import { createHomeModule } from "./createHomeModule";
import { createModulesModule } from "./createModulesModule";
import { createSensorsModule } from "./createSensorsModule";
import { createQuickControlModule } from "./createQuickControlModule";
import { createUserLoginModule } from "./createUserLoginModule";
import { createFofpModule } from "./createFofpModule";
import { createFloorModule } from "./createFloorModule";
import { createAreaSettingsModule } from "./createAreaSettingsModule";

const noop = () => ({ type: "noop" });

function mockBaseUrl() {
  return {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  };
}

describe("Phase 5.1 shared redux modules", () => {
  test("createAlertsModule preserves slice name and action types", () => {
    const mod = createAlertsModule({ BaseUrl: mockBaseUrl() });
    expect(mod.fetchAlertTypes).toBeDefined();
    expect(mod.fetchAlertTypes.pending.type).toBe("alerts/fetchAlertTypes/pending");
    expect(mod.clearAlertsState).toBeDefined();
    expect(typeof mod.reducer).toBe("function");
    expect(mod.reducer(undefined, { type: "@@INIT" })).toMatchObject({
      types: [],
      alerts: [],
      loadingTypes: false,
    });
  });

  test("createHomeModule preserves thunk names", () => {
    const mod = createHomeModule({ BaseUrl: mockBaseUrl() });
    expect(mod.getLutronData.pending.type).toBe("getLutronData/pending");
    expect(mod.getDashboardOverview.pending.type).toBe("home/getDashboardOverview/pending");
    expect(mod.clearSaveError).toBeDefined();
  });

  test("createModulesModule preserves action names", () => {
    const mod = createModulesModule({ BaseUrl: mockBaseUrl() });
    expect(mod.fetchModules.pending.type).toBe("modules/fetchModules/pending");
    expect(mod.resetModulesState).toBeDefined();
  });

  test("createSensorsModule preserves action names", () => {
    const mod = createSensorsModule({ BaseUrl: mockBaseUrl() });
    expect(mod.fetchSensors.pending.type).toBe("sensors/fetchSensors/pending");
    expect(mod.discoverSensors.pending.type).toBe("sensors/discoverSensors/pending");
  });

  test("createQuickControlModule preserves action names", () => {
    const mod = createQuickControlModule({ BaseUrl: mockBaseUrl() });
    expect(mod.fetchQuickControls.pending.type).toBe("quickControl/fetchQuickControls/pending");
    expect(mod.clearSelectedControl).toBeDefined();
  });

  test("createUserLoginModule preserves auth action types", () => {
    const mod = createUserLoginModule({
      BaseUrl: mockBaseUrl(),
      clearDashboardData: noop,
      clearHeatmapUserData: noop,
      clearAlertsState: noop,
    });
    expect(mod.signIn.pending.type).toBe("user/signIn/pending");
    expect(mod.fetchProfile.pending.type).toBe("user/fetchProfile/pending");
    expect(mod.logout.pending.type).toBe("user/logout/pending");
    expect(mod.changePassword.pending.type).toBe("user/changePassword/pending");
    expect(mod.resetChangePasswordState).toBeDefined();
  });

  test("createFofpModule exposes reducer", () => {
    const mod = createFofpModule({ BaseUrl: mockBaseUrl() });
    expect(typeof mod.reducer).toBe("function");
  });

  test("createFloorModule exposes floor thunks", () => {
    const base = mockBaseUrl();
    const mod = createFloorModule({
      BaseUrl: base,
      fetchAreaOccupancyStatus: noop,
      fetchAreaEnergyConsumption: noop,
      includeFloorIdInFetchDetails: false,
    });
    expect(mod.fetchSingleFloor).toBeDefined();
    expect(mod.fetchFloors.pending.type).toBe("floors/fetchFloors/pending");
  });

  test("createAreaSettingsModule exposes reducer and selectors", () => {
    const mod = createAreaSettingsModule({ BaseUrl: mockBaseUrl() });
    expect(typeof mod.reducer).toBe("function");
    expect(mod.fetchOccupancyMode).toBeDefined();
  });
});
