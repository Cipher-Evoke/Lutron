import React from 'react';
import { Button } from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';

/**
 * Chart/widget export trigger — matches Activity Report (FileUpload icon + white label).
 */
export default function ChartExportButton({
  onClick,
  size = 'medium',
  sx = {},
  surface = 'dark',
  disabled = false,
}) {
  const fontSize = size === 'large' ? '16px' : '14px';
  const padding = size === 'large' ? '8px 12px' : '6px 10px';
  const isLight = surface === 'light';
  const color = isLight ? '#2c2820' : '#fff';
  const hoverBg = isLight ? 'rgba(44, 40, 32, 0.08)' : 'rgba(255,255,255,0.1)';
  const disabledColor = isLight ? 'rgba(44, 40, 32, 0.4)' : 'rgba(255, 255, 255, 0.5)';

  return (
    <Button
      variant="text"
      data-chart-export="true"
      disabled={disabled}
      startIcon={<FileUploadIcon sx={{ color: disabled ? disabledColor : color }} />}
      onClick={onClick}
      sx={{
        color: disabled ? disabledColor : color,
        textTransform: 'none',
        fontWeight: 500,
        fontSize,
        minWidth: 'auto',
        padding,
        '&:hover': { backgroundColor: hoverBg },
        '&:disabled': { color: disabledColor },
        ...sx,
      }}
    >
      Export
    </Button>
  );
}
