import React, { useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedFilter } from '../redux/slice/schedule/scheduleSlice';

/**
 * ScheduleHeaderDropdown
 * Rendered inside the MainLayout blue sub-header ribbon when:
 *   - Default White theme is active
 *   - Current path starts with /schedule
 *
 * Styled to match the Energy breadcrumb area selector:
 *   Schedule  ›  All Schedules ▼
 */
function ScheduleHeaderDropdown() {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const { groups = [], selectedFilter } = useSelector((state) => state.schedule);

  const options = [
    { label: 'All Schedules', value: 'All Schedules' },
    ...groups.map((g) => ({ label: g.name, value: String(g.id) })),
    { label: 'Project Time Clock', value: 'Project Time Clock' },
  ];

  const currentLabel =
    options.find((o) => o.value === selectedFilter)?.label || 'All Schedules';

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  return (
    <div
      ref={containerRef}
      style={{
        flex: '0 1 auto',
        width: 'fit-content',
        minWidth: 0,
        maxWidth: '100%',
        position: 'relative',
      }}
    >
      {/* Trigger button — matches Energy breadcrumb area selector style exactly */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        style={{
          width: 'max-content',
          maxWidth: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          padding: '4px 2px',
          border: 'none',
          borderBottom: '1px solid rgba(255,255,255,0.28)',
          borderRadius: 0,
          backgroundColor: 'transparent',
          color: 'rgba(255, 255, 255, 0.66)',
          fontSize: '10px',
          fontWeight: 500,
          fontFamily: 'inherit',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center',
          gap: 8,
          userSelect: 'none',
          whiteSpace: 'nowrap',
          lineHeight: 1.2,
        }}
      >
        <span style={{
          flex: '0 1 auto',
          whiteSpace: 'nowrap',
          minWidth: 0,
          fontSize: 'inherit',
          fontWeight: 500,
          color: 'rgba(255, 255, 255, 0.66)',
          display: 'block',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textAlign: 'left',
          maxWidth: 'min(72vw, 420px)',
        }}>
          {currentLabel}
        </span>
        <span style={{ color: 'rgba(255, 255, 255, 0.66)', flexShrink: 0 }}>▼</span>
      </div>

      {/* Dropdown panel */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            width: 'max-content',
            minWidth: '100%',
            backgroundColor: '#ffffff',
            border: '1px solid #ccc',
            borderRadius: 4,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 20000,
            marginTop: '2px',
            maxHeight: 260,
            overflowY: 'auto',
            overflowX: 'hidden'
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === selectedFilter;
            return (
              <div
                key={opt.value}
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch(setSelectedFilter(opt.value));
                  setOpen(false);
                }}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: isSelected ? '#1E74C5' : '#333',
                  backgroundColor: isSelected ? '#e3f2fd' : 'transparent',
                  fontWeight: isSelected ? 600 : 400,
                  borderBottom: '1px solid #eee',
                }}
              >
                {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ScheduleHeaderDropdown;
