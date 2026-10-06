import { CARD_BACKGROUND, CARD_BORDER, CARD_SHADOW } from '../config/themeConstants';

/** Overview tile shell — matches advanced Energy/Space chart cards (theme via CSS vars). */
export function resolveAdvancedOverviewCardSx() {
  return {
    background: CARD_BACKGROUND,
    border: CARD_BORDER,
    boxShadow: CARD_SHADOW,
    borderRadius: 2,
    p: 2,
    height: '100%',
    minHeight: 360,
    cursor: 'pointer',
    transition: 'box-shadow 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    '&:hover': { boxShadow: 3 },
  };
}
