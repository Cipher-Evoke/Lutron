import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { OverviewMetricTileCard } from './OverviewMetricTileCard';
import { resolveOverviewTileModel } from './overviewTileTypes';
import {
  resolveOverviewMetricTileTheme,
  OVERVIEW_THEME_VARIANTS,
} from './OverviewMetricTileTheme';
import { overviewMetricTilePropsAreEqual } from './overviewTileMemoCompare';

function OverviewMetricTileInner({
  tileType,
  title,
  energy,
  schedule,
  floorsCount,
  spaceUtil,
  onClick,
  cardSx = {},
  themeVariant = OVERVIEW_THEME_VARIANTS.BASIC,
  cardVariant,
  surfaceVariant,
}) {
  const theme = useMemo(
    () =>
      resolveOverviewMetricTileTheme({
        themeVariant,
        cardVariant,
        surfaceVariant,
      }),
    [themeVariant, cardVariant, surfaceVariant]
  );

  const model = useMemo(
    () =>
      resolveOverviewTileModel(tileType, {
        energy,
        schedule,
        floorsCount,
        spaceUtil,
      }),
    [tileType, energy, schedule, floorsCount, spaceUtil]
  );

  return (
    <Box sx={cardSx} onClick={onClick}>
      <OverviewMetricTileCard tileType={tileType} title={title} model={model} theme={theme} />
    </Box>
  );
}

export const OverviewMetricTile = React.memo(
  OverviewMetricTileInner,
  overviewMetricTilePropsAreEqual
);

export default OverviewMetricTile;
