import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { enableSchedule, disableSchedule, triggerSchedule, fetchPreconfiguredScheduleDetails, fetchSchedules } from '../../redux/slice/schedule/scheduleSlice';
import { ConfirmDialog, Toast } from "../../utils/FeedbackUI";
import { UseAuth } from '../../customhooks/UseAuth';

const daysArray = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const fullDaysArray = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Helper function to get the correct event ID for status lookup and API calls
function getEventIdForStatus(event) {
  if (!event) return "";
  // For preconfigured: use last part of href
  if (event.href && event.href.includes("/")) return event.href.split('/').pop();
  // For internal: use id
  if (event.id) return String(event.id);
  return "";
}

function UpdatePreconfigurdEvent() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const status = useSelector(state => state.schedule.status);
  const event = location.state?.event;
  const [message, setMessage] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "" });
  
  // Get user role for role-based access control
  const { role: currentUserRole } = UseAuth();
  
  // Role-based access control functions based on Excel sheet
  const canEnableDisableSchedule = () => {
    // Admin, Operator-Monitor-and-Control, Operator-Monitor-Control-and-Edit can enable/disable
    // Not Required for Operator-Monitor
    return currentUserRole === 'Superadmin' || 
           currentUserRole === 'Admin' || 
           currentUserRole === 'Operator-Monitor-and-Control' ||
           currentUserRole === 'Operator-Monitor-Control-and-Edit';
  };

  const canTriggerSchedule = () => {
    // Admin, Operator-Monitor-and-Control, Operator-Monitor-Control-and-Edit can trigger
    // Not Required for Operator-Monitor
    return currentUserRole === 'Superadmin' || 
           currentUserRole === 'Admin' || 
           currentUserRole === 'Operator-Monitor-and-Control' ||
           currentUserRole === 'Operator-Monitor-Control-and-Edit';
  };
  
  // Add responsive state for large screens
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const buttonColor = 'var(--app-button)';
  
  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsLargeScreen(width >= 1440);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  
  // Get the fetched schedule details
  const scheduleDetails = useSelector(state => state.schedule.selectedScheduleDetails);
  const detailsLoading = useSelector(state => state.schedule.detailsLoading);
  const detailsError = useSelector(state => state.schedule.detailsError);

  // Get the correct event ID for preconfigured schedules
  const eventId = getEventIdForStatus(event);

  // Always get the latest from Redux
  const preconfigured = useSelector(state => state.schedule.preconfigured);
  const statusArray = useSelector(state => state.schedule.status);
  const toggleLoading = useSelector(state => state.schedule.toggleLoading);

  // Find the preconfigured event from the list using eventId
  const schedule = preconfigured.find(
    s => String(s.href?.split('/').pop()) === String(eventId)
  );
  // Fallback to event if not found
  const displayEvent = schedule || event;

  // Helper to get the enabled state from Redux
  const getIsEnabled = () => {
    // Try to get from status array (updated by enable/disable thunk)
    const statusObj = statusArray.find(
      s => String(s.event_id) === String(eventId)
    );
    if (statusObj) {
      return statusObj.EnableState === 'Enabled';
    }
    // Fallback to displayEvent
    return displayEvent && displayEvent.EnableState === 'Enabled';
  };
  const isEnabled = getIsEnabled();

  // Toggle handler
  const handleToggle = async () => {
    if (toggleLoading) return;
    try {
      if (isEnabled) {
        await dispatch(disableSchedule(eventId)).unwrap();
        setToast({ open: true, message: "Schedule disabled successfully!" });
      } else {
        await dispatch(enableSchedule(eventId)).unwrap();
        setToast({ open: true, message: "Schedule enabled successfully!" });
      }
    } catch (e) {
      setToast({ open: true, message: e?.message || "Toggle failed" });
    }
  };

  const handleTrigger = () => setShowConfirm(true);

  const doTrigger = async () => {
    setShowConfirm(false);
    try {
      await dispatch(triggerSchedule(eventId)).unwrap();
      setToast({ open: true, message: "Triggered successfully!" });
    } catch (e) {
      setToast({ open: true, message: e?.message || "Trigger failed" });
    }
  };

  // Helper to get display time for sunrise/sunset
  function getDisplayTime(event) {
    // Astronomic sunset: map to 18:00 (6pm)
    if (
      (event.event_type && event.event_type.toLowerCase() === 'astronomic' && event.astronomic_type && event.astronomic_type.toLowerCase() === 'sunset') ||
      (event.type && event.type.toLowerCase().includes('sunset')) ||
      (event.name && event.name.toLowerCase().includes('sunset'))
    ) {
      return { hour: '18', minute: '00' };
    }
    // Astronomic sunrise: map to 06:00 (6am)
    if (
      (event.event_type && event.event_type.toLowerCase() === 'astronomic' && event.astronomic_type && event.astronomic_type.toLowerCase() === 'sunrise') ||
      (event.type && event.type.toLowerCase().includes('sunrise')) ||
      (event.name && event.name.toLowerCase().includes('sunrise'))
    ) {
      return { hour: '06', minute: '00' };
    }
    return {
      hour: event.time_of_day ? String(event.time_of_day.Hour).padStart(2, '0') : '',
      minute: event.time_of_day ? String(event.time_of_day.Minute).padStart(2, '0') : '',
    };
  }

  const displayTime = getDisplayTime(displayEvent);

  // Helper to get selected days from the actual data
  const getSelectedDays = (event) => {
    if (!event.days) return [];
    return Object.entries(event.days)
      .filter(([day, selected]) => selected)
      .map(([day]) => {
        const dayMap = {
          'Sunday': 'Sun',
          'Monday': 'Mon', 
          'Tuesday': 'Tue',
          'Wednesday': 'Wed',
          'Thursday': 'Thu',
          'Friday': 'Fri',
          'Saturday': 'Sat'
        };
        return dayMap[day] || day;
      });
  };

  const selectedDays = getSelectedDays(displayEvent);

  // Helper to format dates
  const formatDate = (dateObj) => {
    if (!dateObj || !dateObj.Day || !dateObj.Month || !dateObj.Year) return '';
    return `${dateObj.Year}-${String(dateObj.Month).padStart(2, '0')}-${String(dateObj.Day).padStart(2, '0')}`;
  };

  // FIXED: Check if schedule has custom date range - updated logic
  const hasCustomDateRange = displayEvent.begin_date && displayEvent.end_date && 
    (displayEvent.begin_date.Day || displayEvent.begin_date.day) && 
    (displayEvent.end_date.Day || displayEvent.end_date.day);

  // FIXED: Check if it's weekly schedule with only begin date
  const isWeeklyWithOnlyBeginDate = displayEvent.schedule_type === "DayOfWeek" && 
    displayEvent.begin_date && (displayEvent.begin_date.Day || displayEvent.begin_date.day) &&
    (!displayEvent.end_date || !displayEvent.end_date.Day);

  // Determine which radio button should be selected
  const shouldShowForever = !hasCustomDateRange || isWeeklyWithOnlyBeginDate;

  if (detailsLoading) {
    return <div style={{ color: '#1E75BB', padding: 40, fontSize: 20 }}>Loading schedule details...</div>;
  }

  if (detailsError) {
    return <div style={{ color: 'red', padding: 40, fontSize: 20 }}>Error: {detailsError}</div>;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        position: 'relative',
        minHeight: '90vh',
        maxWidth: isLargeScreen ? '1600px' : '1200px',
        margin: '0 auto',
        padding: isLargeScreen ? '40px' : '32px',
      }}
    >
      {/* Page Heading - Pre-Configured Schedules */}
      <div
        style={{
          width: '100%',
          marginBottom: isLargeScreen ? 40 : 32,
          borderBottom: '2px solid #fff',
          paddingBottom: isLargeScreen ? 20 : 16,
        }}
      >
        <h1
          style={{
            fontWeight: 700,
            fontSize: isLargeScreen ? 32 : 28,
            color: 'white',
            letterSpacing: 0.5,
            margin: 0,
            textAlign: 'center',
          }}
        >
          Pre-Configured Schedules
        </h1>
      </div>

      {/* Main Content Container - Form and Buttons in one line */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          width: '100%',
          gap: isLargeScreen ? 40 : 0,
        }}
      >
        {/* Left: Form */}
        <div
          style={{
            borderRadius: isLargeScreen ? 20 : 16,
            padding: isLargeScreen ? 32 : 24,
            display: 'flex',
            flexDirection: 'column',
            fontSize: isLargeScreen ? 16 : 14,
            alignItems: 'flex-start',
            flex: 1,
            maxWidth: isLargeScreen ? '70%' : '60%',
            marginTop: -10,
          }}
        >
          <div style={{ width: '100%', marginBottom: isLargeScreen ? 16 : 10 }}>
            <label style={{ fontWeight: 600, color: '#333', fontSize: isLargeScreen ? 17 : 15 }}>Schedule Name</label>
            <input
              value={displayEvent.name || 'Schedule Name'}
              placeholder="Schedule Name"
              readOnly
              disabled
              style={{
                width: '100%',
                padding: isLargeScreen ? 14 : 10,
                borderRadius: 8,
                border: '1px solid #b3a789',
                background: '#e0dbce',
                color: '#888',
                fontWeight: 500,
                marginTop: 4,
                fontSize: isLargeScreen ? 17 : 15
              }}
            />
          </div>
          <div style={{ width: '100%', marginBottom: isLargeScreen ? 16 : 10 }}>
            <label style={{ fontWeight: 600, color: '#333', fontSize: isLargeScreen ? 17 : 15 }}>Part of</label>
            <select
              value="Project Time Clock"
              disabled
              style={{
                width: '100%',
                padding: isLargeScreen ? 14 : 10,
                borderRadius: 8,
                border: '1px solid #b3a789',
                background: '#e0dbce',
                color: '#888',
                fontWeight: 500,
                marginTop: 4,
                fontSize: isLargeScreen ? 17 : 15
              }}
            >
              <option>Project Time Clock</option>
            </select>
          </div>
          <div
            style={{
              width: '100%',
              background: 'white',
              opacity: 0.75,
              borderRadius: isLargeScreen ? 20 : 16,
              padding: isLargeScreen ? 24 : 16,
              marginBottom: isLargeScreen ? 20 : 14,
              border: '2px solid #f5f5f2',
              display: 'flex',
              flexDirection: 'column',
              gap: isLargeScreen ? 20 : 16,
              alignItems: 'center',
            }}
          >
            {/* Select Day / Date */}
            <div style={{ width: '100%' }}>
              <div style={{ fontWeight: 600, color: '#333', fontSize: isLargeScreen ? 17 : 15, marginBottom: 10 }}>Select Day / Date</div>
              <div style={{ display: 'flex', gap: isLargeScreen ? 16 : 10, marginBottom: isLargeScreen ? 14 : 10, flexWrap: 'nowrap', justifyContent: 'left', width: '100%' }}>
                <label style={{ display: 'flex', alignItems: 'center', fontWeight: 500, color: '#333', fontSize: isLargeScreen ? 16 : 14 }}>
                  <input 
                    type="radio" 
                    checked 
                    disabled 
                    style={{ 
                      marginRight: 8,
                      accentColor: '#000000',
                      WebkitAppearance: 'none',
                      appearance: 'none',
                      width: isLargeScreen ? '14px' : '12px',
                      height: isLargeScreen ? '14px' : '12px',
                      border: '2px solid #ccc',
                      borderRadius: '50%',
                      backgroundColor: '#000000',
                      position: 'relative'
                    }} 
                  /> 
                  Weekly
                </label>
                <label style={{ display: 'flex', alignItems: 'center', fontWeight: 500, color: '#333', fontSize: isLargeScreen ? 16 : 14 }}>
                  <input 
                    type="radio" 
                    disabled 
                    style={{ 
                      marginRight: 8,
                      accentColor: '#000000',
                      WebkitAppearance: 'none',
                      appearance: 'none',
                      width: isLargeScreen ? '14px' : '12px',
                      height: isLargeScreen ? '14px' : '12px',
                      border: '2px solid #ccc',
                      borderRadius: '50%',
                      backgroundColor: 'transparent',
                      position: 'relative'
                    }} 
                  /> 
                  Annual Date
                </label>
              </div>
              <div style={{ display: 'flex', gap: isLargeScreen ? 6 : 4, marginBottom: 0, justifyContent: 'left', width: '100%' }}>
                {daysArray.map((day, idx) => {
                  const isActive = selectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      disabled
                      style={{
                        padding: isLargeScreen ? '6px 12px' : '4px 8px',
                        borderRadius: 8,
                        background: isActive ? buttonColor : '#fff',
                        color: isActive ? '#fff' : '#222',
                        fontWeight: 500,
                        border: '1px solid #b3a789',
                        fontSize: isLargeScreen ? 15 : 13,
                        marginBottom: 0,
                        opacity: 1,
                        minWidth: isLargeScreen ? 44 : 36,
                        maxWidth: isLargeScreen ? 48 : 40,
                        cursor: 'not-allowed',
                      }}
                    >{day}</button>
                  );
                })}
              </div>
            </div>
            {/* Select Time */}
            <div style={{ width: '100%' }}>
              <div style={{ fontWeight: 600, color: '#333', fontSize: isLargeScreen ? 17 : 15, marginBottom: 10 }}>Select Time</div>
              <div style={{ display: 'flex', gap: isLargeScreen ? 12 : 8 }}>
                <input
                  type="text"
                  value={displayTime.hour}
                  placeholder="HH"
                  readOnly
                  disabled
                  style={{
                    width: isLargeScreen ? 50 : 40,
                    padding: isLargeScreen ? 12 : 8,
                    borderRadius: 8,
                    border: '1px solid #b3a789',
                    background: '#fff',
                    color: '#888',
                    fontWeight: 600,
                    textAlign: 'center',
                    fontSize: isLargeScreen ? 17 : 15
                  }}
                />
                <span style={{ color: '#333', fontWeight: 600, fontSize: isLargeScreen ? 22 : 18 }}>:</span>
                <input
                  type="text"
                  value={displayTime.minute}
                  placeholder="MM"
                  readOnly
                  disabled
                  style={{
                    width: isLargeScreen ? 50 : 40,
                    padding: isLargeScreen ? 12 : 8,
                    borderRadius: 8,
                    border: '1px solid #b3a789',
                    background: '#fff',
                    color: '#888',
                    fontWeight: 600,
                    textAlign: 'center',
                    fontSize: isLargeScreen ? 17 : 15
                  }}
                />
              </div>
              {/* Show event type if it's astronomic */}
              {displayEvent.event_type === 'Astronomic' && (
                <div style={{ marginTop: 10, fontSize: isLargeScreen ? 16 : 14, color: '#7a7462', fontWeight: 500 }}>
                  Type: {displayEvent.astronomic_type} {displayEvent.astronomic_offset && `(${displayEvent.astronomic_offset})`}
                </div>
              )}
            </div>
            {/* Keep Until */}
            <div style={{ width: '100%' }}>
              <div style={{ fontWeight: 600, color: '#333', fontSize: isLargeScreen ? 17 : 15, marginBottom: 10 }}>Keep Until</div>
              <div style={{ display: 'flex', gap: isLargeScreen ? 24 : 18 }}>
                <label style={{ color: '#333', fontWeight: 500, fontSize: isLargeScreen ? 16 : 14 }}>
                  <input 
                    type="radio" 
                    disabled 
                    checked={shouldShowForever} 
                    style={{ 
                      marginRight: 8,
                      accentColor: '#000000',
                      WebkitAppearance: 'none',
                      appearance: 'none',
                      width: isLargeScreen ? '14px' : '12px',
                      height: isLargeScreen ? '14px' : '12px',
                      border: '2px solid #ccc',
                      borderRadius: '50%',
                      backgroundColor: shouldShowForever ? '#000000' : 'transparent',
                      position: 'relative'
                    }} 
                  /> 
                  Forever
                </label>
                <label style={{ color: '#333', fontWeight: 500, fontSize: isLargeScreen ? 16 : 14 }}>
                  <input 
                    type="radio" 
                    disabled 
                    checked={!shouldShowForever} 
                    style={{ 
                      marginRight: 8,
                      accentColor: '#000000',
                      WebkitAppearance: 'none',
                      appearance: 'none',
                      width: isLargeScreen ? '14px' : '12px',
                      height: isLargeScreen ? '14px' : '12px',
                      border: '2px solid #ccc',
                      borderRadius: '50%',
                      backgroundColor: !shouldShowForever ? '#000000' : 'transparent',
                      position: 'relative'
                    }} 
                  /> 
                  Custom Dates
                </label>
              </div>
              {/* Show custom date range in the Keep Until section */}
              {hasCustomDateRange && (
                <div style={{ marginTop: isLargeScreen ? 14 : 10 }}>
                  {/* Custom Date Range - styled as bubbles/tags */}
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: isLargeScreen ? 8 : 6,
                    marginBottom: isLargeScreen ? 20 : 16
                  }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        background: '#e3f2fd',
                        color: '#1976d2',
                        borderRadius: 14,
                        padding: isLargeScreen ? '6px 14px' : '4px 10px',
                        fontSize: isLargeScreen ? 14 : 12,
                        fontWeight: 500,
                        border: '1px solid #bbdefb',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    >
                      From: {formatDate(displayEvent.begin_date)}
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        background: '#e3f2fd',
                        color: '#1976d2',
                        borderRadius: 14,
                        padding: isLargeScreen ? '6px 14px' : '4px 10px',
                        fontSize: isLargeScreen ? 14 : 12,
                        fontWeight: 500,
                        border: '1px solid #bbdefb',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    >
                      To: {formatDate(displayEvent.end_date)}
                    </span>
                  </div>
                  
                  {/* Exception Dates Section */}
                  <div style={{ marginTop: isLargeScreen ? 20 : 16 }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: isLargeScreen ? 10 : 8, 
                      marginBottom: isLargeScreen ? 10 : 8 
                    }}>
                      <span style={{ 
                        fontWeight: 600, 
                        color: '#d32f2f', 
                        fontSize: isLargeScreen ? 16 : 14 
                      }}>
                        Exception Dates:
                      </span>
                      <span style={{ 
                        color: '#666', 
                        fontSize: isLargeScreen ? 14 : 12 
                      }}>
                        ({displayEvent.exception_dates ? displayEvent.exception_dates.length : 0} date{displayEvent.exception_dates && displayEvent.exception_dates.length !== 1 ? 's' : ''})
                      </span>
                    </div>
                    
                    {/* Show exception dates if they exist */}
                    {displayEvent.exception_dates && displayEvent.exception_dates.length > 0 && (
                      <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: isLargeScreen ? 8 : 6 
                      }}>
                        {displayEvent.exception_dates.map((date, idx) => (
                          <span
                            key={idx}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              background: '#ffebee',
                              color: '#d32f2f',
                              borderRadius: 14,
                              padding: isLargeScreen ? '6px 14px' : '4px 10px',
                              fontSize: isLargeScreen ? 14 : 12,
                              fontWeight: 500,
                              border: '1px solid #ffcdd2',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }}
                          >
                            {formatDate(date)}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* If no exception dates exist, show a message */}
                    {(!displayEvent.exception_dates || displayEvent.exception_dates.length === 0) && (
                      <div style={{ 
                        color: '#666', 
                        fontSize: isLargeScreen ? 14 : 12,
                        fontStyle: 'italic'
                      }}>
                        No exception dates defined
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Controls - Aligned with form */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            minWidth: isLargeScreen ? 240 : 200,
            marginTop: -10,
            paddingTop: 0,
          }}
        >
          {/* Enable/Disable toggle and Trigger buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: isLargeScreen ? 20 : 16,
            }}
          >
            {/* Toggle Switch - Show but disable based on permissions */}
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: canEnableDisableSchedule() ? 'pointer' : 'not-allowed',
              opacity: canEnableDisableSchedule() ? 1 : 0.5
            }}>
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={canEnableDisableSchedule() ? handleToggle : undefined}
                disabled={toggleLoading || !canEnableDisableSchedule()}
                style={{ width: 0, height: 0, opacity: 0, position: 'absolute' }}
              />
              <span style={{
                display: 'inline-block',
                width: isLargeScreen ? 60 : 54,
                height: isLargeScreen ? 32 : 28,
                background: canEnableDisableSchedule() 
                  ? (isEnabled ? '#43a047' : 'red')
                  : '#666', // Gray when disabled
                borderRadius: isLargeScreen ? 16 : 14,
                position: 'relative',
                transition: 'background 0.2s',
              }}>
                <span style={{
                  position: 'absolute',
                  left: isEnabled ? (isLargeScreen ? 32 : 28) : (isLargeScreen ? 4 : 4),
                  top: isLargeScreen ? 4 : 4,
                  width: isLargeScreen ? 24 : 20,
                  height: isLargeScreen ? 24 : 20,
                  background: canEnableDisableSchedule() ? '#fff' : '#ccc', // Gray circle when disabled
                  borderRadius: '50%',
                  transition: 'left 0.2s',
                  boxShadow: canEnableDisableSchedule() ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
                }} />
              </span>
            </label>
            {/* Trigger Button - Show but disable based on permissions */}
            <button
              onClick={canTriggerSchedule() ? handleTrigger : undefined}
              disabled={!canTriggerSchedule()}
              style={{
                background: canTriggerSchedule() ? '#222' : '#666',
                color: canTriggerSchedule() ? '#fff' : '#999',
                border: 'none',
                borderRadius: 10,
                padding: isLargeScreen ? '12px 28px' : '8px 22px',
                fontWeight: 600,
                fontSize: isLargeScreen ? 17 : 15,
                cursor: canTriggerSchedule() ? 'pointer' : 'not-allowed',
                opacity: canTriggerSchedule() ? 1 : 0.7
              }}
            >
              Trigger
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Close button */}
      <button
        style={{
          position: 'absolute',
          bottom: isLargeScreen ? 40 : 32,
          right: isLargeScreen ? 40 : 32,
          background: '#222',
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          padding: isLargeScreen ? '12px 32px' : '10px 28px',
          fontWeight: 600,
          fontSize: isLargeScreen ? 17 : 15,
          cursor: 'pointer',
        }}
        onClick={() => navigate(-1)}
      >
        Close
      </button>
      {message && (
        <div style={{
          position: 'fixed',
          top: 30,
          right: 30,
          background: '#222',
          color: '#fff',
          padding: isLargeScreen ? '12px 28px' : '10px 24px',
          borderRadius: 10,
          fontWeight: 600,
          fontSize: isLargeScreen ? 18 : 16,
          zIndex: 9999,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          {message}
        </div>
      )}
      <ConfirmDialog
        open={showConfirm}
        title="Are you sure?"
        message="Do you want to trigger this event?"
        onConfirm={doTrigger}
        onCancel={() => setShowConfirm(false)}
      />
      <Toast
        open={toast.open}
        message={toast.message}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </div>
  );
}

export default UpdatePreconfigurdEvent; 
