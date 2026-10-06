/** Keeps page action buttons visible above the app footer while scrolling. */

export const SCHEDULE_FIXED_ACTION_BAR_BOTTOM = '52px';

/** Scrollable location/action list inside details right panel (Schedule + Quick Control). */
export const scheduleRightListScrollStyle = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  overflowX: 'hidden',
};

/** Extra page padding so fixed action buttons clear the last table rows. */
export const DETAILS_FIXED_ACTION_BAR_BOTTOM_CLEARANCE = 120;

export const schedulePageWithFixedActionBarStyle = (
  isLargeScreen,
  isDesktop,
  isTablet = false
) => ({
  paddingBottom: 88,
  paddingRight: isLargeScreen ? 440 : isDesktop ? 400 : isTablet ? 360 : 320,
  boxSizing: 'border-box',
  marginLeft: 0,
  marginRight: 'auto',
});

export const scheduleFixedActionBarStyle = (
  isLargeScreen,
  isDesktop,
  isTablet = false
) => ({
  position: 'fixed',
  bottom: SCHEDULE_FIXED_ACTION_BAR_BOTTOM,
  left: 0,
  right: 0,
  zIndex: 900,
  display: 'flex',
  justifyContent: 'flex-end',
  gap: isLargeScreen ? 20 : isDesktop ? 18 : 16,
  flexWrap: isTablet ? 'wrap' : 'nowrap',
  paddingTop: 12,
  paddingBottom: 12,
  paddingLeft: isLargeScreen ? 48 : isDesktop ? 40 : isTablet ? 32 : 24,
  paddingRight: isLargeScreen ? 48 : isDesktop ? 40 : isTablet ? 32 : 24,
  background: 'transparent',
});
