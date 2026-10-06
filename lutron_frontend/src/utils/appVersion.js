/** Footer version label — shared by basic, advanced, and customized variants. */
export const APP_DISPLAY_VERSION = 'v.26.06.01';

/** Footer “Version …” text size (px) — all variants. */
export const FOOTER_VERSION_FONT_SIZE = 14;

/** Single source of truth — all variants read this for the footer version label. */
export function getAppDisplayVersion() {
  return APP_DISPLAY_VERSION;
}
