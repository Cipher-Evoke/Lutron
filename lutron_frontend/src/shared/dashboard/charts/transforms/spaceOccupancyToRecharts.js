import { parseDateFromState } from '../../utils/dashboardDateState';
import { MONTH_NAME_TO_INDEX } from './chartTransformConstants';

/**
 * Space utilization occupancy API payload -> Recharts row data.
 * Extracted from variant SpaceUtilization.jsx LineChartComponent.
 */
export function spaceOccupancyToRecharts(chartData, options = {}) {
  const {
    selectedDuration,
    currentDate,
    customDateRange = { startDate: '', endDate: '' },
  } = options;

const allData = chartData['x-axis'].map((date, index) => ({
  date: date,
  occupancy: chartData['y-axis']['data'][index] ?? null
}))

let processedChartData = allData;

// For day view, ensure all 24 hours are shown with proper spacing
if (selectedDuration === 'this-day') {
  // Create a map of all actual data points by time for quick lookup
  const dataMap = new Map();
  allData.forEach(item => {
    if (item.date) {
      dataMap.set(item.date, item);
    }
  });

  // Start with ALL actual data points - no purging, no merging
  const complete24HourData = [];

  // Add all actual data points exactly as received from backend
  allData.forEach(item => {
    complete24HourData.push({
      date: item.date,
      occupancy: item.occupancy !== null && item.occupancy !== undefined ? item.occupancy : null
    });
  });

  // Now ensure all 24 hours (00:00 to 23:00) are present for x-axis display
  // Add hour markers only if they don't already exist in the data
  for (let hour = 0; hour < 24; hour++) {
    const hourLabel = `${hour.toString().padStart(2, '0')}:00`;

    // Check if this hour already exists in the data
    const hourExists = complete24HourData.some(item => item.date === hourLabel);

    // If hour doesn't exist, add it with null value to maintain x-axis structure
    if (!hourExists) {
      complete24HourData.push({
        date: hourLabel,
        occupancy: null
      });
    }
  }

  // Sort by time to ensure proper ordering and line connection
  processedChartData = complete24HourData.sort((a, b) => {
    const timeA = a.date || '';
    const timeB = b.date || '';
    return timeA.localeCompare(timeB);
  });
} else if (selectedDuration === 'this-week') {
  // For week view, ensure all 7 days are shown on x-axis
  // Map all data points preserving null values
  const dataMap = new Map();
  allData.forEach(item => {
    if (item.date) {
      dataMap.set(item.date, item);
    }
  });

  // Expected days for a week: Sun, Mon, Tue, Wed, Thu, Fri, Sat
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const timeSlots = [0, 6, 12, 18]; // Expected time slots per day
  const completeWeekData = [];

  // Build complete week structure
  dayNames.forEach(dayName => {
    timeSlots.forEach(timeSlot => {
      const expectedLabel = `${dayName} ${timeSlot}`;
      if (dataMap.has(expectedLabel)) {
        const item = dataMap.get(expectedLabel);
        completeWeekData.push({
          date: expectedLabel,
          occupancy: item.occupancy !== null && item.occupancy !== undefined ? item.occupancy : null
        });
      } else {
        // Add missing time slot with null value to maintain x-axis structure
        completeWeekData.push({
          date: expectedLabel,
          occupancy: null
        });
      }
    });
  });

  // Add any additional data points that don't match the expected structure
  allData.forEach(item => {
    if (item.date && !completeWeekData.some(d => d.date === item.date)) {
      completeWeekData.push({
        date: item.date,
        occupancy: item.occupancy !== null && item.occupancy !== undefined ? item.occupancy : null
      });
    }
  });

  // Sort by day and time
  processedChartData = completeWeekData.sort((a, b) => {
    const dayOrder = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
    const matchA = a.date.match(/^(\w+)\s+(\d+)$/);
    const matchB = b.date.match(/^(\w+)\s+(\d+)$/);

    if (matchA && matchB) {
      const dayA = dayOrder[matchA[1]] ?? 99;
      const dayB = dayOrder[matchB[1]] ?? 99;
      if (dayA !== dayB) return dayA - dayB;
      return parseInt(matchA[2]) - parseInt(matchB[2]);
    }
    return (a.date || '').localeCompare(b.date || '');
  });
} else if (selectedDuration === 'this-year') {
  // For year view, ensure all 12 months × 4 quarters = 48 data points are shown even if they have no data
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Create a map of existing data points by month-quarter key (e.g., "Jan-0", "Jan-1", "Jan-2", "Jan-3")
  const dataMap = new Map();
  allData.forEach(item => {
    if (item.date) {
      // Handle both formats: "Jan-0", "Jan-1", "Dec-3" or "1/2025-0", "12/2025-3"
      const monthQuarterMatch = String(item.date).match(/^([A-Za-z]{3})-(\d+)$/) || String(item.date).match(/^(\d{1,2})\/(\d{4})-(\d+)$/);
      if (monthQuarterMatch) {
        let monthIndex;
        let quarter;

        if (monthQuarterMatch[1].length === 3) {
          // Month name format (Jan, Feb, etc.)
          monthIndex = MONTH_NAME_TO_INDEX[monthQuarterMatch[1]];
          quarter = parseInt(monthQuarterMatch[2]);
        } else {
          // Number format (1, 2, etc.)
          monthIndex = parseInt(monthQuarterMatch[1]) - 1;
          quarter = parseInt(monthQuarterMatch[3]);
        }

        if (monthIndex !== undefined && monthIndex >= 0 && monthIndex < 12 && quarter >= 0 && quarter <= 3) {
          const monthKey = `${monthNames[monthIndex]}-${quarter}`;
          dataMap.set(monthKey, {
            date: `${monthNames[monthIndex]}-${quarter}`,
            occupancy: item.occupancy !== null && item.occupancy !== undefined ? item.occupancy : null
          });
        }
      }
    }
  });

  // Build complete year data with all 12 months × 4 quarters = 48 data points
  const completeYearData = [];
  monthNames.forEach(monthName => {
    // Add all 4 quarters for each month
    for (let quarter = 0; quarter < 4; quarter++) {
      const monthQuarterKey = `${monthName}-${quarter}`;
      if (dataMap.has(monthQuarterKey)) {
        completeYearData.push(dataMap.get(monthQuarterKey));
      } else {
        // Add quarter with null value if no data exists
        completeYearData.push({
          date: `${monthName}-${quarter}`,
          occupancy: null
        });
      }
    }
  });

  processedChartData = completeYearData;
} else if (selectedDuration === 'this-month') {
  // For month view, ensure all days of the month are shown (28/30/31 days)
  const targetDate = parseDateFromState(currentDate);
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create a map of existing data points by day
  const dataMap = new Map();
  allData.forEach(item => {
    if (item.date) {
      const dateStr = String(item.date).trim();
      // Handle format: just day number like "1", "2", "3", etc.
      const dayOnlyMatch = dateStr.match(/^(\d{1,2})$/);
      if (dayOnlyMatch) {
        const day = parseInt(dayOnlyMatch[1]);
        if (day >= 1 && day <= daysInMonth) {
          dataMap.set(day, {
            date: String(day), // Keep original format as "1", "2", etc.
            occupancy: item.occupancy !== null && item.occupancy !== undefined ? item.occupancy : null
          });
        }
      } else {
        // Handle date formats like "1/12", "15/12", "31/12"
        const dateMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})(?:\s+\d+)?$/);
        if (dateMatch) {
          const day = parseInt(dateMatch[1]);
          const dataMonth = parseInt(dateMatch[2]);
          // Check if the date matches the current month
          if (dataMonth === month + 1 && day >= 1 && day <= daysInMonth) {
            dataMap.set(day, {
              date: String(day), // Convert to day number format to match API response
              occupancy: item.occupancy !== null && item.occupancy !== undefined ? item.occupancy : null
            });
          }
        }
      }
    }
  });

  // Build complete month data with all days
  const completeMonthData = [];
  for (let day = 1; day <= daysInMonth; day++) {
    if (dataMap.has(day)) {
      completeMonthData.push(dataMap.get(day));
    } else {
      // Add missing day with null value to maintain x-axis structure
      completeMonthData.push({
        date: String(day), // Use day number format like "1", "2", etc. to match API response
        occupancy: null
      });
    }
  }

  processedChartData = completeMonthData;
} else if (selectedDuration === 'custom') {
  // Check if custom period is a week (7 days) or month (28-31 days)
  let isWeekPeriod = false;
  let isMonthPeriod = false;
  let customStartDate = null;
  let customEndDate = null;
  let diffDays = 0;

  if (customDateRange.startDate && customDateRange.endDate) {
    try {
      const startDate = new Date(customDateRange.startDate);
      const endDate = new Date(customDateRange.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      customStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      customEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      const diffTime = customEndDate.getTime() - customStartDate.getTime();
      diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      // Consider 2-7 day periods as week periods (to show only 0th positions)
      isWeekPeriod = diffDays >= 2 && diffDays <= 7;
      // Check if it's a month period (28-31 days)
      isMonthPeriod = diffDays >= 28 && diffDays <= 31;
    } catch (error) {
      isWeekPeriod = false;
      isMonthPeriod = false;
    }
  }

  if (isWeekPeriod) {
    // CRITICAL: First filter allData to only include 0th positions before processing
    // This ensures we never add non-0th positions to the chart data
    const filteredAllData = allData.filter(item => {
      if (!item.date) return false;
      const dateStr = String(item.date).trim();
      const match = dateStr.match(/^([A-Za-z]{3})\s+(\d+)$/);
      // Only include 0th positions
      return match && parseInt(match[2]) === 0;
    });

    // Use filtered data instead of allData
    const dataMap = new Map();
    filteredAllData.forEach(item => {
      if (item.date) {
        dataMap.set(item.date, item);
      }
    });

    // Expected days for a week: Sun, Mon, Tue, Wed, Thu, Fri, Sat
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const timeSlots = [0]; // Only show 0th position for each day
    const completeWeekData = [];

    // Build complete week structure - only 0th position for each day
    dayNames.forEach(dayName => {
      timeSlots.forEach(timeSlot => {
        const expectedLabel = `${dayName} ${timeSlot}`;
        if (dataMap.has(expectedLabel)) {
          const item = dataMap.get(expectedLabel);
          // Preserve zero values - convert null/undefined to 0, but keep actual 0 values
          const occupancyValue = item.occupancy !== null && item.occupancy !== undefined ? item.occupancy : 0;
          completeWeekData.push({
            date: expectedLabel,
            occupancy: occupancyValue
          });
        } else {
          // Add missing time slot with 0 value to maintain x-axis structure
          completeWeekData.push({
            date: expectedLabel,
            occupancy: 0
          });
        }
      });
    });

    // Add any additional data points that don't match the expected structure
    // But only include 0th positions for custom week periods (already filtered above)
    filteredAllData.forEach(item => {
      if (item.date && !completeWeekData.some(d => d.date === item.date)) {
        // Only add if it's a 0th position (already filtered, but double-check)
        const match = String(item.date).match(/^([A-Za-z]{3})\s+(\d+)$/);
        if (match && parseInt(match[2]) === 0) {
          const occupancyValue = item.occupancy !== null && item.occupancy !== undefined ? item.occupancy : 0;
          completeWeekData.push({
            date: item.date,
            occupancy: occupancyValue
          });
        }
      }
    });

    // Sort by day and time, then filter to ensure only 0th positions
    processedChartData = completeWeekData
      .filter(item => {
        // Only include 0th positions (e.g., "Sun 0", "Mon 0", etc.)
        const match = item.date && String(item.date).match(/^([A-Za-z]{3})\s+(\d+)$/);
        return match && parseInt(match[2]) === 0;
      })
      .sort((a, b) => {
        const dayOrder = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
        const matchA = a.date.match(/^(\w+)\s+(\d+)$/);
        const matchB = b.date.match(/^(\w+)\s+(\d+)$/);

        if (matchA && matchB) {
          const dayA = dayOrder[matchA[1]] ?? 99;
          const dayB = dayOrder[matchB[1]] ?? 99;
          if (dayA !== dayB) return dayA - dayB;
          return parseInt(matchA[2]) - parseInt(matchB[2]);
        }
        return (a.date || '').localeCompare(b.date || '');
      });
  } else if (isMonthPeriod && customStartDate && customEndDate) {
    // For custom month period, show ALL days in the range (1, 2, 3, 4, 5, 6, etc.)
    const dataMap = new Map();
    allData.forEach(item => {
      if (item.date) {
        const dateStr = String(item.date).trim();
        dataMap.set(dateStr, {
          date: dateStr,
          occupancy: item.occupancy !== null && item.occupancy !== undefined ? item.occupancy : null
        });
      }
    });

    // Build complete month data with ALL days in the custom range
    const completeMonthData = [];
    const currentDate = new Date(customStartDate);

    while (currentDate <= customEndDate) {
      const dayOfMonth = currentDate.getDate();
      const dayStr = String(dayOfMonth);

      // Try to find data for this day in various formats
      let foundData = null;

      // First try exact day number match
      if (dataMap.has(dayStr)) {
        foundData = dataMap.get(dayStr);
      } else {
        // Try date format like "11/12" or "22/12"
        const monthDay = currentDate.getMonth() + 1;
        const dateFormat1 = `${dayOfMonth}/${monthDay}`;
        const dateFormat2 = `${dayOfMonth}/${String(monthDay).padStart(2, '0')}`;

        if (dataMap.has(dateFormat1)) {
          foundData = dataMap.get(dateFormat1);
          foundData.date = dayStr; // Normalize to day number format
        } else if (dataMap.has(dateFormat2)) {
          foundData = dataMap.get(dateFormat2);
          foundData.date = dayStr; // Normalize to day number format
        }
      }

      if (foundData) {
        completeMonthData.push(foundData);
      } else {
        // Add missing day with null value to maintain x-axis structure
        completeMonthData.push({
          date: dayStr,
          occupancy: null
        });
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    processedChartData = completeMonthData;
  } else if (customStartDate && customEndDate) {
    // For other custom periods, ensure ALL days in the range are included
    // This ensures all day labels (11, 12, 13, 14, 15, 16, etc.) are displayed
    const dataMap = new Map();
    allData.forEach(item => {
      if (item.date) {
        const dateStr = String(item.date).trim();
        dataMap.set(dateStr, {
          date: dateStr,
          occupancy: item.occupancy !== null && item.occupancy !== undefined ? item.occupancy : null
        });
      }
    });

    // Build complete data with ALL days in the custom range
    const completeCustomData = [];
    const currentDate = new Date(customStartDate);

    while (currentDate <= customEndDate) {
      const dayOfMonth = currentDate.getDate();
      const dayStr = String(dayOfMonth);

      // Try to find data for this day in various formats
      let foundData = null;

      // First try exact day number match
      if (dataMap.has(dayStr)) {
        foundData = dataMap.get(dayStr);
      } else {
        // Try date format like "11/12" or "22/12"
        const monthDay = currentDate.getMonth() + 1;
        const dateFormat1 = `${dayOfMonth}/${monthDay}`;
        const dateFormat2 = `${dayOfMonth}/${String(monthDay).padStart(2, '0')}`;

        if (dataMap.has(dateFormat1)) {
          foundData = dataMap.get(dateFormat1);
          foundData.date = dayStr; // Normalize to day number format
        } else if (dataMap.has(dateFormat2)) {
          foundData = dataMap.get(dateFormat2);
          foundData.date = dayStr; // Normalize to day number format
        }
      }

      if (foundData) {
        completeCustomData.push(foundData);
      } else {
        // Add missing day with null value to maintain x-axis structure
        completeCustomData.push({
          date: dayStr,
          occupancy: null
        });
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    processedChartData = completeCustomData;
  } else {
    // No custom date range, but check if it's a week period anyway
    // This handles cases where customDateRange might not be set but duration is custom
    // Consider 2-7 day periods as week periods (to show only 0th positions)
    if (diffDays >= 2 && diffDays <= 7) {
      // Filter to only 0th positions for week periods
      processedChartData = allData
        .filter(item => {
          if (!item.date) return false;
          const match = String(item.date).match(/^([A-Za-z]{3})\s+(\d+)$/);
          // Only keep items that match day format and are 0th position
          return match && parseInt(match[2]) === 0;
        })
        .map(item => ({
          date: item.date,
          occupancy: item.occupancy !== null && item.occupancy !== undefined ? item.occupancy : 0
        }));
    } else {
      // Use data as-is
      let mappedData = allData.map(item => ({
        date: item.date,
        occupancy: item.occupancy !== null && item.occupancy !== undefined ? item.occupancy : null
      }));
      processedChartData = mappedData;
    }
  }
} else {
  // For other durations (non-custom), preserve null values - don't convert to 0
  // Remove trailing null values so chart only shows data up to where it actually exists
  let mappedData = allData.map(item => ({
    date: item.date,
    occupancy: item.occupancy !== null && item.occupancy !== undefined ? item.occupancy : null
  }));

  // Remove trailing null values from the end
  while (mappedData.length > 0 && (mappedData[mappedData.length - 1].occupancy === null || mappedData[mappedData.length - 1].occupancy === undefined)) {
    mappedData.pop();
  }

  processedChartData = mappedData;
}


  return processedChartData;
}
