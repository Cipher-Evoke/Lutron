import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * Drag/rearrange + span/fullscreen chrome for advanced dashboard cards.
 * spanMode "energy" uses 12 for full width; "space" uses 2 for full width.
 */
export default function SortableDashboardItem({
  id,
  disabled,
  order,
  span,
  spanMode = 'energy',
  showSpanToggle,
  onToggleSpan,
  showHeightToggle,
  isFullscreen,
  onToggleFullscreen,
  rowSpan,
  children,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled });
  const [isHovered, setIsHovered] = useState(false);
  const showControls = Boolean(isFullscreen || isHovered);
  const isFullWidth = spanMode === 'space' ? span === 2 : span === 12;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : (isFullscreen ? 0.35 : 1),
    cursor: disabled ? 'default' : 'grab',
    touchAction: 'none',
    width: '100%',
    height: 'auto',
    order: typeof order === 'number' ? order : undefined,
    gridColumn: isFullWidth ? '1 / -1' : undefined,
    gridRow: rowSpan && Number(rowSpan) > 1 ? `span ${Number(rowSpan)}` : undefined,
    minHeight: 0,
    minWidth: 0,
    boxSizing: 'border-box',
    position: 'relative',
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...(!disabled ? listeners : {})}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {showSpanToggle || showHeightToggle ? (
          <div
            style={{
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
                  if (typeof onToggleSpan === 'function') onToggleSpan(id);
                }}
                title={isFullWidth ? 'Make half width' : 'Make full width'}
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  zIndex: 5,
                  border: '1px solid rgba(255,255,255,0.25)',
                  background: 'rgba(0,0,0,0.35)',
                  color: '#fff',
                  borderRadius: 999,
                  padding: '4px 8px',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
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
                  if (typeof onToggleFullscreen === 'function') onToggleFullscreen(id);
                }}
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                style={{
                  position: 'absolute',
                  top: 36,
                  right: 8,
                  zIndex: 5,
                  border: '1px solid rgba(255,255,255,0.25)',
                  background: 'rgba(0,0,0,0.35)',
                  color: '#fff',
                  borderRadius: 999,
                  padding: '4px 8px',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                ↕
              </button>
            ) : null}
          </div>
        ) : null}
        {children}
      </div>

      {isFullscreen && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="dashboard-fullscreen-overlay"
              onClick={(e) => {
                if (e.target === e.currentTarget && typeof onToggleFullscreen === 'function') {
                  onToggleFullscreen(id);
                }
              }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 999999,
                backgroundColor: 'rgba(0, 0, 0, 0.78)',
                backdropFilter: 'blur(6px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                boxSizing: 'border-box',
              }}
            >
              <div
                className="dashboard-fullscreen-card-modal"
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  maxWidth: '1680px',
                  maxHeight: '94vh',
                  borderRadius: 14,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                  minWidth: 0,
                  boxShadow: '0 25px 60px rgba(0, 0, 0, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: '#1b2430',
                  filter: 'saturate(1.25) brightness(1.05)',
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
                    if (typeof onToggleFullscreen === 'function') onToggleFullscreen(id);
                  }}
                  title="Close"
                  aria-label="Close"
                  style={{
                    position: 'absolute',
                    top: 14,
                    right: 14,
                    zIndex: 100000,
                    border: '1px solid rgba(255,255,255,0.7)',
                    background: 'rgba(0,0,0,0.75)',
                    color: '#fff',
                    borderRadius: 999,
                    padding: '8px 14px',
                    fontSize: 15,
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(6px)',
                  }}
                >
                  ✕
                </button>
                <div
                  className="dashboard-fullscreen-card-inner"
                  style={{
                    flex: 1,
                    minHeight: 0,
                    minWidth: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    boxSizing: 'border-box',
                    padding: '16px',
                  }}
                >
                  {children}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
