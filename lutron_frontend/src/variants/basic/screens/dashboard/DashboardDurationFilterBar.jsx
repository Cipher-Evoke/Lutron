import React from 'react';
import { FormControl, MenuItem, Select } from '@mui/material';

/**
 * Shared duration + date navigation bar (Energy combined card, Energy tab standalone, Space charts tab).
 * When `themedSelect` is true (Advanced only), uses MUI Select with theme menu hover/selection tokens.
 */
export default function DashboardDurationFilterBar({
  selectedDuration,
  onDurationChange,
  customDateRange = {},
  onCustomStartDateChange,
  onCustomEndDateChange,
  globalLoading = false,
  periodLabel = '',
  onPrevious,
  onNext,
  isLargeScreen = true,
  isMediumScreen = false,
  /** Advanced: theme-aware MUI duration dropdown (hover / selected). */
  themedSelect = false,
  selectMenuProps = null,
  selectFieldSx = null,
}) {
  const startValue = (customDateRange.startDate || '').split('T')[0];
  const endValue = (customDateRange.endDate || '').split('T')[0];
  const navAccent = themedSelect
    ? 'var(--dashboard-control-accent, var(--app-button, #1565C0))'
    : '#1565C0';

  const durationSelect = themedSelect ? (
    <FormControl fullWidth size="small" disabled={globalLoading} sx={{ opacity: globalLoading ? 0.6 : 1, height: '100%' }}>
      <Select
        className="dashboard-duration-select"
        value={selectedDuration || ''}
        onChange={onDurationChange}
        onClick={(e) => e.stopPropagation()}
        displayEmpty
        MenuProps={selectMenuProps || undefined}
        sx={{
          ...(selectFieldSx || {}),
          height: '100%',
          minHeight: 32,
          fontSize: 12,
          fontWeight: 500,
          cursor: globalLoading ? 'not-allowed' : 'pointer',
        }}
        inputProps={{ 'aria-label': 'Time range' }}
      >
        <MenuItem value="">Select Duration</MenuItem>
        <MenuItem value="this-day">This Day</MenuItem>
        <MenuItem value="this-week">This Week</MenuItem>
        <MenuItem value="this-month">This Month</MenuItem>
        <MenuItem value="this-year">This Year</MenuItem>
        <MenuItem value="custom">Custom Period</MenuItem>
      </Select>
    </FormControl>
  ) : (
    <select
      value={selectedDuration || ''}
      onChange={onDurationChange}
      disabled={globalLoading}
      onClick={(e) => e.stopPropagation()}
      aria-label="Time range"
      style={{
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        height: '100%',
        padding: '6px 10px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        backgroundColor: globalLoading ? '#f5f5f5' : 'white',
        fontSize: '12px',
        fontWeight: 500,
        cursor: globalLoading ? 'not-allowed' : 'pointer',
        opacity: globalLoading ? 0.6 : 1,
        fontFamily: 'inherit',
        appearance: 'none',
        backgroundImage:
          'url("data:image/svg+xml;charset=US-ASCII,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 4 5\'><path fill=\'%231565C0\' d=\'M2 0L0 2h4zm0 5L0 3h4z\'/></svg>")',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 8px center',
        backgroundSize: '10px',
        paddingRight: '28px',
        boxSizing: 'border-box',
      }}
    >
      <option value="">Select Duration</option>
      <option value="this-day">This Day</option>
      <option value="this-week">This Week</option>
      <option value="this-month">This Month</option>
      <option value="this-year">This Year</option>
      <option value="custom">Custom Period</option>
    </select>
  );

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        rowGap: 8,
        width: '100%',
        height: 80,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          minWidth: 0,
          height: 32,
          overflow: themedSelect ? 'visible' : 'hidden',
        }}
      >
        {durationSelect}
      </div>
      <div
        style={{
          background: 'white',
          borderRadius: '4px',
          padding: '4px 6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          minWidth: 0,
          height: 40,
          border: '1px solid #ccc',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          flexWrap: 'nowrap',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {selectedDuration === 'custom' ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: isLargeScreen ? 6 : isMediumScreen ? 4 : 2,
              width: '100%',
              height: '100%',
              justifyContent: 'center',
              flexWrap: 'nowrap',
              minWidth: 0,
            }}
          >
            <div style={{ position: 'relative', minWidth: 0, flex: '1 1 0', maxWidth: '45%' }}>
              {!startValue && (
                <span
                  style={{
                    position: 'absolute',
                    left: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#333',
                    fontSize: '11px',
                    fontWeight: 700,
                    fontFamily: 'inherit',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  DD-MM-YYYY
                </span>
              )}
              <input
                type="date"
                value={startValue}
                onChange={(e) => onCustomStartDateChange?.(e.target.value)}
                style={{
                  padding: '2px 4px',
                  height: 28,
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  fontSize: '11px',
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  minWidth: 0,
                  width: '100%',
                  boxSizing: 'border-box',
                  color: startValue ? undefined : 'transparent',
                }}
              />
            </div>
            <span
              style={{
                fontWeight: 600,
                color: '#333',
                fontSize: '11px',
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}
            >
              to
            </span>
            <div style={{ position: 'relative', minWidth: 0, flex: '1 1 0', maxWidth: '45%' }}>
              {!endValue && (
                <span
                  style={{
                    position: 'absolute',
                    left: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#333',
                    fontSize: '11px',
                    fontWeight: 700,
                    fontFamily: 'inherit',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  DD-MM-YYYY
                </span>
              )}
              <input
                type="date"
                value={endValue}
                onChange={(e) => onCustomEndDateChange?.(e.target.value)}
                style={{
                  padding: '2px 4px',
                  height: 28,
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  fontSize: '11px',
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  minWidth: 0,
                  width: '100%',
                  boxSizing: 'border-box',
                  color: endValue ? undefined : 'transparent',
                }}
              />
            </div>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={
                globalLoading
                  ? undefined
                  : (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onPrevious?.();
                    }
              }
              disabled={globalLoading}
              style={{
                background: 'none',
                border: 'none',
                color: globalLoading ? '#ccc' : navAccent,
                cursor: globalLoading ? 'not-allowed' : 'pointer',
                fontWeight: 500,
                fontSize: '12px',
                fontFamily: 'inherit',
                userSelect: 'none',
                textAlign: 'center',
                opacity: globalLoading ? 0.5 : 1,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                padding: '2px 6px',
                borderRadius: '2px',
                transition: 'all 0.2s ease',
              }}
              title="Previous"
            >
              ‹ Previous
            </button>
            <span
              style={{
                color: '#333',
                fontWeight: 500,
                fontSize: '13px',
                fontFamily: 'inherit',
                textAlign: 'center',
                display: 'inline-block',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flex: 1,
                padding: '0 8px',
              }}
              title={periodLabel}
            >
              {periodLabel}
            </span>
            <button
              type="button"
              onClick={
                globalLoading
                  ? undefined
                  : (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onNext?.();
                    }
              }
              disabled={globalLoading}
              style={{
                background: 'none',
                border: 'none',
                color: globalLoading ? '#ccc' : navAccent,
                cursor: globalLoading ? 'not-allowed' : 'pointer',
                fontWeight: 500,
                fontSize: '12px',
                fontFamily: 'inherit',
                userSelect: 'none',
                textAlign: 'center',
                opacity: globalLoading ? 0.5 : 1,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                padding: '2px 6px',
                borderRadius: '2px',
                transition: 'all 0.2s ease',
              }}
              title="Next"
            >
              Next ›
            </button>
          </>
        )}
      </div>
    </div>
  );
}
