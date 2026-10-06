import { createNormalizeUiColors } from "../context/normalizeUiColors";
import { applyDynamicThemeTokens } from "../../../variants/advanced/utils/dynamicThemeTokens";
import {
  GOLD_THEME_SURFACE_GRADIENT,
  THEME_3_TAB_PILL_GRADIENT,
  THEME_4_TAB_PILL_GRADIENT,
} from "../../../variants/advanced/config/themeConstants";
import {
  getFixedGradientPageTheme,
  resolveApplicationNavbarBackground,
  resolveThemeButtonStyle,
} from "../../../variants/advanced/utils/themePageBackground";
import {
  applyGoldPremiumThemeTokens,
  applyTheme3PremiumThemeTokens,
  applyTheme4PremiumThemeTokens,
  clearPremiumThemeTokens,
} from "./premiumThemeTokens";
import { applyDashboardChartChrome } from "./dashboardChartChrome";
import {
  applyTheme3HeatmapChrome,
  applyTheme3PageChrome,
} from "../../../variants/advanced/utils/theme3PageChrome";
import {
  applyGoldPreset,
  applyTheme3Preset,
  applyTheme4Preset,
  applyDefaultSlatePreset,
} from "./presets";
import {
  applyFixedGradientPageBase,
  resolveAdvancedPreset,
} from "./resolveAdvancedPreset";
import { resolvePublicAssetUrl } from "../../utils/resolveMediaUrl";
import { isUserThemeBackgroundImage } from "../utils/themeBackgroundImage";

const DEFAULT_BG = "/assets/defaultBg.png";

const normalizeUiColors = createNormalizeUiColors({
  background: "#6f809d",
  content: "#3d4a5c",
  button: "#232323",
  error: "#FFFFFF",
});

function resolveBgImageUrl(bgImage) {
  if (!isUserThemeBackgroundImage(bgImage) || bgImage === DEFAULT_BG) return null;
  const value = String(bgImage).trim();
  if (value.startsWith("/assets") || /^(blob:|data:)/i.test(value)) {
    return value;
  }
  return resolvePublicAssetUrl(value) || value;
}

/** Advanced variant CSS variable orchestrator. */
export function applyAdvancedCssVariables(uiColors = {}, bgImage) {
  if (typeof document === "undefined") return;

  const { background, content, button } = normalizeUiColors(uiColors);
  const buttonStyle = resolveThemeButtonStyle(button, background);
  const customImageUrl =
    bgImage === undefined ? null : resolveBgImageUrl(bgImage ?? DEFAULT_BG);
  const root = document.documentElement;

  root.style.setProperty("--app-background", background);
  root.style.setProperty("--app-content", content);
  root.style.setProperty("--app-button", buttonStyle.solid);
  root.style.setProperty("--app-button-background", buttonStyle.background);
  root.style.setProperty("--app-button-text", buttonStyle.text);
  if (bgImage !== undefined) {
    root.style.setProperty("--app-background-image", "none");
    root.style.setProperty(
      "--auth-page-background-image",
      customImageUrl ? `url(${customImageUrl})` : "none"
    );
  }

  const preset = resolveAdvancedPreset(background);
  const fixedGradientPageTheme = getFixedGradientPageTheme(background);
  const isGoldTheme = preset === "gold";
  const isTheme3Page = preset === "theme3";
  const isTheme4Page = preset === "theme4";
  const isCustomTheme = preset === "custom";

  const dashboardCardBackground = isGoldTheme
    ? GOLD_THEME_SURFACE_GRADIENT
    : isTheme4Page
      ? THEME_4_TAB_PILL_GRADIENT
      : isTheme3Page
        ? THEME_3_TAB_PILL_GRADIENT
        : isCustomTheme
          ? null
          : "linear-gradient(180deg, #2a3445 0%, #1c2330 100%)";
  if (dashboardCardBackground) {
    root.style.setProperty("--dashboard-card-background", dashboardCardBackground);
  }

  const presetContext = {
    background,
    content,
    button,
    buttonStyle,
    customImageUrl,
    fixedGradientPageTheme,
    isTheme4Page,
  };

  switch (preset) {
    case "gold":
      applyGoldPreset(root, { ...presetContext, stage: "main" });
      applyGoldPremiumThemeTokens(root);
      applyGoldPreset(root, { ...presetContext, stage: "heatmap" });
      break;

    case "custom":
      clearPremiumThemeTokens(root);
      document.documentElement.classList.remove(
        "gold-theme",
        "theme-3-page",
        "theme-4-page",
        "custom-theme"
      );
      applyDynamicThemeTokens(root, {
        background,
        content,
        button,
        buttonStyle,
        customImageUrl,
      });
      break;

    case "theme3":
    case "theme4":
    case "default":
      clearPremiumThemeTokens(root);
      document.documentElement.classList.remove(
        "gold-theme",
        "theme-3-page",
        "theme-4-page",
        "custom-theme"
      );

      if (fixedGradientPageTheme) {
        applyFixedGradientPageBase(root, fixedGradientPageTheme);
        switch (preset) {
          case "theme3":
            applyTheme3Preset(root);
            applyTheme3PremiumThemeTokens(root);
            break;
          case "theme4":
            applyTheme4Preset(root, { stage: "navigation" });
            break;
          case "default":
            applyDefaultSlatePreset(root, {
              ...presetContext,
              stage: "navigation-fixed-fallback",
            });
            break;
          default:
            break;
        }
      } else {
        applyDefaultSlatePreset(root, {
          ...presetContext,
          stage: "navigation-none",
        });
      }

      applyDefaultSlatePreset(root, { ...presetContext, stage: "surface" });

      switch (preset) {
        case "theme4":
          applyTheme4Preset(root, { stage: "surface" });
          applyTheme4PremiumThemeTokens(root);
          break;
        case "theme3":
          applyTheme3HeatmapChrome(root);
          break;
        case "default":
          applyDefaultSlatePreset(root, { ...presetContext, stage: "heatmap" });
          break;
        default:
          break;
      }
      break;

    default:
      break;
  }

  if (isTheme3Page) {
    applyTheme3PageChrome(root);
  }

  root.style.setProperty(
    "--topbar-navbar-background",
    resolveApplicationNavbarBackground(background, content, button)
  );

  applyDashboardChartChrome(root, {
    isGoldTheme,
    isTheme3Page,
    isTheme4Page,
    isCustomTheme,
  });
}
