import React, { useEffect, useState } from "react";

const daysArray = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ScheduleFormPanel({
  scheduleName, setScheduleName,
  scheduleGroup, setScheduleGroup,
  scheduleType, setScheduleType,
  selectedDays, setSelectedDays,
  timeHours, setTimeHours,
  timeMinutes, setTimeMinutes,
  keepUntil, setKeepUntil,
  groups = [], // Add groups prop
  editable = true
}) {
  // Add responsive state
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // Add window resize listener for responsive design
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate responsive dimensions
  const isLargeScreen = windowSize.width >= 1920; // 4K and large screens
  const isDesktop = windowSize.width >= 1366; // Desktop screens
  const isLaptop = windowSize.width >= 1024; // Laptop screens
  // Handle day selection
  const handleDayToggle = (day) => {
    if (!editable) return;
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  return (
    <div
      style={{
        borderRadius: 16,
        padding: isLargeScreen ? 32 : isDesktop ? 28 : 24,
        background: "#a89c81",
        minWidth: isLargeScreen ? 380 : isDesktop ? 360 : 340,
        maxWidth: isLargeScreen ? 480 : isDesktop ? 440 : 400,
        width: "100%",
      }}
    >
      <div style={{ width: '100%', marginBottom: isLargeScreen ? 32 : isDesktop ? 28 : 24 }}>
        <label style={{ 
          fontWeight: 500, 
          color: 'white', 
          display: 'block', 
          marginBottom: isLargeScreen ? 10 : 8,
          fontSize: isLargeScreen ? 16 : isDesktop ? 15 : 14
        }}>
          Schedule Name
        </label>
        <input
          value={scheduleName}
          onChange={e => editable && setScheduleName(e.target.value)}
          placeholder="Schedule Name"
          disabled={!editable}
          style={{
            width: '100%',
            padding: isLargeScreen ? 14 : isDesktop ? 13 : 12,
            borderRadius: 8,
            border: '1px solid #ccc',
            fontSize: isLargeScreen ? 16 : isDesktop ? 15 : 14,
            background: editable ? "#fff" : "#e0dbce",
            color: editable ? "var(--app-button)" : "#888"
          }}
        />
      </div>
      <div style={{ width: '100%', marginBottom: 24 }}>
        <label style={{ fontWeight: 500, color: 'white', display: 'block', marginBottom: 8 }}>
          Part of
        </label>
        <select
          value={scheduleGroup}
          onChange={e => editable && setScheduleGroup(e.target.value)}
          disabled={!editable}
          style={{
            width: '100%',
            padding: 12,
            borderRadius: 8,
            border: '1px solid #ccc',
            fontSize: 14,
            background: editable ? "#fff" : "#e0dbce",
            color: editable ? "var(--app-button)" : "#888"
          }}
        >
          {groups && groups.length > 0 ? (
            groups.map((group) => (
              <option key={group.id} value={group.id}>{group.name}</option>
            ))
          ) : (
            <option value="">No groups available</option>
          )}
        </select>
      </div>
      {/* White panel for date/time/keep until */}
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
          width: '100%',
          opacity: 1
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: 500, color: '#7a7462', display: 'block', marginBottom: 8 }}>
            Select Day / Date
          </label>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', color: '#7a7462' }}>
              <input
                type="radio"
                value="weekly"
                checked={scheduleType === "weekly"}
                onChange={e => editable && setScheduleType(e.target.value)}
                style={{ 
                  marginRight: 8,
                  accentColor: '#000000',
                  WebkitAppearance: 'none',
                  appearance: 'none',
                  width: '12px',
                  height: '12px',
                  border: '2px solid #ccc',
                  borderRadius: '50%',
                  backgroundColor: scheduleType === "weekly" ? '#000000' : 'transparent',
                  position: 'relative'
                }}
                disabled={!editable}
              />
              Weekly
            </label>
            <label style={{ display: 'flex', alignItems: 'center', color: '#7a7462' }}>
              <input
                type="radio"
                value="annual"
                checked={scheduleType === "annual"}
                onChange={e => editable && setScheduleType(e.target.value)}
                style={{ 
                  marginRight: 8,
                  accentColor: '#000000',
                  WebkitAppearance: 'none',
                  appearance: 'none',
                  width: '12px',
                  height: '12px',
                  border: '2px solid #ccc',
                  borderRadius: '50%',
                  backgroundColor: scheduleType === "annual" ? '#000000' : 'transparent',
                  position: 'relative'
                }}
                disabled={!editable}
              />
              Annual Date
            </label>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {daysArray.map(day => (
              <button
                key={day}
                onClick={() => handleDayToggle(day)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #ccc',
                  background: selectedDays.includes(day) ? 'var(--app-button)' : '#fff',
                  color: selectedDays.includes(day) ? '#fff' : 'var(--app-button)',
                  cursor: editable ? 'pointer' : 'not-allowed',
                  fontSize: 12,
                  fontWeight: 500,
                  minWidth: '40px'
                }}
                type="button"
                disabled={!editable}
              >
                {day}
              </button>
            ))}
          </div>
          <div>
            <label style={{ fontWeight: 500, color: '#7a7462', display: 'block', marginBottom: 8 }}>
              Select Time
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="number"
                value={timeHours}
                onChange={e => {
                  if (!editable) return;
                  const value = e.target.value;
                  // Only allow 2 digits maximum
                  if (value === '' || (value.length <= 2 && /^\d+$/.test(value))) {
                    const numValue = parseInt(value) || 0;
                    // Ensure value is within valid range
                    if (value === '' || (numValue >= 0 && numValue <= 23)) {
                      setTimeHours(value);
                    }
                  }
                }}
                onBlur={e => {
                  if (!editable) return;
                  // Pad with leading zero if single digit
                  const value = e.target.value;
                  if (value && value.length === 1) {
                    setTimeHours(value.padStart(2, '0'));
                  } else if (value && parseInt(value) > 23) {
                    setTimeHours('23');
                  } else if (value && parseInt(value) < 0) {
                    setTimeHours('00');
                  }
                }}
                min="0"
                max="23"
                maxLength={2}
                placeholder="HH"
                style={{
                  width: 60,
                  padding: 8,
                  borderRadius: 4,
                  border: '1px solid #ccc',
                  textAlign: 'center',
                  background: editable ? "#fff" : "#e0dbce",
                  color: editable ? "var(--app-button)" : "#888"
                }}
                disabled={!editable}
              />
              <span style={{ color: '#7a7462', fontSize: 18 }}>:</span>
              <input
                type="number"
                value={timeMinutes}
                onChange={e => {
                  if (!editable) return;
                  const value = e.target.value;
                  // Only allow 2 digits maximum
                  if (value === '' || (value.length <= 2 && /^\d+$/.test(value))) {
                    const numValue = parseInt(value) || 0;
                    // Ensure value is within valid range
                    if (value === '' || (numValue >= 0 && numValue <= 59)) {
                      setTimeMinutes(value);
                    }
                  }
                }}
                onBlur={e => {
                  if (!editable) return;
                  // Pad with leading zero if single digit
                  const value = e.target.value;
                  if (value && value.length === 1) {
                    setTimeMinutes(value.padStart(2, '0'));
                  } else if (value && parseInt(value) > 59) {
                    setTimeMinutes('59');
                  } else if (value && parseInt(value) < 0) {
                    setTimeMinutes('00');
                  }
                }}
                min="0"
                max="59"
                maxLength={2}
                placeholder="MM"
                style={{
                  width: 60,
                  padding: 8,
                  borderRadius: 4,
                  border: '1px solid #ccc',
                  textAlign: 'center',
                  background: editable ? "#fff" : "#e0dbce",
                  color: editable ? "var(--app-button)" : "#888"
                }}
                disabled={!editable}
              />
            </div>
          </div>
        </div>
        <div>
          <label style={{ fontWeight: 500, color: '#7a7462', display: 'block', marginBottom: 8 }}>
            Keep Until
          </label>
          <div style={{ display: 'flex', gap: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', color: '#7a7462' }}>
              <input
                type="radio"
                value="forever"
                checked={keepUntil === "forever"}
                onChange={e => editable && setKeepUntil(e.target.value)}
                style={{ 
                  marginRight: 8,
                  accentColor: '#000000',
                  WebkitAppearance: 'none',
                  appearance: 'none',
                  width: '12px',
                  height: '12px',
                  border: '2px solid #ccc',
                  borderRadius: '50%',
                  backgroundColor: keepUntil === "forever" ? '#000000' : 'transparent',
                  position: 'relative'
                }}
                disabled={!editable}
              />
              Forever
            </label>
            <label style={{ display: 'flex', alignItems: 'center', color: '#7a7462' }}>
              <input
                type="radio"
                value="custom"
                checked={keepUntil === "custom"}
                onChange={e => editable && setKeepUntil(e.target.value)}
                style={{ 
                  marginRight: 8,
                  accentColor: '#000000',
                  WebkitAppearance: 'none',
                  appearance: 'none',
                  width: '12px',
                  height: '12px',
                  border: '2px solid #ccc',
                  borderRadius: '50%',
                  backgroundColor: keepUntil === "custom" ? '#000000' : 'transparent',
                  position: 'relative'
                }}
                disabled={!editable}
              />
              Custom Dates
            </label>
          </div>
          
          {/* FIXED: Improved UI for exception dates if they exist */}
          {exceptionDates && exceptionDates.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                marginBottom: 8 
              }}>
                <span style={{ 
                  fontWeight: 600, 
                  color: '#d32f2f', 
                  fontSize: 14 
                }}>
                  Exception Dates:
                </span>
                <span style={{ 
                  color: '#666', 
                  fontSize: 12 
                }}>
                  ({exceptionDates.length} date{exceptionDates.length > 1 ? 's' : ''})
                </span>
              </div>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 6 
              }}>
                {exceptionDates.map((date, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      background: '#ffebee',
                      color: '#d32f2f',
                      borderRadius: 12,
                      padding: '4px 10px',
                      fontSize: 12,
                      fontWeight: 500,
                      border: '1px solid #ffcdd2',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                  >
                    {date}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

}

