import {
  bindUsersSettingsModule,
  getUsersSettingsBindings,
  resetUsersSettingsBindingsForTests,
} from "./users/bindUsersSettingsModule";
import {
  bindScheduleSettingsModule,
  getScheduleSettingsBindings,
  resetScheduleSettingsBindingsForTests,
} from "./schedule/bindScheduleSettingsModule";

describe("settings binding modules", () => {
  afterEach(() => {
    resetUsersSettingsBindingsForTests();
    resetScheduleSettingsBindingsForTests();
  });

  it("requires users bindings before access", () => {
    expect(() => getUsersSettingsBindings()).toThrow(/bindUsersSettingsModule/);
    bindUsersSettingsModule({ usersSlice: { fetchUsers: jest.fn() } });
    expect(getUsersSettingsBindings().usersSlice.fetchUsers).toBeDefined();
  });

  it("requires schedule bindings before access", () => {
    expect(() => getScheduleSettingsBindings()).toThrow(/bindScheduleSettingsModule/);
    bindScheduleSettingsModule({ scheduleSlice: { fetchSchedules: jest.fn() } });
    expect(getScheduleSettingsBindings().scheduleSlice.fetchSchedules).toBeDefined();
  });
});
