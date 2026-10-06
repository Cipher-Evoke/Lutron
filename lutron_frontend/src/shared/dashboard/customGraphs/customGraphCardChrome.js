import { CUSTOM_GRAPH_VARIANTS } from '../customGraphs/customGraphConstants';

/**
 * Card chrome for custom graph widgets per dashboard variant.
 * Default/customized styling is handled inside EnergyCustomGraphCard.
 */
export function resolveCustomGraphCardShellVariant(variant) {
  const v = String(variant || '').toLowerCase();
  if (v === CUSTOM_GRAPH_VARIANTS.advanced) return 'advanced';
  if (v === CUSTOM_GRAPH_VARIANTS.basic) return 'basic';
  return 'customized';
}

export function resolveCustomGraphCardSurface(variant, advancedSurface = null) {
  if (String(variant).toLowerCase() !== CUSTOM_GRAPH_VARIANTS.advanced) return null;
  return advancedSurface;
}
