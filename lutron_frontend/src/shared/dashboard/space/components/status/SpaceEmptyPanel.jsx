import React, { memo } from 'react';
import { Box } from '@mui/material';
import { spaceEmptyPanelPropsAreEqual } from './spaceStatusMemoCompare';
import { resolveSpaceStatusShellPreset } from './spaceStatusTheme';

function SpaceEmptyPanelInner({
  title,
  subtitle,
  shellVariant = 'basic',
}) {
  if (!title) return null;

  const emptyPreset = resolveSpaceStatusShellPreset(shellVariant).empty;

  return (
    <Box
      sx={{
        width: '100%',
        textAlign: 'center',
        py: emptyPreset.py,
        px: emptyPreset.px,
        border: emptyPreset.border,
        ...(emptyPreset.borderColor ? { borderColor: emptyPreset.borderColor } : null),
        borderRadius: emptyPreset.borderRadius,
        bgcolor: emptyPreset.bgcolor,
      }}
      data-testid="space-empty-panel"
      data-shell-variant={shellVariant}
    >
      <Box
        component="p"
        sx={{ m: 0, mb: subtitle ? 1 : 0, fontWeight: 600, color: emptyPreset.titleColor }}
      >
        {title}
      </Box>
      {subtitle ? (
        <Box component="p" sx={{ m: 0, fontSize: emptyPreset.bodyFontSize, color: emptyPreset.bodyColor }}>
          {subtitle}
        </Box>
      ) : null}
    </Box>
  );
}

const SpaceEmptyPanel = memo(SpaceEmptyPanelInner, spaceEmptyPanelPropsAreEqual);

SpaceEmptyPanel.displayName = 'SpaceEmptyPanel';

export default SpaceEmptyPanel;
