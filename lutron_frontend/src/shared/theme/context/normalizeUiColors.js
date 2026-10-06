/**
 * Factory for variant-specific UI color normalization.
 *
 * @param {object} defaults
 * @param {string} defaults.background
 * @param {string} defaults.content
 * @param {string} defaults.button
 * @param {string} defaults.error
 */
export function createNormalizeUiColors(defaults) {
  const {
    background: defaultBackground,
    content: defaultContent,
    button: defaultButton,
    error: defaultError,
  } = defaults;

  return (uiColors = {}) => ({
    background: uiColors.background || defaultBackground,
    content: uiColors.content || defaultContent,
    button: uiColors.button || defaultButton,
    error: uiColors.error || defaultError,
  });
}
