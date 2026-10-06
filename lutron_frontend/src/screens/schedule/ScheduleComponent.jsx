import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSchedules, fetchScheduleGroups, fetchScheduleDetails } from '../../redux/slice/schedule/scheduleSlice';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ScheduleDetails from "./ScheduleDetails";
import { UseAuth } from '../../customhooks/UseAuth';
import { selectProfile } from '../../redux/slice/auth/userlogin';

// Helper: get current week dates (Mon–Sun)
function getCurrentWeekDates(offset = 0) {
  const today = new Date();
  today.setDate(today.getDate() + offset * 7);
  const first = today.getDate() - today.getDay() + 1;
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(first + i);
    return d;
  });
}

// Helper function to get the correct event ID for status lookup
function getEventIdForStatus(event) {
  if (!event) return "";
  if (event.id) return String(event.id);
  if (event.timeclock_id) return String(event.timeclock_id);
  if (event.href && event.href.includes("/")) return event.href.split('/').pop();
  return "";
}

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const fullDaysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function getEventStatus(eventId, statusList) {
  const found = statusList.find((s) => s.event_id === eventId);
  return found && found.EnableState === 'Enabled' ? 'active' : 'inactive';
}

function pad(num) {
  return String(num).padStart(2, '0');
}

function getEventTime(event) {
  // If we have the actual time stored, use it
  if (event.actualTime) {
    return event.actualTime;
  }
  
  // Handle astronomic events - FIXED: Check for astronomic_type properly
  if (
    (event.event_type && event.event_type.toLowerCase() === 'astronomic' && event.astronomic_type && event.astronomic_type.toLowerCase() === 'sunset') ||
    (event.type && event.type.toLowerCase().includes('sunset')) ||
    (event.name && event.name.toLowerCase().includes('sunset'))
  ) {
    return '18:00';
  }
  if (
    (event.event_type && event.event_type.toLowerCase() === 'astronomic' && event.astronomic_type && event.astronomic_type.toLowerCase() === 'sunrise') ||
    (event.type && event.type.toLowerCase().includes('sunrise')) ||
    (event.name && event.name.toLowerCase().includes('sunrise'))
  ) {
    return '06:00';
  }
  // Handle fixed time events
  if (event.time_of_day) {
    const hour = event.time_of_day.Hour ?? event.time_of_day.hour ?? 0;
    const minute = event.time_of_day.Minute ?? event.time_of_day.minute ?? 0;
    return `${pad(hour)}:${pad(minute)}`;
  }
  return '00:00';
}

function getScheduleNames(events) {
  // Use schedule_name if present, else fallback to event.name
  const names = events.map(e => e.schedule_name || e.name).filter(Boolean);
  return Array.from(new Set(names));
}

// Define DialogContent above ScheduleComponent

function isToday(dateObj) {
  const now = new Date();
  return (
    dateObj.getDate() === now.getDate() &&
    dateObj.getMonth() === now.getMonth() &&
    dateObj.getFullYear() === now.getFullYear()
  );
}

