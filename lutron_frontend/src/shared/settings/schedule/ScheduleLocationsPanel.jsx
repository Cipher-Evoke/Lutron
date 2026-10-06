import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
  scheduleRightListScrollStyle,
  SCHEDULE_FIXED_ACTION_BAR_BOTTOM,
} from '../../../utils/fixedActionBarStyles';
import { detailsRowActionControlsStyle as getDetailsRowActionControlsStyle } from '../../../utils/detailsRowActionControlsStyle';

export default function ScheduleLocationsPanel({
  locations = [],
  formTheme,
  buttonColor,
  isLargeScreen,
  isDesktop,
  useAdvancedLayout = false,
  layoutHelpers = null,
  editMode = true,
  onAddLocation,
  onAddCommonAction,
  onOpenActionDialog,
  onDeleteLocation,
  onEditAction,
  renderActionDisplay,
  formatLocationLabel,
  emptyActionLabel = 'No action',
  expandToContent = false,
  useFixedActionBarListScroll = false,
  actionBar = null,
  actionHeaderLabel = 'Add Action',
  hideTrailingAddAction = true,
}) {
  const listScrollRef = useRef(null);
  const [showScrollDown, setShowScrollDown] = useState(false);

  const updateScrollDownVisibility = useCallback(() => {
    const el = listScrollRef.current;
    if (!el) {
      setShowScrollDown(false);
      return;
    }
    setShowScrollDown(el.scrollHeight - el.scrollTop - el.clientHeight > 8);
  }, []);

  useLayoutEffect(() => {
    if (!useAdvancedLayout || expandToContent) return undefined;

    const syncScrollDown = () => updateScrollDownVisibility();
    syncScrollDown();
    const rafId = requestAnimationFrame(syncScrollDown);
    const t50 = window.setTimeout(syncScrollDown, 50);
    const t300 = window.setTimeout(syncScrollDown, 300);

    const el = listScrollRef.current;
    if (!el) {
      return () => {
        cancelAnimationFrame(rafId);
        window.clearTimeout(t50);
        window.clearTimeout(t300);
      };
    }

    el.addEventListener('scroll', syncScrollDown, { passive: true });
    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(syncScrollDown) : null;
    resizeObserver?.observe(el);
    window.addEventListener('resize', syncScrollDown);

    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(t50);
      window.clearTimeout(t300);
      el.removeEventListener('scroll', syncScrollDown);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', syncScrollDown);
    };
  }, [locations, updateScrollDownVisibility, useAdvancedLayout, expandToContent]);

  const handleScrollDown = () => {
    const el = listScrollRef.current;
    if (!el) return;
    const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (remaining <= 0) return;
    const step = Math.max(el.clientHeight * 0.75, 120);
    el.scrollBy({ top: Math.min(step, remaining), behavior: 'smooth' });
    window.setTimeout(updateScrollDownVisibility, 300);
  };

  const getLocationText = (loc) => {
    if (typeof formatLocationLabel === 'function') {
      return formatLocationLabel(loc);
    }
    return `${loc.floorName} / ${loc.areaName}`;
  };

  const {
    getAdvancedQuickControlDetailsTablePanelStyle,
    getAdvancedQuickControlDetailsTableCardStyle,
    quickControlDetailsActionColStyle,
    quickControlDetailsHeaderTrailingColStyle,
    quickControlDetailsListScrollStyle,
    quickControlDetailsListScrollWrapStyle,
    quickControlDetailsLocationColStyle,
    quickControlDetailsStickyHeaderStyle,
    quickControlDetailsTableHeaderRowStyle,
    quickControlDetailsTableRowStyle,
    scheduleSmallActionButtonStyle,
    detailsRowActionControlsStyle: layoutRowActionControlsStyle,
  } = layoutHelpers || {};

  const rowActionControlsStyle =
    layoutRowActionControlsStyle ?? getDetailsRowActionControlsStyle;

  if (useAdvancedLayout && layoutHelpers) {
    const advancedPanelColumnStyle = expandToContent
      ? { display: 'flex', flexDirection: 'column', width: '100%' }
      : {
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          width: '100%',
        };

    const advancedTablePanelStyle = expandToContent
      ? {
          ...getAdvancedQuickControlDetailsTablePanelStyle(isLargeScreen, isDesktop),
          flex: 'none',
          minHeight: 'auto',
        }
      : getAdvancedQuickControlDetailsTablePanelStyle(isLargeScreen, isDesktop);

    const advancedTableCardStyle = expandToContent
      ? {
          ...getAdvancedQuickControlDetailsTableCardStyle(isLargeScreen, isDesktop),
          flex: 'none',
          minHeight: 'auto',
        }
      : getAdvancedQuickControlDetailsTableCardStyle(isLargeScreen, isDesktop);

    const advancedListWrapStyle = expandToContent
      ? { position: 'relative', width: '100%' }
      : quickControlDetailsListScrollWrapStyle;

    const advancedListStyle = expandToContent
      ? { width: '100%', overflow: 'visible' }
      : quickControlDetailsListScrollStyle;

    const advancedHeaderStyle = expandToContent
      ? quickControlDetailsTableHeaderRowStyle
      : {
          ...quickControlDetailsTableHeaderRowStyle,
          ...quickControlDetailsStickyHeaderStyle(),
        };

    return (
      <div
        className={
          expandToContent
            ? 'schedule-form-right-panel schedule-form-right-panel--expanded'
            : 'schedule-form-right-panel'
        }
      >
        <div style={advancedPanelColumnStyle}>
          <div style={advancedTablePanelStyle}>
            <div style={advancedTableCardStyle}>
              <div
                className={
                  expandToContent
                    ? 'schedule-locations-list-expanded'
                    : 'quick-control-details-list-scroll-wrap'
                }
                style={advancedListWrapStyle}
              >
                <div
                  ref={expandToContent ? undefined : listScrollRef}
                  className={
                    expandToContent
                      ? 'schedule-locations-list-expanded'
                      : 'quick-control-details-list-scroll'
                  }
                  style={advancedListStyle}
                >
                  <div style={advancedHeaderStyle}>
                    <span
                      style={{
                        ...quickControlDetailsLocationColStyle,
                        cursor: editMode ? 'pointer' : 'default',
                      }}
                      onClick={() => editMode && onAddLocation?.()}
                    >
                      {editMode ? '+ Add Location' : 'Location'}
                    </span>
                    <span style={quickControlDetailsActionColStyle}>
                      {editMode ? actionHeaderLabel : 'Action'}
                    </span>
                    {editMode && (
                      <span
                        style={{
                          ...quickControlDetailsHeaderTrailingColStyle,
                          cursor: 'pointer',
                        }}
                        onClick={() => onAddCommonAction?.()}
                      >
                        + Add Common Action
                      </span>
                    )}
                  </div>

                  {locations.map((loc, idx) => {
                    const locationText = getLocationText(loc);
                    const hasActions = loc.actions && loc.actions.length > 0;
                    return (
                      <div key={idx} style={quickControlDetailsTableRowStyle}>
                        <div style={quickControlDetailsLocationColStyle}>{locationText}</div>
                        <div
                          style={{
                            ...quickControlDetailsActionColStyle,
                            minWidth: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                          }}
                        >
                          {hasActions
                            ? (
                              <>
                                {loc.actions.map((action, actionIdx) => (
                                  <div key={actionIdx} style={{ marginBottom: 4 }}>
                                    {renderActionDisplay(action)}
                                  </div>
                                ))}
                                {editMode && (
                                  <button
                                    type="button"
                                    style={{
                                      ...scheduleSmallActionButtonStyle(buttonColor),
                                      background: 'transparent',
                                      color: buttonColor,
                                      border: `1px solid ${buttonColor}`,
                                      alignSelf: 'flex-start',
                                      marginTop: 4,
                                    }}
                                    onClick={() => onOpenActionDialog?.(idx)}
                                  >
                                    + Add Action
                                  </button>
                                )}
                              </>
                            )
                            : editMode ? (
                                <button
                                  style={scheduleSmallActionButtonStyle(buttonColor)}
                                  onClick={() => onOpenActionDialog?.(idx)}
                                >
                                  Add Action
                                </button>
                              ) : (
                                <div
                                  style={{
                                    color: 'var(--schedule-panel-muted-text, rgba(0,0,0,0.5))',
                                    fontStyle: 'italic',
                                  }}
                                >
                                  {emptyActionLabel}
                                </div>
                              )}
                        </div>
                        {editMode && (
                          <div style={rowActionControlsStyle(180)}>
                            {onEditAction && hasActions && (
                              <button
                                onClick={() => onEditAction(idx, loc.actions)}
                                style={scheduleSmallActionButtonStyle(buttonColor)}
                              >
                                Edit Action
                              </button>
                            )}
                            <button
                              onClick={() => onDeleteLocation?.(idx, loc.actions)}
                              style={{
                                background: buttonColor,
                                border: 'none',
                                borderRadius: 4,
                                color: '#fff',
                                padding: '6px 10px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                minWidth: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {!expandToContent && showScrollDown && (
                  <button
                    type="button"
                    className="quick-control-details-scroll-btn"
                    onClick={handleScrollDown}
                    aria-label="Scroll down"
                  >
                    ▼
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        {actionBar}
      </div>
    );
  }

  const legacyListScrollStyle = useFixedActionBarListScroll
    ? {
        ...scheduleRightListScrollStyle,
        maxHeight: `calc(100vh - 300px - ${SCHEDULE_FIXED_ACTION_BAR_BOTTOM})`,
      }
    : undefined;

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        height: useFixedActionBarListScroll ? 'auto' : '100%',
        overflow: useFixedActionBarListScroll ? 'visible' : 'hidden',
        maxWidth: isLargeScreen ? 800 : isDesktop ? 700 : 600,
        ...(formTheme?.rightPanelBg
          ? {
              background: formTheme.rightPanelBg,
              borderRadius: formTheme.fieldCardRadius || 16,
              ...(formTheme.fieldCardBorder ? { border: formTheme.fieldCardBorder } : {}),
              boxShadow: formTheme.rightPanelShadow,
              padding: formTheme.useSeparateFieldCards
                ? isLargeScreen
                  ? 24
                  : isDesktop
                    ? 22
                    : 20
                : 25,
              boxSizing: 'border-box',
            }
          : {}),
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          fontWeight: formTheme?.listHeaderFontWeight || 500,
          color: formTheme?.headerTextColor,
          borderBottom: formTheme?.listHeaderBorderBottom || '1px solid #ccc',
          paddingBottom: isLargeScreen ? 12 : isDesktop ? 10 : 8,
          marginBottom: isLargeScreen ? 12 : isDesktop ? 10 : 8,
          fontSize: isLargeScreen ? 17 : isDesktop ? 16 : 15,
        }}
      >
        <span
          style={{ flex: 2, cursor: editMode ? 'pointer' : 'default', textAlign: 'left', minWidth: 120 }}
          onClick={() => editMode && onAddLocation?.()}
        >
          {editMode ? '+ Add Location' : 'Location'}
        </span>
        <span style={{ flex: 2, textAlign: 'left', minWidth: 100 }}>
          {editMode ? actionHeaderLabel : 'Action'}
        </span>
        {editMode && (
          <span
            style={{
              flex: '0 0 180px',
              cursor: 'pointer',
              textAlign: 'start',
              whiteSpace: 'nowrap',
            }}
            onClick={() => onAddCommonAction?.()}
          >
            + Add Common Action
          </span>
        )}
      </div>

      <div style={legacyListScrollStyle}>
        {locations.map((loc, idx) => {
          const locationText = getLocationText(loc);
          const isLongName = locationText.length > 40;
          const hasActions = loc.actions && loc.actions.length > 0;

          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                borderBottom: `1px solid ${formTheme?.listBorderColor}`,
                padding: '8px 0',
                minHeight: isLongName ? '60px' : '40px',
              }}
            >
              <div
                style={{
                  flex: '0 0 280px',
                  fontSize: 15,
                  color: formTheme?.listTextColor,
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  paddingRight: '10px',
                }}
              >
                {isLongName ? (
                  <div
                    style={{
                      lineHeight: '1.3',
                      wordBreak: 'break-word',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {locationText}
                  </div>
                ) : (
                  <div
                    style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {locationText}
                  </div>
                )}
              </div>
              <div
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: formTheme?.listTextColor,
                  textAlign: 'left',
                  minWidth: 120,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  marginLeft: '10px',
                }}
              >
                {loc.actions && loc.actions.length > 0
                  ? (
                    <>
                      {loc.actions.map((action, actionIdx) => (
                        <div key={actionIdx} style={{ marginBottom: '4px' }}>
                          {renderActionDisplay(action)}
                        </div>
                      ))}
                      {editMode && (
                        <button
                          type="button"
                          style={{
                            color: buttonColor,
                            padding: '5px 10px',
                            borderRadius: 2,
                            border: `1px solid ${buttonColor}`,
                            background: 'transparent',
                            cursor: 'pointer',
                            fontSize: '12px',
                            alignSelf: 'flex-start',
                            marginTop: 4,
                            whiteSpace: 'nowrap',
                          }}
                          onClick={() => onOpenActionDialog?.(idx)}
                        >
                          + Add Action
                        </button>
                      )}
                    </>
                  )
                  : editMode ? (
                      <button
                        style={{
                          color: 'white',
                          padding: '5px 10px',
                          borderRadius: 2,
                          border: '1px solid #888',
                          background: buttonColor,
                          cursor: 'pointer',
                          fontSize: '12px',
                          alignSelf: 'flex-start',
                          marginLeft: 0,
                          whiteSpace: 'nowrap',
                        }}
                        onClick={() => onOpenActionDialog?.(idx)}
                      >
                        Add Action
                      </button>
                    ) : (
                      <span style={{ color: '#888' }}>{emptyActionLabel}</span>
                    )}
              </div>
              {editMode && (
                <div style={rowActionControlsStyle(180)}>
                  {hasActions && onEditAction && (
                    <button
                      type="button"
                      onClick={() => onEditAction(idx, loc.actions)}
                      style={{
                        background: buttonColor,
                        border: 'none',
                        borderRadius: 4,
                        color: '#fff',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: 12,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Edit Action
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteLocation?.(idx, loc.actions)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: formTheme?.listTextColor || '#333',
                      padding: 0,
                      cursor: 'pointer',
                      fontSize: 18,
                      lineHeight: 1,
                    }}
                    title="Delete"
                  >
                    <span role="img" aria-label="delete">🗑️</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {actionBar}
    </div>
  );
}
