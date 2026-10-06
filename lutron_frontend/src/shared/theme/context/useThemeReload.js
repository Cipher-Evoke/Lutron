import { useCallback } from "react";
import { resolvePublicAssetUrl } from "../../utils/resolveMediaUrl";

function resolvePaintedBackground(bg) {
  if (bg == null || bg === "") return bg;
  return resolvePublicAssetUrl(bg) || bg;
}

/**
 * Runtime theme reload handler shared across variants.
 */
export function useThemeReload({
  backgroundImage,
  setBackgroundImage,
  setTheme,
  applyCssVariables,
  createAppTheme,
  resolveReloadBackgroundImage,
}) {
  return useCallback(
    (uiColors = {}, bgImage) => {
      const next = resolvePaintedBackground(
        resolveReloadBackgroundImage(bgImage, backgroundImage)
      );
      applyCssVariables(uiColors, next);
      const newTheme = createAppTheme(uiColors, next);
      setTheme({ ...newTheme });
      setBackgroundImage(next);
    },
    [
      backgroundImage,
      setBackgroundImage,
      setTheme,
      applyCssVariables,
      createAppTheme,
      resolveReloadBackgroundImage,
    ]
  );
}
