import { configureStore } from "@reduxjs/toolkit";
import {
  isLightSurface,
  onContentColors,
  isWhiteAreaPickerChrome,
  DEFAULT_APP_CONTENT,
} from "./themeOnSurface";
import {
  isGoldApplicationTheme,
  PRODUCT_DEFAULT_APP_BACKGROUND,
} from "./themeOnSurfaceAdvanced";
import {
  normalizeBackgroundPath,
  resolveAuthPageBackgroundUrl,
  pickThemeBackgroundImage,
  DEFAULT_PUBLIC_BG,
} from "./themeBackgroundImage";

describe("themeOnSurface", () => {
  test("isLightSurface detects white as light", () => {
    expect(isLightSurface("#ffffff")).toBe(true);
    expect(isLightSurface("#f5f5f5")).toBe(true);
  });

  test("isLightSurface detects dark surfaces", () => {
    expect(isLightSurface("#232323")).toBe(false);
    expect(isLightSurface("#3d4a5c")).toBe(false);
  });

  test("onContentColors returns dark text on light surface", () => {
    const colors = onContentColors("#ffffff");
    expect(colors.isLight).toBe(true);
    expect(colors.primary).toBe("rgba(0, 0, 0, 0.87)");
  });

  test("onContentColors returns light text on dark surface", () => {
    const colors = onContentColors("#232323");
    expect(colors.isLight).toBe(false);
    expect(colors.primary).toBe("#ffffff");
  });

  test("isWhiteAreaPickerChrome uses DEFAULT_APP_CONTENT fallback", () => {
    expect(isWhiteAreaPickerChrome(undefined)).toBe(
      isLightSurface(DEFAULT_APP_CONTENT)
    );
  });
});

describe("themeOnSurfaceAdvanced", () => {
  test("isGoldApplicationTheme matches gold anchor", () => {
    expect(isGoldApplicationTheme("#e6c84c")).toBe(true);
    expect(isGoldApplicationTheme("#E6C84C")).toBe(true);
    expect(isGoldApplicationTheme("#ffffff")).toBe(false);
  });

  test("PRODUCT_DEFAULT constants are exported", () => {
    expect(PRODUCT_DEFAULT_APP_BACKGROUND).toBe("#6f809d");
  });
});

describe("themeBackgroundImage", () => {
  test("normalizeBackgroundPath fixes default@g typo", () => {
    expect(normalizeBackgroundPath("/assets/default@g.png")).toBe(
      "/assets/defaultBg.png"
    );
  });

  test("normalizeBackgroundPath returns default for empty", () => {
    expect(normalizeBackgroundPath("")).toBe(DEFAULT_PUBLIC_BG);
    expect(normalizeBackgroundPath(null)).toBe(DEFAULT_PUBLIC_BG);
  });

  test("resolveAuthPageBackgroundUrl returns null when no custom image", () => {
    expect(resolveAuthPageBackgroundUrl("")).toBeNull();
    expect(resolveAuthPageBackgroundUrl(null)).toBeNull();
  });

  test("pickThemeBackgroundImage picks first defined candidate", () => {
    expect(pickThemeBackgroundImage(undefined, null, "", "custom")).toBe("");
    expect(pickThemeBackgroundImage(undefined, "first")).toBe("first");
  });
});
