/**
 * @jest-environment node
 */

import {
  DEFAULT_PUBLIC_BG,
  isSeededDefaultBackgroundImage,
  resolveAppShellBackgroundUrl,
  resolveAuthPageBackgroundUrl,
  normalizeBackgroundPath,
} from "./normalizeBackgroundPath";

describe("basic normalizeBackgroundPath / app shell bg", () => {
  test("normalizeBackgroundPath fixes default@g typo", () => {
    expect(normalizeBackgroundPath("/assets/default@g.png")).toBe(
      DEFAULT_PUBLIC_BG
    );
  });

  test("seeded defaults are detected", () => {
    expect(isSeededDefaultBackgroundImage("")).toBe(true);
    expect(isSeededDefaultBackgroundImage(null)).toBe(true);
    expect(isSeededDefaultBackgroundImage("/assets/defaultBg.png")).toBe(true);
    expect(
      isSeededDefaultBackgroundImage("/background_image/defaultBg.png")
    ).toBe(true);
    expect(
      isSeededDefaultBackgroundImage("/background_image/bg_custom_1.png")
    ).toBe(false);
  });

  test("resolveAppShellBackgroundUrl ignores seeded defaultBg", () => {
    expect(resolveAppShellBackgroundUrl("")).toBe("");
    expect(resolveAppShellBackgroundUrl("/assets/defaultBg.png")).toBe("");
    expect(
      resolveAppShellBackgroundUrl("/background_image/defaultBg.png")
    ).toBe("");
    expect(
      resolveAppShellBackgroundUrl("/background_image/bg_custom_1.png")
    ).toBe("/background_image/bg_custom_1.png");
  });

  test("resolveAuthPageBackgroundUrl returns null for seeded/empty", () => {
    expect(resolveAuthPageBackgroundUrl("")).toBeNull();
    expect(resolveAuthPageBackgroundUrl("/assets/defaultBg.png")).toBeNull();
    expect(
      resolveAuthPageBackgroundUrl("/background_image/office.png")
    ).toBe("/background_image/office.png");
  });
});
