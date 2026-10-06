import React, { useState } from 'react';
import { Box } from '@mui/material';

/**
 * Half/full-width and fullscreen controls for basic dashboard widgets.
 * Works alongside SortableDashboardItem (dnd-kit rearrange) without replacing it.
 */
export default function BasicDashboardCardChrome({
  span = 6,
  showSpanToggle = true,
  onToggleSpan,
  showHeightToggle = true,
  isFullscreen = false,
  onToggleFullscreen,
  children,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const showControls = Boolean(isFullscreen || isHovered);
  const isFullWidth = span === 12;

  if (isFullscreen) {
    return (
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 2000,
          background: 'rgba(0,0,0,0.55)',
          padding: 6,
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}
        onClick={(e) => {
          if (e?.target === e?.currentTarget && typeof onToggleFullscreen === 'function') {
            onToggleFullscreen();
          }
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: '100%',
            borderRadius: 3,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            minWidth: 0,
          }}
        >
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (typeof onToggleFullscreen === 'function') onToggleFullscreen();
            }}
            title="Close"
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              zIndex: 3000,
              border: '1px solid rgba(255,255,255,0.7)',
              background: 'rgba(0,0,0,0.7)',
              color: '#fff',
              borderRadius: 999,
              padding: '10px 14px',
              fontSize: 14,
              fontWeight: 900,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
          <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            {children}
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{ position: 'relative', width: '100%', minWidth: 0 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {showSpanToggle || showHeightToggle ? (
        <Box
          sx={{
            opacity: showControls ? 1 : 0,
            pointerEvents: showControls ? 'auto' : 'none',
            transition: 'opacity 150ms ease',
          }}
        >
          {showSpanToggle ? (
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (typeof onToggleSpan === 'function') onToggleSpan();
              }}
              title={isFullWidth ? 'Make half width' : 'Make full width'}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 5,
                border: '1px solid rgba(0,0,0,0.2)',
                background: 'rgba(255,255,255,0.92)',
                color: '#1c2330',
                borderRadius: 999,
                padding: '4px 8px',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
              }}
            >
              {isFullWidth ? '½' : '↔'}
            </button>
          ) : null}
          {showHeightToggle ? (
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (typeof onToggleFullscreen === 'function') onToggleFullscreen();
              }}
              title="Fullscreen"
              style={{
                position: 'absolute',
                top: showSpanToggle ? 36 : 8,
                right: 8,
                zIndex: 5,
                border: '1px solid rgba(0,0,0,0.2)',
                background: 'rgba(255,255,255,0.92)',
                color: '#1c2330',
                borderRadius: 999,
                padding: '4px 8px',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
              }}
            >
              ↕
            </button>
          ) : null}
        </Box>
      ) : null}
      {children}
    </Box>
  );
}