function ScheduleComponent() {
  const dispatch = useDispatch();
  const {
    preconfigured = [],
    internal = [],
    loading,
    error,
    schedulesLoaded,
    groups = [],
    groupsLoading,
    groupsError,
    selectedScheduleDetails,
    selectedScheduleAreas,
    detailsLoading,
  } = useSelector((state) => state.schedule);

  // Get user role and profile for role-based filtering
  const { role: currentUserRole } = UseAuth();
  const userProfile = useSelector(selectProfile);

  // Role-based access control for creating new events based on Excel sheet
  const canCreateSchedule = () => {
    // Superadmin and Admin can always create schedules
    if (currentUserRole === 'Superadmin' || currentUserRole === 'Admin') {
      return true;
    }
    
    // For Operators, check if they have monitor_control_edit permission
    if (currentUserRole === 'Operator' && userProfile && userProfile.floors) {
      const hasMonitorControlEdit = userProfile.floors.some(f => f.floor_permission === 'monitor_control_edit');
      return hasMonitorControlEdit;
    }
    
    return false;
  };

  const navigate = useNavigate();

  const [selectedFilter, setSelectedFilter] = useState("All Schedules");
  const scrollRef = useRef(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(0);
  const [weekOffset, setWeekOffset] = useState(0);
  const [calendar, setCalendar] = useState({});
  const hasInitialized = useRef(false);
  const [showAllEvents, setShowAllEvents] = useState(false); // Debug flag
  const [ignoreDateConstraints, setIgnoreDateConstraints] = useState(false); // Debug flag for date constraints
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // Add/remove CSS class to body to prevent scroll
  useEffect(() => {
    document.body.classList.add('schedule-page');
    document.getElementById('root')?.classList.add('schedule-page');
    
    return () => {
      document.body.classList.remove('schedule-page');
      document.getElementById('root')?.classList.remove('schedule-page');
    };
  }, []);

  // FIXED: Single useEffect for initial data loading - no continuous API calls
  useEffect(() => {
    // Only fetch once on mount
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      dispatch(fetchSchedules());
      dispatch(fetchScheduleGroups());
    }
  }, []); // Empty dependency array - only run once on mount

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

  // Get current week dates
  const weekDates = getCurrentWeekDates(weekOffset);

  // Calculate responsive dimensions first
  const isLargeScreen = windowSize.width >= 1920; // 4K and large screens
  const isDesktop = windowSize.width >= 1366; // Desktop screens (including large laptops)
  const isLaptop = windowSize.width >= 1024 && windowSize.width < 1366; // Laptop screens only
  const buttonColor = 'var(--app-button)';

  // Always show all 24 hours with scroll functionality
  const getTimeSlots = () => {
    // Show all time slots (00:00-23:00) for all screen sizes with scroll
    return [
      '00:00','01:00','02:00','03:00','04:00','05:00',
      '06:00', // First 06:00 row
      '06:00', // Second 06:00 row (duplicate)
      '07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00',
      '18:00', // First 18:00 row
      '18:00', // Second 18:00 row (duplicate)
      '19:00','20:00','21:00','22:00','23:00'
    ];
  };

  // Get time slots for calendar rows
  const timeSlots = getTimeSlots();

  const calendarRows = timeSlots.map((time, index) => ({
    type: 'time',
    time,
    label: time.slice(0,2),
    index // Add index to help identify which duplicate row we're on
  }));

  // Calculate table height based on screen size
  const getTableHeight = () => {
    const baseHeight = windowSize.height;
    const requiredHeight = 26 * getRowHeight() + 80; // Height needed for all 26 time slots
    
    if (isLargeScreen) {
      // Large screens: Show all 26 time slots without scroll
      return requiredHeight;
    } else if (isDesktop) {
      // Desktop: Show all 26 time slots if screen can fit, otherwise use available space
      return Math.min(requiredHeight, baseHeight - 200);
    } else {
      // Regular laptops and smaller screens: Show maximum rows with scroll
      return Math.min(baseHeight - 150, 600);
    }
  };

  // Calculate row height based on screen size - compact for better fit
  const getRowHeight = () => {
    if (isLargeScreen) return 35; // Compact for large screens
    if (isDesktop) return 30; // Compact for desktop
    // All laptops and smaller screens: Very compact rows
    return 25; // Very compact rows to show maximum hours
  };

  // Calculate column width based on screen size
  const getColumnWidth = () => {
    if (isLargeScreen) return 180; // Wider columns for big screens
    if (isDesktop) return 160; // Medium columns for desktop
    if (isLaptop) return 140; // Smaller columns for laptop
    return 120; // Compact columns for smaller screens
  };

  // Filtering logic - Backend already handles role-based filtering
  let filteredEvents = [];
  if (selectedFilter === "All Schedules") {
    // Backend already filters internal schedules based on user permissions
    // Preconfigured schedules are visible to all users
    filteredEvents = [...internal, ...preconfigured];
  } else if (selectedFilter === "Project Time Clock") {
    // Preconfigured schedules are visible to all users
    filteredEvents = preconfigured;
  } else {
    // Filter by group id - backend already filtered by permissions
    filteredEvents = internal.filter(sch =>
      String(sch.group_id) === String(selectedFilter)
    );
  }

  // FIXED: Calculate calendar with memoization to prevent continuous re-renders
  useEffect(() => {
    // Only recalculate if we have data to work with
    if (internal.length === 0 && preconfigured.length === 0) {
      return;
    }

    // Get time slots inside useEffect to avoid dependency issues
    const timeSlots = getTimeSlots();
    
    // Initialize calendar structure with responsive time slots
    const newCalendar = {};
    weekDates.forEach(dateObj => {
      const dateKey = dateObj.toDateString();
      newCalendar[dateKey] = {};
      timeSlots.forEach(time => {
        newCalendar[dateKey][time] = [];
      });
    });
    
    filteredEvents.forEach(event => {
      
      weekDates.forEach((dateObj) => {
        let shouldIncludeEvent = false;
        
        // Handle DayOfWeek schedules (both internal and preconfigured)
        if (event.schedule_type === "DayOfWeek" && event.days) {
          const jsDay = dateObj.getDay() === 0 ? 6 : dateObj.getDay() - 1; // 0=Sun, 1=Mon...
          const fullDayName = fullDaysOfWeek[jsDay];
          if (event.days[fullDayName]) {
            shouldIncludeEvent = true;
          }
        }
        
        // Handle SpecificDates schedules
        if (event.schedule_type === "SpecificDates" && event.specific_dates) {
          const eventDateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
          
          const isSpecificDate = event.specific_dates.some(specificDate => {
            // Handle both possible formats: {Year, Month, Day} or {year, month, day}
            const specificYear = specificDate.Year || specificDate.year;
            const specificMonth = specificDate.Month || specificDate.month;
            const specificDay = specificDate.Day || specificDate.day;
            
            if (specificYear && specificMonth && specificDay) {
              const specificDateStr = `${specificYear}-${String(specificMonth).padStart(2, '0')}-${String(specificDay).padStart(2, '0')}`;
              return specificDateStr === eventDateStr;
            }
            return false;
          });
          
          if (isSpecificDate) {
            shouldIncludeEvent = true;
          }
        }
        
        // Handle preconfigured events that might have different structure
        if (!event.schedule_type && event.type) {
          // For preconfigured events, check if they should run on this day
          const jsDay = dateObj.getDay() === 0 ? 6 : dateObj.getDay() - 1;
          const fullDayName = fullDaysOfWeek[jsDay];
          
          // Check if this is a daily event or specific day event
          if (event.days && event.days[fullDayName]) {
            shouldIncludeEvent = true;
          } else if (!event.days && event.type.toLowerCase().includes('daily')) {
            // Daily events run every day
            shouldIncludeEvent = true;
          }
        }
        
        // If event should be included, add it to calendar
        if (shouldIncludeEvent) {
          const eventTime = getEventTime(event);
          
          // Check begin_date and end_date constraints
          let shouldAddEvent = true;
          
          // Check begin_date and end_date constraints for weekly schedules
          if (!ignoreDateConstraints && event.begin_date && event.end_date && 
              Object.keys(event.begin_date).length > 0 && Object.keys(event.end_date).length > 0) {
            
            const beginYear = event.begin_date.year || event.begin_date.Year;
            const beginMonth = event.begin_date.month || event.begin_date.Month;
            const beginDay = event.begin_date.day || event.begin_date.Day;
            
            const endYear = event.end_date.year || event.end_date.Year;
            const endMonth = event.end_date.month || event.end_date.Month;
            const endDay = event.end_date.day || event.end_date.Day;
            
            if (beginYear && beginMonth && beginDay && endYear && endMonth && endDay) {
              const beginDate = new Date(beginYear, beginMonth - 1, beginDay);
              const endDate = new Date(endYear, endMonth - 1, endDay);
              
              // For weekly schedules with custom date range, check if the specific date falls within the range
              const currentDate = new Date(dateObj);
              currentDate.setHours(0, 0, 0, 0);
              
              // Check if the current date falls within the custom date range
              if (currentDate < beginDate || currentDate > endDate) {
                shouldAddEvent = false;
              }
            }
          }
          
          // Add event if it passes all constraints
          if (shouldAddEvent) {
            // FIXED: Add null check before calling find
            const dateKey = dateObj.toDateString();
            
            // Map the actual event time to the appropriate hour slot for display
            // e.g., 6:30 should appear in the 06:00 slot, 14:15 should appear in the 14:00 slot
            const [eventHour, eventMinute] = eventTime.split(':').map(Number);
            const displayTimeSlot = `${String(eventHour).padStart(2, '0')}:00`;
            
            const timeSlot = newCalendar[dateKey]?.[displayTimeSlot];
            
            if (timeSlot && Array.isArray(timeSlot)) {
              // Check if event already exists at this time slot to avoid duplicates
              const existingEvent = timeSlot.find(e => e.id === event.id);
              if (!existingEvent) {
                // Add the actual event time to the event object for display
                const eventWithTime = {
                  ...event,
                  actualTime: eventTime
                };
                timeSlot.push(eventWithTime);
              }
            } else {
              // Initialize the time slot if it doesn't exist
              if (!newCalendar[dateKey]) {
                newCalendar[dateKey] = {};
              }
              if (!newCalendar[dateKey][time]) {
                newCalendar[dateKey][time] = [];
              }
              newCalendar[dateKey][time].push(event);
            }
          }
        }
      });
    });
    
    setCalendar(newCalendar);
  }, [internal, preconfigured, selectedFilter, weekOffset]); // Removed timeList to prevent infinite loop

  // Handler for dropdown
  const handleScheduleChange = (e) => {
    setSelectedFilter(e.target.value);
  };

  // Handler for Add Event button
  const handleAddEvent = () => {
    navigate('/schedule/add-event');
  };

  // Scroll to 6AM on mount for all screens
  useEffect(() => {
    if (scrollRef.current) {
      // Always scroll to 6AM for all screens since we have internal scroll
      const rowHeight = getRowHeight();
      scrollRef.current.scrollTop = 6 * rowHeight; // Scroll to 6AM (6th row)
    }
  }, [windowSize.width]); // Re-calculate when screen size changes

  // Get all unique schedule names for dropdown
  const scheduleNames = getScheduleNames(filteredEvents);

  // Dropdown options construction - Backend already filters groups by permissions
  const getDropdownOptions = () => {
    const options = [
      { label: "All Schedules", value: "All Schedules" }
    ];
    
    // Backend already filters groups based on user permissions
    if (groups && groups.length > 0) {
      options.push(...groups.map(g => ({ 
        label: g.name, 
        value: String(g.id) 
      })));
    }
    
    // Add "Project Time Clock" at the end
    options.push({ label: "Project Time Clock", value: "Project Time Clock" });
    
    return options;
  };

  const dropdownOptions = getDropdownOptions();


  // FIXED: Add counters for sunrise/sunset rows like in reference code
  let sixRendered = 0;
  let eighteenRendered = 0;

  const handleEventClick = (event) => {
    if (internal.some(e => e.id === event.id)) {
      navigate(`/schedule/details/${event.id}`);
    } else {
      navigate('/schedule/update-preconfigured-event', { state: { event } });
    }
  };

  // Add function to check if a quick control is used by any schedules
  const isQuickControlUsedBySchedules = (quickControlId) => {
    const allSchedules = [...internal, ...preconfigured];
    return allSchedules.some(schedule => 
      schedule.quick_control_id === quickControlId || 
      schedule.quick_control_id === String(quickControlId)
    );
  };

  // Add function to get schedules using a quick control
  const getSchedulesUsingQuickControl = (quickControlId) => {
    const allSchedules = [...internal, ...preconfigured];
    return allSchedules.filter(schedule => 
      schedule.quick_control_id === quickControlId || 
      schedule.quick_control_id === String(quickControlId)
    );
  };

  // Debug function to create a test schedule with current dates
  const createTestSchedule = async () => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    const testPayload = {
      name: "Test Schedule",
      schedule_group_id: 1,
      schedule_type: "DayOfWeek",
      days: {
        "Monday": true,
        "Tuesday": true,
        "Wednesday": true,
        "Thursday": true,
        "Friday": true
      },
      time_of_day: {
        Hour: 10,
        Minute: 0,
        Second: 0
      },
      schedule_span: "CustomDates",
      begin_date: {
        Day: today.getDate(),
        Month: today.getMonth() + 1,
        Year: today.getFullYear()
      },
      end_date: {
        Day: nextWeek.getDate(),
        Month: nextWeek.getMonth() + 1,
        Year: nextWeek.getFullYear()
      },
      areas: [
        {
          floor_id: 1,
          area_id: 1,
          actions: [
            {
              type: "scene",
              scene_code: 1,
              scene_name: "Test Scene"
            }
          ]
        }
      ]
    };

    try {
      const { createSchedule } = await import('../../redux/slice/schedule/scheduleSlice');
      await dispatch(createSchedule(testPayload));
      await dispatch(fetchSchedules());
    } catch (error) {
      // Failed to create test schedule
    }
  };

  const rowHeight = getRowHeight();
  const columnWidth = getColumnWidth();
  const tableHeight = getTableHeight();

  return (
    <div className="schedule-container" style={{
      height: 'calc(100vh - 180px)',
      fontFamily: 'Inter, Arial, sans-serif',
      padding: 0,
      overflow: 'hidden',
      maxHeight: 'calc(100vh - 180px)',
      width: '100%'
    }}>
      {/* Show loading indicator only when initially loading */}
      {loading && (
        <div style={{ 
          position: 'fixed', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '8px',
          zIndex: 1000
        }}>
          Loading schedules...
        </div>
      )}
      
      <div style={{
        height: 'calc(100vh - 160px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        width: '100%',
        maxHeight: 'calc(100vh - 160px)',
        boxSizing: 'border-box',
        padding: '0 0 0 0'
      }}>
        {/* Schedule Label */}
        <h2 style={{
          color: '#fff',
          fontWeight: 600,
          fontSize: 24,
          letterSpacing: 0.5,
          marginBottom: 16,
          flexShrink: 0,
          paddingTop: '0px',
          marginTop: '0px',
          marginLeft: '0px',
          paddingLeft: '0px'
        }}>Schedule</h2>
        
        {/* Dropdown and Add Event button row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12,
          flexShrink: 0
        }}>
          <select
            value={selectedFilter}
            onChange={e => setSelectedFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #e0e0e0',
              fontSize: 14,
              background: '#fafbfc',
              color: '#222',
              fontWeight: 500,
              outline: 'none',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              minWidth: 200
            }}
          >
            {dropdownOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          
          {/* Week Navigation - positioned between dropdown and Add Event button */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isLargeScreen ? 15 : 10
          }}>
            <button 
              style={{
                backgroundColor: buttonColor, 
                color: '#fff', 
                border: 'none', 
                borderRadius: 8, 
                padding: isLargeScreen ? '10px 20px' : '8px 16px', 
                fontWeight: 500, 
                fontSize: isLargeScreen ? 14 : 12, 
                cursor: 'pointer', 
                boxShadow: '0 2px 8px rgba(30,117,187,0.08)', 
                transition: 'background 0.2s'
              }} 
              onClick={() => setWeekOffset(weekOffset - 1)}
            >
              Previous Week
            </button>
            <span style={{ 
              color: '#fff', 
              fontWeight: 600, 
              fontSize: isLargeScreen ? 16 : 14
            }}>
              {weekDates[0].toLocaleDateString()} - {weekDates[6].toLocaleDateString()}
            </span>
            <button 
              style={{
                backgroundColor: buttonColor, 
                color: '#fff', 
                border: 'none', 
                borderRadius: 8, 
                padding: isLargeScreen ? '10px 20px' : '8px 16px', 
                fontWeight: 500, 
                fontSize: isLargeScreen ? 14 : 12, 
                cursor: 'pointer', 
                boxShadow: '0 2px 8px rgba(30,117,187,0.08)', 
                transition: 'background 0.2s'
              }}  
              onClick={() => setWeekOffset(weekOffset + 1)}
            >
              Next Week
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: isLargeScreen ? 15 : 10, alignItems: 'center' }}>
            {/* Debug toggles */}
            {/* <label style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#fff', fontSize: 12 }}>
              <input
                type="checkbox"
                checked={showAllEvents}
                onChange={(e) => setShowAllEvents(e.target.checked)}
                style={{ margin: 0 }}
              />
              Show All Events
            </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#fff', fontSize: 12 }}>
                <input
                  type="checkbox"
                  checked={ignoreDateConstraints}
                  onChange={(e) => setIgnoreDateConstraints(e.target.checked)}
                  style={{ margin: 0 }}
                />
                Ignore Date Constraints
              </label>
              <button
                onClick={createTestSchedule}
                style={{
                  background: '#1E75BB',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  padding: '4px 8px',
                  fontSize: 10,
                  cursor: 'pointer'
                }}
              >
                Create Test Schedule
              </button> */}
            {/* Add Event Button - Only show for users with create permission */}
            {canCreateSchedule() && (
              <button
                onClick={handleAddEvent}
                style={{
                  background: buttonColor,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: isLargeScreen ? '12px 32px' : '10px 28px',
                  fontWeight: 500,
                  fontSize: isLargeScreen ? 16 : 14,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(30,117,187,0.08)',
                  transition: 'background 0.2s'
                }}
              >
                + Add Event
              </button>
            )}
          </div>
        </div>
        
        {/* Calendar Table */}
        <div
          style={{
            flex: 1,
            borderRadius: 14,
            background: '#676050',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            border: '1px solid #e0e0e0',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            maxHeight: 'calc(100vh - 200px)', // Further reduced to prevent main container scroll
            boxSizing: 'border-box'
          }}
        >
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflow: 'auto',
              borderRadius: 14,
              position: 'relative',
              minHeight: 0,
              maxHeight: '100%' // Ensure it doesn't exceed container
            }}
          >
            <table style={{
              width: '100%',
              height: 'auto',
              borderCollapse: 'separate',
              borderSpacing: 0,
              color: '#222',
              fontSize: 14
            }}>
              <thead>
                <tr>
                  <th style={{
                    width: 80,
                    fontSize: 14,
                    textAlign: 'center',
                    padding: 10,
                    background: '#676050',
                    border: 'none',
                    position: 'sticky',
                    left: 0,
                    top: 0,
                    zIndex: 3
                  }}></th>
                  {daysOfWeek.map((dayLabel, idx) => (
                    <th key={dayLabel} style={{
                      fontSize: 14,
                      textAlign: 'center',
                      padding: '12px 8px',
                      background: '#676050',
                      border: 'none',
                      minWidth: 120,
                      fontWeight: 500,
                      position: 'sticky',
                      top: 0,
                      zIndex: 3,
                      ...(isToday(weekDates[idx]) ? { background: '#1E75BB', color: '#fff' } : {})
                    }}>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        gap: 6
                      }}>
                        <span style={{ fontWeight: 500, fontSize: 14, color: 'white' }}>{dayLabel}</span>
                        <span style={{ fontWeight: 500, fontSize: 14, color: 'white' }}>{weekDates[idx].getDate()}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {calendarRows.map((row, rowIdx) => {
                  let showSunrise = false;
                  let showSunset = false;
                  let skipEvents = false;
                  
                  // FIXED: Use counters like in reference code for proper sunrise/sunset handling
                  if (row.time === '06:00') {
                    sixRendered++;
                    if (sixRendered === 1) {
                      showSunrise = true; // Show label in first 06:00 row
                    }
                    if (sixRendered === 2) {
                      skipEvents = true; // No events in second 06:00 row
                    }
                  }
                  if (row.time === '18:00') {
                    eighteenRendered++;
                    if (eighteenRendered === 1) {
                      showSunset = true; // Show label in first 18:00 row
                    }
                    if (eighteenRendered === 2) {
                      skipEvents = true; // No events in second 18:00 row
                    }
                  }
                  
                  return (
                    <tr key={row.time + '-' + rowIdx}>
                      <td style={{
                        background: '#676050',
                        minWidth: 80,
                        border: 'none',
                        position: 'sticky',
                        left: 0,
                        zIndex: 2,
                        height: rowHeight,
                        padding: 0,
                        verticalAlign: 'top',
                        textAlign: 'right'
                      }}>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          justifyContent: 'flex-start',
                          height: '100%',
                          margin: 0,
                          padding: '0 8px'
                        }}>
                          <span style={{
                            color: 'white',
                            fontWeight: 500,
                            fontSize: 14,
                            width: '100%',
                            textAlign: 'right',
                            lineHeight: 'normal',
                            margin: 0,
                            padding: 0,
                            minWidth: 0
                          }}>
                            {row.label}
                          </span>
                          {showSunrise && (
                            <span style={{
                              display: 'inline-block',
                              background: '#fff',
                              color: '#222',
                              borderRadius: 8,
                              padding: isLargeScreen ? '6px 20px 6px 14px' : '4px 18px 4px 12px',
                              fontWeight: 700,
                              fontSize: isLargeScreen ? 16 : 15,
                              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                              marginTop: isLargeScreen ? 6 : 4,
                              lineHeight: 1,
                              marginLeft: 0
                            }}>Sunrise</span>
                          )}
                          {showSunset && (
                            <span style={{
                              display: 'inline-block',
                              background: '#fff',
                              color: '#222',
                              borderRadius: 8,
                              padding: isLargeScreen ? '6px 20px 6px 14px' : '4px 18px 4px 12px',
                              fontWeight: 700,
                              fontSize: isLargeScreen ? 16 : 15,
                              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                              marginTop: isLargeScreen ? 6 : 4,
                              lineHeight: 1,
                              marginLeft: 0
                            }}>Sunset</span>
                          )}
                        </div>
                      </td>
                      {weekDates.map((dateObj, idx) => {
                        const dateKey = dateObj.toDateString();
                        const eventsAtThisTime = calendar[dateKey]?.[row.time] || [];
                        
                        return (
                          <td key={idx} style={{
                            minWidth: 120,
                            verticalAlign: 'top',
                            padding: 4,
                            border: '1px solid #e0e0e0',
                            background: '#676050',
                            height: rowHeight,
                            position: 'relative'
                          }}>
                            {/* FIXED: Show events only when not skipping, like in reference code */}
                            {!skipEvents && eventsAtThisTime.map(event => {
                              // Use the helper function to get the correct event ID for status lookup
                              const eventIdForStatus = getEventIdForStatus(event);
                              
                              // FIXED: Better status detection for both internal and preconfigured schedules
                              let isEventEnabled = false;
                              
                              // For internal schedules, check EnableState or is_active
                              if (event.EnableState) {
                                isEventEnabled = event.EnableState === 'Enabled';
                              } else if (event.is_active !== undefined) {
                                isEventEnabled = event.is_active;
                              } else {
                                // For preconfigured schedules, check the status array from the event itself (if available)
                                const st = Array.isArray(event.status)
                                  ? event.status.find(s => String(s.event_id) === String(eventIdForStatus))
                                  : null;
                                isEventEnabled = st ? st.EnableState === 'Enabled' : false;
                              }
                              
                              const bgColor = isEventEnabled
                                ? 'linear-gradient(90deg, #1E75BB 0%, #3A8DFF 100%)'
                                : 'linear-gradient(90deg, #b0b0b0 0%, #d3d3d3 100%)';
                              
                              return (
                                <div
                                  key={eventIdForStatus}
                                  style={{
                                    background: bgColor,
                                    borderRadius: 6,
                                    margin: '1px 0',
                                    padding: '4px 6px',
                                    color: '#fff',
                                    fontSize: 12,
                                    fontWeight: 500,
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    cursor: 'pointer',
                                    border: '1px solid #fff',
                                    transition: 'box-shadow 0.2s'
                                  }}
                                  onClick={() => handleEventClick(event)}
                                >
                                  <div style={{ 
                                    fontSize: 11,
                                    fontWeight: 600,
                                    lineHeight: 1.2
                                  }}>{event.name}</div>
                                  <div style={{ 
                                    fontSize: 10, 
                                    fontWeight: 700, 
                                    marginTop: 2 
                                  }}>
                                    {event.event_type === 'astronomic' && event.astronomic_type === 'sunset' ? 'Sunset' :
                                     event.event_type === 'astronomic' && event.astronomic_type === 'sunrise' ? 'Sunrise' :
                                     getEventTime(event)}
                                  </div>
                                </div>
                              );
                            })}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        {/* Loading and error states */}
        {error && <div style={{ color: '#1E75BB', marginTop: 18, fontWeight: 500 }}>Error: {error}</div>}
        {groupsError && <div style={{ color: 'red', marginTop: 18 }}>Error loading groups: {groupsError}</div>}
        {groupsLoading && <div style={{ color: '#1E75BB', marginTop: 18, fontWeight: 500 }}>Loading groups...</div>}
      </div>
    </div>
  );
}

export default ScheduleComponent;
