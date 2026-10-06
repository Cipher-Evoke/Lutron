import {
  GOLD_BACKGROUND_ANCHOR,
  THEME_3_BACKGROUND_ANCHOR,
  THEME_4_BACKGROUND_ANCHOR,
} from "../../../../variants/advanced/config/themeConstants";
import { applyAdvancedCssVariables } from "../applyAdvancedCssVariables";
import { getVariableOwners } from "../themeRegistryManifest";
import {
  applyDefaultSlatePreset,
  applyTheme3Preset,
  getDefaultSlatePresetVariableNames,
  getGoldPresetVariableNames,
  getTheme3PresetVariableNames,
  getTheme4PresetVariableNames,
} from "./index";
import { validateAllPresetVariables } from "../validatePresetVariables";

function captureInlineCssVars(element = document.documentElement) {
  const style = element.style;
  const result = {};
  for (let i = 0; i < style.length; i += 1) {
    const name = style[i];
    if (name.startsWith("--")) {
      result[name] = style.getPropertyValue(name);
    }
  }
  return Object.fromEntries(
    Object.entries(result).sort(([a], [b]) => a.localeCompare(b))
  );
}

function captureHtmlClasses(element = document.documentElement) {
  return [...element.classList].sort();
}

function resetDocumentThemeState() {
  const root = document.documentElement;
  const style = root.style;
  while (style.length > 0) {
    style.removeProperty(style[0]);
  }
  root.classList.remove(
    "gold-theme",
    "theme-3-page",
    "theme-4-page",
    "custom-theme"
  );
}

const DEFAULT_UI = {
  background: "#6f809d",
  content: "#3d4a5c",
  button: "#232323",
};

function createMockRoot() {
  const store = {};
  return {
    style: {
      setProperty: (name, value) => {
        store[name] = value;
      },
      removeProperty: (name) => {
        delete store[name];
      },
    },
    __store: store,
  };
}

function captureMockRootVars(root) {
  return Object.fromEntries(
    Object.entries(root.__store).sort(([a], [b]) => a.localeCompare(b))
  );
}

describe("preset module extraction (Phase 4.3B/4.3C)", () => {
  beforeEach(() => {
    resetDocumentThemeState();
  });

  test("all extracted preset variables exist in registry manifest", () => {
    const result = validateAllPresetVariables({
      gold: getGoldPresetVariableNames(),
      theme3: getTheme3PresetVariableNames(),
      theme4: getTheme4PresetVariableNames(),
      default: getDefaultSlatePresetVariableNames(),
    });
    expect(result.valid).toBe(true);
    expect(result.orphans).toEqual([]);
  });

  test("snapshot: gold preset CSS output parity", () => {
    applyAdvancedCssVariables(
      {
        background: GOLD_BACKGROUND_ANCHOR,
        content: "#3d4a5c",
        button: "#232323",
      },
      "/assets/defaultBg.png"
    );

    const vars = captureInlineCssVars();
    const classes = captureHtmlClasses();

    expect(classes).toEqual(["gold-theme"]);
    expect(vars["--app-background"]).toBe("#E6C84C");
    expect(vars["--settings-panel-inner-bg"]).toBeTruthy();
    expect(vars["--heatmap-tab-pill-bg"]).toBeTruthy();
    expect(vars["--premium-radius-sm"]).toBe("8px");
    expect(Object.keys(vars).length).toMatchInlineSnapshot(`249`);
    expect(vars).toMatchSnapshot();
  });

  test("snapshot: theme4 preset CSS output parity", () => {
    applyAdvancedCssVariables(
      {
        background: THEME_4_BACKGROUND_ANCHOR,
        content: "#3d4a5c",
        button: "#232323",
      },
      "/assets/defaultBg.png"
    );

    const vars = captureInlineCssVars();
    const classes = captureHtmlClasses();

    expect(classes).toEqual(["theme-4-page"]);
    expect(vars["--app-background"]).toBe("#A89773");
    expect(vars["--settings-panel-inner-bg"]).toBeTruthy();
    expect(vars["--heatmap-tab-pill-bg"]).toBeTruthy();
    expect(vars["--premium-radius-sm"]).toBe("8px");
    expect(Object.keys(vars).length).toMatchInlineSnapshot(`239`);
    expect(vars).toMatchSnapshot();
  });

  test("theme3 inline preset variables exist in registry manifest", () => {
    for (const variable of getTheme3PresetVariableNames()) {
      expect(getVariableOwners(variable)).toBeDefined();
    }
  });

  test("snapshot: theme3 preset module inline output", () => {
    const root = createMockRoot();
    applyTheme3Preset(root);
    const vars = captureMockRootVars(root);
    expect(Object.keys(vars).length).toBe(20);
    expect(vars).toMatchSnapshot();
  });

  test("snapshot: theme3 full orchestrator CSS output parity", () => {
    applyAdvancedCssVariables(
      {
        background: THEME_3_BACKGROUND_ANCHOR,
        content: "#3d4a5c",
        button: "#232323",
      },
      "/assets/defaultBg.png"
    );

    const vars = captureInlineCssVars();
    const classes = captureHtmlClasses();

    expect(classes).toEqual(["theme-3-page"]);
    expect(vars["--app-background"]).toBe("#58687B");
    expect(vars["--settings-panel-inner-bg"]).toBeTruthy();
    expect(vars["--heatmap-tab-pill-bg"]).toBeTruthy();
    expect(vars["--premium-radius-sm"]).toBe("8px");
    expect(vars["--settings-theme-pill-active-bg"]).toBeTruthy();
    expect(vars).toMatchSnapshot();
  });

  test("snapshot: default slate preset CSS output parity", () => {
    const root = createMockRoot();
    applyDefaultSlatePreset(root, { stage: "navigation-none" });
    applyDefaultSlatePreset(root, {
      stage: "surface",
      fixedGradientPageTheme: null,
      isTheme4Page: false,
      customImageUrl: null,
    });
    applyDefaultSlatePreset(root, { stage: "heatmap" });

    const vars = captureMockRootVars(root);
    expect(vars["--settings-panel-inner-bg"]).toBe("#ffffff");
    expect(vars["--heatmap-tab-pill-bg"]).toBe("#3d4a5c");
    expect(Object.keys(vars).length).toMatchInlineSnapshot(`138`);
    expect(vars).toMatchSnapshot();
  });
});
