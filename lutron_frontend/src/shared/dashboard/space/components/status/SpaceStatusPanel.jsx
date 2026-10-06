import React, { memo } from 'react';
import { Box } from '@mui/material';
import { spaceStatusPanelPropsAreEqual } from './spaceStatusMemoCompare';
import {
  resolveSpaceStatusShellPreset,
  resolveSpaceStatusTone,
} from './spaceStatusTheme';

function SpaceStatusPanelInner({
  tone = 'warning',
  shellVariant = 'basic',
  title,
  subtitle,
  children,
}) {
  if (!title && !children) return null;

  const toneStyle = resolveSpaceStatusTone(tone);
  const shellPreset = resolveSpaceStatusShellPreset(shellVariant);

  return (
    <Box
      sx={{
        ...toneStyle,
        ...shellPreset.banner,
      }}
      data-testid="space-status-panel"
      data-tone={tone}
      data-shell-variant={shellVariant}
    >
      {title}
      {subtitle ? <Box sx={shellPreset.subtitle}>{subtitle}</Box> : null}
      {children}
    </Box>
  );
}

const SpaceStatusPanel = memo(SpaceStatusPanelInner, spaceStatusPanelPropsAreEqual);

SpaceStatusPanel.displayName = 'SpaceStatusPanel';

export default SpaceStatusPanel;
