/**
 * Space Utilization Charts tab — combined card (matches Energy `ConsumptionSavingsCombinedChart` layout).
 * Header: title + tabs | Export; then `topControls`-style duration + date row; chart.
 */

import React, { useState, useMemo } from 'react';
import { Box } from '@mui/material';
import {
  resolveSpaceInstantUtilizationCombinedChrome,
  SPACE_INSTANT_UTILIZATION_COMBINED_SHELL_VARIANTS,
} from '../../../../shared/dashboard/widgets/space/spaceInstantUtilizationCombinedChrome';

const DEFAULT_TITLE_STYLE = {
  margin: 0,
  fontSize: '18px',
  fontWeight: 600,
  color: '#000000',
  fontFamily: 'inherit',
};

export default function SpaceInstantUtilizationCombinedChart({
  cardTitle = 'Space Utilization',
  instantTabLabel,
  areaTabLabel,
  instantSection,
  areaSection,
  /** Export control — same corner as Energy (only shown on Trends tab). */
  instantTrendToolbarRight,
  /** Duration dropdown + date nav — shown above chart content on both tabs. */
  instantTrendDateNav,
  contentColor = 'rgba(128, 120, 100, 0.6)',
  shellVariant = SPACE_INSTANT_UTILIZATION_COMBINED_SHELL_VARIANTS.basic,
  advancedSurface = null,
  titleStyle: titleStyleProp,
  /** Optional controlled tab (`instant` | `area`). Uncontrolled when omitted. */
  activeTab = null,
  onTabChange = null,
}) {
  const [tabInternal, setTabInternal] = useState('instant');
  const isControlled = activeTab === 'instant' || activeTab === 'area';
  const tab = isControlled ? activeTab : tabInternal;
  const setTab = (next) => {
    if (isControlled) {
      if (typeof onTabChange === 'function') onTabChange(next);
      return;
    }
    setTabInternal(next);
  };

  const titleStyle = titleStyleProp || DEFAULT_TITLE_STYLE;
  const chrome = useMemo(
    () =>
      resolveSpaceInstantUtilizationCombinedChrome({
        shellVariant,
        contentColor,
        advancedSurface,
        titleStyle,
      }),
    [shellVariant, contentColor, advancedSurface, titleStyle]
  );

  const stop = (e) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
  };

  return (
    <Box
      onMouseDown={stop}
      onMouseUp={stop}
      onClick={stop}
      onDoubleClick={stop}
      onContextMenu={stop}
      className={chrome.shellClassName}
      sx={chrome.shellSx}
    >
      {/* Same structure as Energy: left column (title + tabs) | Export */}
      <Box sx={{ marginBottom: 1 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 1,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                borderBottom: chrome.dividerBorder,
                paddingBottom: 0.75,
                marginBottom: 0.75,
              }}
            >
              <Box
                component="h3"
                sx={{
                  ...chrome.titleStyle,
                  ...(shellVariant === SPACE_INSTANT_UTILIZATION_COMBINED_SHELL_VARIANTS.basic
                    ? { fontSize: { xs: '14px', lg: '15px' } }
                    : { fontSize: { xs: '16px', lg: '18px' } }),
                }}
              >
                {cardTitle}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setTab('instant')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: tab === 'instant' ? chrome.tabActiveColor : chrome.tabInactiveColor,
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: tab === 'instant' ? 'underline' : 'none',
                  textUnderlineOffset: 6,
                  fontFamily: 'inherit',
                }}
              >
                {instantTabLabel}
              </button>
              <button
                type="button"
                onClick={() => setTab('area')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: tab === 'area' ? chrome.tabActiveColor : chrome.tabInactiveColor,
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: tab === 'area' ? 'underline' : 'none',
                  textUnderlineOffset: 6,
                  fontFamily: 'inherit',
                }}
              >
                {areaTabLabel}
              </button>
            </Box>
          </Box>
          {tab === 'instant' && instantTrendToolbarRight != null && (
            <Box sx={{ flexShrink: 0, pt: 0.25 }}>{instantTrendToolbarRight}</Box>
          )}
        </Box>
      </Box>

      {/* Same duration/date filter for Trends Over Time and Split By Area */}
      {instantTrendDateNav != null && (
        <Box
          sx={{
            width: '100%',
            maxWidth: { xs: 200, sm: 270, md: 330 },
            mx: 'auto',
            mb: 1,
          }}
        >
          {instantTrendDateNav}
        </Box>
      )}

      {tab === 'instant' && instantSection}
      {tab === 'area' && areaSection}
    </Box>
  );
}
