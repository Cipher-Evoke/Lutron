import { isLightSurface } from "./themeOnSurface";

/** Dark wordmark on light surfaces; original artwork on dark surfaces (matches auth logo). */
export function resolveWordmarkLogoFilter(surfaceColor) {
  return isLightSurface(surfaceColor)
    ? "brightness(0) saturate(100%)"
    : "none";
}
