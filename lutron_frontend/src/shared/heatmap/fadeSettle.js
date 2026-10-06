/**
 * Wait after a zone/area command before the confirming live=1 read so the
 * read does not land mid-fade and report pre-command levels.
 *
 * /area/zone_on-off sends GoToDimmedLevel without FadeTime; zone default fade
 * applies. Prefer declared fade_time + delay_time when present; otherwise 2s.
 * Cap at 5s. No artificial 300ms floor.
 */

export const DEFAULT_FADE_SETTLE_MS = 2000;
export const MAX_FADE_SETTLE_MS = 5000;

export function parseFadeSeconds(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/**
 * @param {Array<object>|null|undefined} zones - command payload or area zones
 * @returns {number} milliseconds to wait before confirming read
 */
export function fadeSettleMsFromZones(zones) {
  const list = Array.isArray(zones) ? zones : [];
  let maxSec = null;
  for (const z of list) {
    if (!z || typeof z !== "object") continue;
    const fade = parseFadeSeconds(
      z.fade_time ?? z.fadeTime ?? z.FadeTime
    );
    const delay = parseFadeSeconds(
      z.delay_time ?? z.delayTime ?? z.DelayTime
    );
    if (fade == null && delay == null) continue;
    const total = (fade || 0) + (delay || 0);
    if (maxSec == null || total > maxSec) maxSec = total;
  }
  if (maxSec == null) return DEFAULT_FADE_SETTLE_MS;
  return Math.min(MAX_FADE_SETTLE_MS, Math.round(maxSec * 1000));
}

export function waitForFadeSettle(ms = DEFAULT_FADE_SETTLE_MS) {
  const raw = Number(ms);
  const wait = Math.min(
    MAX_FADE_SETTLE_MS,
    Math.max(0, Number.isFinite(raw) ? raw : DEFAULT_FADE_SETTLE_MS)
  );
  return new Promise((resolve) => setTimeout(resolve, wait));
}
