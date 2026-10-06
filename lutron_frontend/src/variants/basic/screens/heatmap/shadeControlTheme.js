import { onContentColors } from "../../utils/themeOnSurface";

/**
 * Theme tokens for the basic heatmap sidebar shades section.
 * Light themes use white cards + blue accents (matches Scene/Zones).
 * Dark themes use content/button colors from application theme.
 */
export function buildBasicShadeSectionTheme({
  whiteChrome,
  buttonColor,
  contentColor,
  settingsFormActionBlue,
}) {
  const onSurface = onContentColors(contentColor);
  const accent = whiteChrome ? settingsFormActionBlue || "#1E74C5" : buttonColor || "#333";

  return {
    sectionBg: whiteChrome ? "#f5f7fb" : contentColor,
    sectionBorder: whiteChrome ? "2px solid #1E74C5" : `2px solid ${onSurface.borderStrong}`,
    labelColor: whiteChrome ? "#1E74C5" : onSurface.primary,
    labelBg: whiteChrome ? "#fff" : contentColor,
    navIconColor: onSurface.primary,
    shadeCardBg: whiteChrome ? "#fff" : onSurface.popoverPanelBg,
    shadeCardBorder: `1px solid ${whiteChrome ? onSurface.border : onSurface.borderStrong}`,
    shadeCardText: onSurface.primary,
    shadeCardShadow: whiteChrome ? "0 1px 3px rgba(0,0,0,0.08)" : "0 2px 6px rgba(0,0,0,0.25)",
    sliderAccent: whiteChrome ? buttonColor || accent : "#fff",
    presetButtonSx: ({ disabled, active }) => ({
      background: disabled
        ? whiteChrome
          ? "#f0f0f0"
          : onSurface.hover
        : active
          ? accent
          : whiteChrome
            ? "#fff"
            : buttonColor || "#333",
      color: disabled
        ? onSurface.disabled
        : active
          ? "#fff"
          : whiteChrome
            ? accent
            : "#fff",
      border: disabled
        ? `1px solid ${onSurface.border}`
        : `1px solid ${whiteChrome ? accent : onSurface.borderStrong}`,
      borderRadius: whiteChrome ? 1 : 0.8,
      fontSize: { xs: 8, md: 10 },
      fontWeight: active ? 600 : 400,
      textTransform: "none",
      boxShadow: active ? 1 : "none",
      minWidth: { xs: 56, md: 64 },
      minHeight: { xs: 18, md: 22 },
      lineHeight: 1.1,
      px: { xs: 0.5, md: 0.6 },
      py: { xs: 0.2, md: 0.3 },
      opacity: disabled ? 0.55 : 1,
      cursor: disabled ? "not-allowed" : "pointer",
      "&:hover": disabled
        ? {}
        : {
            background: active
              ? accent
              : whiteChrome
                ? "rgba(30, 116, 197, 0.06)"
                : onSurface.hover,
          },
    }),
  };
}

export function isBasicShadePresetActive(shades, shadesLocalValues, percent, resolveShadeZoneId) {
  if (!shades.length) return false;
  return shades.every((shade) => {
    const zoneId = resolveShadeZoneId(shade);
    return zoneId != null && Math.round(shadesLocalValues[zoneId] ?? 0) === percent;
  });
}
