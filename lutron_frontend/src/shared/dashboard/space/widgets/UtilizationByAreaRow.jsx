import React from 'react';
import { Box } from '@mui/material';

export function UtilizationByAreaRow({ area, theme, isLargeScreen = false }) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: { xs: '8px 0', sm: '10px 0', md: '12px 0', lg: '14px 0', xl: '16px 0' },
        borderBottom: theme.rowBorder,
        color: theme.textColor,
      }}
    >
      <Box
        component="span"
        sx={{
          fontSize: { xs: '12px', sm: '13px', md: '14px', lg: '15px', xl: '16px' },
          fontWeight: '500',
        }}
      >
        {area.name || 'Unknown Area'}
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: '8px', sm: '10px', md: '12px', lg: '14px', xl: '16px' },
        }}
      >
        <Box
          sx={{
            flex: 1,
            height: { xs: '1px', sm: '1.5px', md: '2px', lg: '2.5px', xl: '3px' },
            backgroundColor: theme.dividerColor,
            borderRadius: '1px',
          }}
        />
        <Box
          component="span"
          sx={{
            fontSize: { xs: '12px', sm: '13px', md: '14px', lg: '15px', xl: '16px' },
            fontWeight: '600',
          }}
        >
          {area.percentage || 0}%
        </Box>
      </Box>
    </Box>
  );
}

export default UtilizationByAreaRow;
