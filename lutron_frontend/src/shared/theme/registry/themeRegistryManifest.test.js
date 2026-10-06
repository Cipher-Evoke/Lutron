import fs from "fs";
import path from "path";

import {
  THEME_REGISTRY_CATEGORIES,
  THEME_REGISTRY_ENTRIES,
  THEME_REGISTRY_PRESETS,
  THEME_REGISTRY_WRITERS,
  getAllRegistryVariableNames,
  getRegistryWriterVariableNames,
  getVariableOwners,
  getVariablesByCategory,
  getVariablesByPreset,
  validateThemeRegistryManifest,
} from "./themeRegistryManifest";

/** Phase 4.3 audit baseline; live scan finds additional premium dynamic keys. */
export const THEME_REGISTRY_AUDIT_BASELINE_COUNT = 243;

/** Writer variables detected from the six preset/token source files. */
export const THEME_REGISTRY_WRITER_VARIABLE_COUNT = getRegistryWriterVariableNames().length;

function readWriterFile(relativePath) {
  return fs.readFileSync(
    path.join(__dirname, "../../../..", relativePath),
    "utf8"
  );
}

function extractWriterVarsFromSource(content, writerName) {
  const vars = new Set();
  const quotedSetProperty = /setProperty\s*\(\s*['"]--([^'"]+)['"]/g;
  let match;
  while ((match = quotedSetProperty.exec(content))) {
    vars.add(match[1]);
  }
  if (writerName === "premiumThemeTokens.js") {
    const premiumKeys = /['"]--((?:premium|topbar-nav-pill-shadow)[^'"]*)['"]/g;
    while ((match = premiumKeys.exec(content))) {
      vars.add(match[1]);
    }
  }
  return vars;
}

const LIVE_WRITER_FILES = [
  ["dynamicThemeTokens.js", "src/variants/advanced/utils/dynamicThemeTokens.js"],
  ["theme3PageChrome.js", "src/variants/advanced/utils/theme3PageChrome.js"],
  ["premiumThemeTokens.js", "src/shared/theme/registry/premiumThemeTokens.js"],
  ["dashboardChartChrome.js", "src/shared/theme/registry/dashboardChartChrome.js"],
  ["settingsSidebarTabStyles.js", "src/shared/theme/registry/settingsSidebarTabStyles.js"],
  ["gold.js", "src/shared/theme/registry/presets/gold.js"],
  ["theme3.js", "src/shared/theme/registry/presets/theme3.js"],
  ["theme4.js", "src/shared/theme/registry/presets/theme4.js"],
  ["defaultSlate.js", "src/shared/theme/registry/presets/defaultSlate.js"],
  ["applyAdvancedCssVariables.js", "src/shared/theme/registry/applyAdvancedCssVariables.js"],
];

function buildLiveWriterMap() {
  const map = {};
  for (const [writerName, relativePath] of LIVE_WRITER_FILES) {
    const content = readWriterFile(relativePath);
    for (const variable of extractWriterVarsFromSource(content, writerName)) {
      if (!map[variable]) map[variable] = [];
      if (!map[variable].includes(writerName)) map[variable].push(writerName);
    }
  }
  return map;
}

describe("themeRegistryManifest", () => {
  test("validateThemeRegistryManifest passes", () => {
    const result = validateThemeRegistryManifest();
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test("accounts for at least the Phase 4.3 audit baseline of 243 variables", () => {
    expect(THEME_REGISTRY_ENTRIES.length).toBeGreaterThanOrEqual(
      THEME_REGISTRY_AUDIT_BASELINE_COUNT
    );
    expect(THEME_REGISTRY_WRITER_VARIABLE_COUNT).toBeGreaterThanOrEqual(
      THEME_REGISTRY_AUDIT_BASELINE_COUNT
    );
  });

  test("has no duplicate registry entries", () => {
    const names = getAllRegistryVariableNames();
    expect(new Set(names).size).toBe(names.length);
    expect(names.length).toBe(THEME_REGISTRY_ENTRIES.length);
  });

  test("all registry writers are represented", () => {
    for (const writer of THEME_REGISTRY_WRITERS) {
      const covered = THEME_REGISTRY_ENTRIES.some((entry) =>
        entry.writers.includes(writer)
      );
      expect(covered).toBe(true);
    }
  });

  test("live writer scan matches manifest writer assignments", () => {
    const liveMap = buildLiveWriterMap();
    const liveVars = Object.keys(liveMap).sort();

    expect(liveVars.length).toBe(THEME_REGISTRY_WRITER_VARIABLE_COUNT);

    for (const variable of liveVars) {
      const entry = getVariableOwners(variable);
      expect(entry).toBeDefined();
      expect(entry.writers.sort()).toEqual(liveMap[variable].sort());
    }
  });

  test("getVariablesByCategory covers every category", () => {
    for (const category of THEME_REGISTRY_CATEGORIES) {
      const entries = getVariablesByCategory(category);
      expect(Array.isArray(entries)).toBe(true);
      for (const entry of entries) {
        expect(entry.category).toBe(category);
      }
    }

    const categorized = THEME_REGISTRY_CATEGORIES.flatMap((category) =>
      getVariablesByCategory(category)
    );
    expect(categorized.length).toBe(THEME_REGISTRY_ENTRIES.length);
  });

  test("getVariablesByPreset covers every preset bucket", () => {
    for (const preset of THEME_REGISTRY_PRESETS) {
      const entries = getVariablesByPreset(preset);
      expect(Array.isArray(entries)).toBe(true);
      for (const entry of entries) {
        expect(entry.presetOwners).toContain(preset);
      }
    }
  });

  test("snapshot: category distribution", () => {
    const distribution = Object.fromEntries(
      THEME_REGISTRY_CATEGORIES.map((category) => [
        category,
        getVariablesByCategory(category).length,
      ])
    );
    expect(distribution).toMatchInlineSnapshot(`
Object {
  "activityReport": 14,
  "alerts": 27,
  "background": 24,
  "charts": 6,
  "core": 10,
  "dashboard": 18,
  "heatmap": 33,
  "navigation": 11,
  "premium": 13,
  "schedule": 30,
  "settings": 34,
  "typography": 9,
  "users": 26,
}
`);
  });

  test("snapshot: registry metadata constants", () => {
    expect(THEME_REGISTRY_CATEGORIES).toMatchInlineSnapshot(`
Array [
  "core",
  "background",
  "navigation",
  "settings",
  "dashboard",
  "charts",
  "heatmap",
  "schedule",
  "users",
  "alerts",
  "activityReport",
  "premium",
  "typography",
]
`);
    expect(THEME_REGISTRY_WRITERS).toMatchInlineSnapshot(`
Array [
  "applyAdvancedCssVariables.js",
  "dynamicThemeTokens.js",
  "theme3PageChrome.js",
  "premiumThemeTokens.js",
  "dashboardChartChrome.js",
  "settingsSidebarTabStyles.js",
  "gold.js",
  "theme3.js",
  "theme4.js",
  "defaultSlate.js",
]
`);
    expect(THEME_REGISTRY_WRITER_VARIABLE_COUNT).toMatchInlineSnapshot(`253`);
    expect(THEME_REGISTRY_ENTRIES.length).toMatchInlineSnapshot(`255`);
  });

  test("detects duplicate semantic writers across presets", () => {
    const multiWriter = THEME_REGISTRY_ENTRIES.filter(
      (entry) => entry.writers.length > 1
    );
    expect(multiWriter.length).toBeGreaterThan(0);
    expect(multiWriter.map((entry) => entry.variable).slice(0, 5)).toMatchInlineSnapshot(`
Array [
  "activity-report-chip-border",
  "activity-report-filter-field-bg",
  "activity-report-filter-field-border",
  "activity-report-page-disabled-text",
  "activity-report-page-muted-text",
]
`);
  });
});
