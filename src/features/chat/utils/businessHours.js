/**
 * Check if current time in shop timezone is outside operational hours, shifts, or holidays.
 */
export function checkIsOutsideBusinessHours(shop) {
  if (!shop) return false;

  const config = shop.business_hours_config || { timezone: "UTC", holidays: [], shifts: [] };
  const timezone = config.timezone || "UTC";

  // Get current time in specified timezone
  const now = new Date();
  let timeInTZ;
  try {
    timeInTZ = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
  } catch (e) {
    timeInTZ = now;
  }

  const currentYear = timeInTZ.getFullYear();
  const currentMonth = (timeInTZ.getMonth() + 1).toString().padStart(2, "0");
  const currentDate = timeInTZ.getDate().toString().padStart(2, "0");
  const todayStr = `${currentYear}-${currentMonth}-${currentDate}`; // "YYYY-MM-DD"
  const todayMDStr = `${currentMonth}-${currentDate}`; // "MM-DD"

  // Check holidays
  const holidays = config.holidays || [];
  if (holidays.includes(todayStr) || holidays.includes(todayMDStr)) {
    return true;
  }

  const dayName = timeInTZ.toLocaleDateString("en-US", { weekday: "short" }); // e.g. "Mon"
  const currentHour = timeInTZ.getHours();
  const currentMin = timeInTZ.getMinutes();
  const currentMinutes = currentHour * 60 + currentMin;

  // Check shifts
  const shifts = config.shifts || [];
  if (shifts && shifts.length > 0) {
    const parseTimeToMinutes = (timeStr) => {
      if (!timeStr) return null;
      const [h, m] = timeStr.split(":").map(Number);
      return h * 60 + m;
    };

    let insideAnyShift = false;
    for (const shift of shifts) {
      const startMin = parseTimeToMinutes(shift.start);
      const endMin = parseTimeToMinutes(shift.end);
      if (startMin !== null && endMin !== null) {
        if (currentMinutes >= startMin && currentMinutes <= endMin) {
          insideAnyShift = true;
          break;
        }
      }
    }

    if (!insideAnyShift) {
      return true; // Outside shifts
    }
    return false; // Within shifts
  }

  // Fallback to text parsing
  const textHours = shop.business_hours || "";
  if (textHours) {
    const isWeekday = ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(dayName);
    let activeForDay = false;
    if (textHours.toLowerCase().includes("mon-fri") && isWeekday) activeForDay = true;
    if (textHours.toLowerCase().includes("everyday") || textHours.toLowerCase().includes("24/7")) activeForDay = true;
    if (textHours.toLowerCase().includes(dayName.toLowerCase())) activeForDay = true;

    if (!activeForDay) return true;

    const match = textHours.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
    if (match) {
      const [_, startStr, endStr] = match;
      const [sh, sm] = startStr.split(":").map(Number);
      const [eh, em] = endStr.split(":").map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;

      if (currentMinutes < startMin || currentMinutes > endMin) {
        return true;
      }
    }
  }

  return false;
}
