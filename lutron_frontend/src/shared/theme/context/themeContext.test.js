import { createNormalizeUiColors } from "./normalizeUiColors";
import {
  rawBackgroundResolvers,
  createNormalizedBackgroundResolvers,
} from "./backgroundResolvers";
import { createThemeContextDefaultValue } from "./ThemeContext";

describe("createNormalizeUiColors", () => {
  const normalize = createNormalizeUiColors({
    background: "#ffffff",
    content: "#f5f5f5",
    button: "#232323",
    error: "#d32f2f",
  });

  test("applies configured defaults", () => {
    expect(normalize({})).toEqual({
      background: "#ffffff",
      content: "#f5f5f5",
      button: "#232323",
      error: "#d32f2f",
    });
  });

  test("preserves provided values", () => {
    expect(
      normalize({
        background: "#111111",
        content: "#222222",
        button: "#333333",
        error: "#444444",
      })
    ).toEqual({
      background: "#111111",
      content: "#222222",
      button: "#333333",
      error: "#444444",
    });
  });
});

describe("rawBackgroundResolvers", () => {
  test("fromApi returns empty string for blank values", () => {
    expect(rawBackgroundResolvers.fromApi("")).toBe("");
    expect(rawBackgroundResolvers.fromApi("   ")).toBe("");
    expect(rawBackgroundResolvers.fromApi(null)).toBe("");
  });

  test("fromApi preserves non-empty paths", () => {
    expect(rawBackgroundResolvers.fromApi("/bg.png")).toBe("/bg.png");
  });

  test("onReload keeps current when bgImage undefined", () => {
    expect(rawBackgroundResolvers.onReload(undefined, "/current.png")).toBe(
      "/current.png"
    );
  });

  test("onReload clears on null or empty", () => {
    expect(rawBackgroundResolvers.onReload(null, "/current.png")).toBe("");
    expect(rawBackgroundResolvers.onReload("", "/current.png")).toBe("");
  });

  test("onReload uses raw path when provided", () => {
    expect(rawBackgroundResolvers.onReload("/new.png", "/current.png")).toBe(
      "/new.png"
    );
  });
});

describe("createNormalizedBackgroundResolvers", () => {
  const normalize = (url) => url.replace("default@g", "defaultBg");
  const resolvers = createNormalizedBackgroundResolvers(normalize);

  test("fromApi normalizes non-empty API paths", () => {
    expect(resolvers.fromApi("/assets/default@g.png")).toBe(
      "/assets/defaultBg.png"
    );
    expect(resolvers.fromApi("")).toBe("");
  });

  test("onReload normalizes new paths", () => {
    expect(resolvers.onReload("/assets/default@g.png", "")).toBe(
      "/assets/defaultBg.png"
    );
  });
});

describe("createThemeContextDefaultValue", () => {
  test("returns shared context shape", () => {
    const value = createThemeContextDefaultValue("/assets/defaultBg.png");
    expect(value.theme).toBeNull();
    expect(value.backgroundImage).toBe("/assets/defaultBg.png");
    expect(typeof value.reloadTheme).toBe("function");
  });
});
