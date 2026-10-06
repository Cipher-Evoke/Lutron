import { parseDateFromState } from '../../utils/dashboardDateState';
import { MONTH_NAME_TO_INDEX } from './chartTransformConstants';
import { parseDashboardTimeAxisToMinutes } from './parseDashboardTimeAxisToMinutes';

/**
 * Instant occupancy API payload -> Recharts row data.
 * Extracted from variant InstantOccupancyChartComponent.
 */
export function instantOccupancyToRecharts(chartData, options = {}) {
  const { selectedDuration, currentDate } = options;

  const allData = chartData['x-axis'].map((date, index) => ({
    date,
    occupancy: chartData['y-axis']['data']?.[index] ?? null,
  }));

  let processedChartData = allData;

  if (selectedDuration === 'this-day') {
    const complete24HourData = [];

    allData.forEach((item) => {
      const timeMinutes = parseDashboardTimeAxisToMinutes(item.date);
      if (timeMinutes == null) return;
      const isHourly = timeMinutes % 60 === 0;
      complete24HourData.push({
        date: item.date,
        timeMinutes,
        occupancy: item.occupancy !== null && item.occupancy !== undefined ? item.occupancy : null,
        isHourly,
      });
    });

    for (let hour = 0; hour < 24; hour++) {
      const hourMinutes = hour * 60;
      const hourLabel = `${hour.toString().padStart(2, '0')}:00`;
      const hourExists = complete24HourData.some(
        (item) => typeof item.timeMinutes === 'number' && item.timeMinutes === hourMinutes
      );
      if (!hourExists) {
        complete24HourData.push({
          date: hourLabel,
          timeMinutes: hourMinutes,
          occupancy: null,
          isHourly: true,
        });
      }
    }

    processedChartData = complete24HourData.sort(
      (a, b) => (a.timeMinutes || 0) - (b.timeMinutes || 0)
    );
  } else if (selectedDuration === 'this-week') {
    const dataMap = new Map();
    allData.forEach((item) => {
      if (item.date) dataMap.set(item.date, item);
    });

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const timeSlots = [0, 6, 12, 18];
    const completeWeekData = [];

    dayNames.forEach((dayName) => {
      timeSlots.forEach((timeSlot) => {
        const expectedLabel = `${dayName} ${timeSlot}`;
        if (dataMap.has(expectedLabel)) {
          const item = dataMap.get(expectedLabel);
          completeWeekData.push({
            date: expectedLabel,
            occupancy:
              item.occupancy !== null && item.occupancy !== undefined ? item.occupancy : null,
            isHourly: false,
          });
        } else {
          completeWeekData.push({ date: expectedLabel, occupancy: null, isHourly: false });
        }
      });
    });

    allData.forEach((item) => {
      if (item.date && !completeWeekData.some((d) => d.date === item.date)) {
        completeWeekData.push({
          date: item.date,
          occupancy:
            item.occupancy !== null && item.occupancy !== undefined ? item.occupancy : null,
          isHourly: false,
        });
      }
    });

    processedChartData = completeWeekData.sort((a, b) => {
      const dayOrder = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      const matchA = a.date.match(/^(\w+)\s+(\d+)$/);
      const matchB = b.date.match(/^(\w+)\s+(\d+)$/);
      if (matchA && matchB) {
        const dayA = dayOrder[matchA[1]] ?? 99;
        const dayB = dayOrder[matchB[1]] ?? 99;
        if (dayA !== dayB) return dayA - dayB;
        return parseInt(matchA[2], 10) - parseInt(matchB[2], 10);
      }
      return (a.date || '').localeCompare(b.date || '');
    });
  } else if (selectedDuration === 'this-month') {
    const targetDate = parseDateFromState(currentDate);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const dataMap = new Map();
    allData.forEach((item) => {
      if (item.date) {
        const dateStr = String(item.date).trim();
        const dayOnlyMatch = dateStr.match(/^(\d{1,2})$/);
        if (dayOnlyMatch) {
          const day = parseInt(dayOnlyMatch[1], 10);
          if (day >= 1 && day <= daysInMonth) {
            dataMap.set(day, {
              date: String(day),
              occupancy:
                item.occupancy !== null && item.occupancy !== undefined ? item.occupancy : null,
              isHourly: false,
            });
          }
        } else {
          const dateMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})(?:\s+\d+)?$/);
          if (dateMatch) {
            const day = parseInt(dateMatch[1], 10);
            const dataMonth = parseInt(dateMatch[2], 10);
            if (dataMonth === month + 1 && day >= 1 && day <= daysInMonth) {
              dataMap.set(day, {
                date: String(day),
                occupancy:
                  item.occupancy !== null && item.occupancy !== undefined ? item.occupancy : null,
                isHourly: false,
              });
            }
          }
        }
      }
    });

    const completeMonthData = [];
    for (let day = 1; day <= daysInMonth; day++) {
      if (dataMap.has(day)) {
        completeMonthData.push(dataMap.get(day));
      } else {
        completeMonthData.push({ date: String(day), occupancy: null, isHourly: false });
      }
    }
    processedChartData = completeMonthData;
  } else if (selectedDuration === 'this-year') {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dataMap = new Map();
    allData.forEach((item) => {
      if (item.date) {
        const monthQuarterMatch =
          String(item.date).match(/^([A-Za-z]{3})-(\d+)$/) ||
          String(item.date).match(/^(\d{1,2})\/(\d{4})-(\d+)$/);
        if (monthQuarterMatch) {
          let monthIndex;
          let quarter;
          if (monthQuarterMatch[1].length === 3) {
            monthIndex = MONTH_NAME_TO_INDEX[monthQuarterMatch[1]];
            quarter = parseInt(monthQuarterMatch[2], 10);
          } else {
            monthIndex = parseInt(monthQuarterMatch[1], 10) - 1;
            quarter = parseInt(monthQuarterMatch[3], 10);
          }
          if (monthIndex !== undefined && monthIndex >= 0 && monthIndex < 12 && quarter >= 0 && quarter <= 3) {
            const monthKey = `${monthNames[monthIndex]}-${quarter}`;
            dataMap.set(monthKey, {
              date: `${monthNames[monthIndex]}-${quarter}`,
              occupancy:
                item.occupancy !== null && item.occupancy !== undefined ? item.occupancy : null,
              isHourly: false,
            });
          }
        }
      }
    });

    const completeYearData = [];
    monthNames.forEach((monthName) => {
      for (let quarter = 0; quarter < 4; quarter++) {
        const monthQuarterKey = `${monthName}-${quarter}`;
        if (dataMap.has(monthQuarterKey)) {
          completeYearData.push(dataMap.get(monthQuarterKey));
        } else {
          completeYearData.push({ date: `${monthName}-${quarter}`, occupancy: null, isHourly: false });
        }
      }
    });
    processedChartData = completeYearData;
  } else {
    processedChartData = allData.map((item) => ({
      date: item.date,
      occupancy: item.occupancy !== null && item.occupancy !== undefined ? item.occupancy : 0,
      isHourly: false,
    }));
  }

  return processedChartData;
}
