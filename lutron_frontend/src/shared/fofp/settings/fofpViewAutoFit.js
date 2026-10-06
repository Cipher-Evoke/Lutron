/**
 * Whether auto-fit should replace the current pan/zoom transform.
 */

export const shouldApplyCalibratedFit = (userAdjusted, force = false) =>
  force || !userAdjusted;
