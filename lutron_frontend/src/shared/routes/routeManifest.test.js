/** Phase 5.1 — route manifest sanity checks */
import {
  ROUTE_MANIFEST,
  VARIANT_ROUTE_DIFFS,
  getSharedRoutes,
  getVariantOnlyRoutes,
} from "./routeManifest";

describe("routeManifest", () => {
  test("includes core public and dashboard paths", () => {
    const paths = ROUTE_MANIFEST.map((r) => r.path);
    expect(paths).toContain("/login");
    expect(paths).toContain("/dashboard/energy");
    expect(paths).toContain("/fofp");
  });

  test("variant diffs document widget settings paths", () => {
    expect(VARIANT_ROUTE_DIFFS.widgetSettings.basic).toBe("/rename-widget/");
    expect(VARIANT_ROUTE_DIFFS.widgetSettings.customized).toBe("/widgets/");
  });

  test("shared routes exist in all variants", () => {
    const shared = getSharedRoutes();
    expect(shared.length).toBeGreaterThan(20);
    shared.forEach((r) => {
      expect(r.basic && r.advanced && r.customized).toBe(true);
    });
  });

  test("customized-only paths are flagged", () => {
    const only = getVariantOnlyRoutes("customized");
    const widgets = only.find((r) => r.path === "/widgets/");
    expect(widgets).toBeDefined();
  });
});
