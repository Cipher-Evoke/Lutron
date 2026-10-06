/**
 * @jest-environment node
 */

import { isPathActive } from "./SettingsLayout";

describe("SettingsLayout isPathActive", () => {
  it("ignores trailing slashes", () => {
    expect(isPathActive("/processors/", "/processors")).toBe(true);
  });

  it("does not match unrelated paths", () => {
    expect(isPathActive("/processors", "/theme-change")).toBe(false);
  });
});
