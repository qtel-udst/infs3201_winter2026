"use strict";

// Keep this spelling because your file is named: presistence.js
const presistence = require("./presistence");

/**
 * Returns all employees sorted by employeeId (NO sort()).
 * @returns {Array}
 */
function listEmployees() {
  const employees = presistence.getAllEmployees();

  // Manual bubble sort (small lists; fine for assignment)
  for (let i = 0; i < employees.length - 1; i++) {
    for (let j = 0; j < employees.length - 1 - i; j++) {
      if (employees[j].employeeId > employees[j + 1].employeeId) {
        const tmp = employees[j];
        employees[j] = employees[j + 1];
        employees[j + 1] = tmp;
      }
    }
  }
  return employees;
}

/**
 * Returns all shifts sorted by date then shiftId (NO sort()).
 * @returns {Array}
 */
function listShifts() {
  const shifts = presistence.getAllShifts();

  // Manual bubble sort by date then shiftId
  for (let i = 0; i < shifts.length - 1; i++) {
    for (let j = 0; j < shifts.length - 1 - i; j++) {
      const a = shifts[j];
      const b = shifts[j + 1];

      const aKey = a.date + "|" + a.shiftId;
      const bKey = b.date + "|" + b.shiftId;

      if (aKey > bKey) {
        const tmp = shifts[j];
        shifts[j] = shifts[j + 1];
        shifts[j + 1] = tmp;
      }
    }
  }

  return shifts;
}

/**
 * Assign employee to shift, enforcing:
 * - employee exists
 * - shift exists
 * - not already assigned
 * - maxDailyHours (from config.json) not exceeded for that day
 */
function assignEmployeeToShift(employeeId, shiftId) {
  const emp = presistence.findEmployee(employeeId);
  if (!emp) return { ok: false, message: `Employee not found: ${employeeId}` };

  const shift = presistence.findShift(shiftId);
  if (!shift) return { ok: false, message: `Shift not found: ${shiftId}` };

  const already = presistence.findAssignment(employeeId, shiftId);
  if (already) return { ok: false, message: `Employee ${employeeId} is already assigned to ${shiftId}.` };

  const cfg = presistence.getConfig();
  const maxDailyHours = Number(cfg.maxDailyHours) || 9;

  // Get employee's assigned shifts for the same date (NO map/filter)
  const assignedShiftIds = presistence.getShiftIdsForEmployee(employeeId);
  let currentHours = 0;

  for (let i = 0; i < assignedShiftIds.length; i++) {
    const sid = assignedShiftIds[i];
    const s = presistence.findShift(sid);
    if (s && s.date === shift.date) {
      currentHours += computeShiftDuration(s.startTime, s.endTime);
    }
  }

  const newShiftHours = computeShiftDuration(shift.startTime, shift.endTime);
  const projected = currentHours + newShiftHours;

  if (projected > maxDailyHours + 1e-9) {
    return {
      ok: false,
      message:
        `Daily hours limit exceeded for ${shift.date}.\n` +
        `Limit: ${maxDailyHours}h\n` +
        `Current: ${currentHours.toFixed(2)}h\n` +
        `New shift (${shiftId}): ${newShiftHours.toFixed(2)}h\n` +
        `Projected: ${projected.toFixed(2)}h\n` +
        `Action: choose a shorter shift or another day.`
    };
  }

  presistence.addAssignment({ employeeId, shiftId });

  return {
    ok: true,
    message:
      `Employee ${employeeId} assigned to shift ${shiftId} on ${shift.date}.\n` +
      `Hours: Current ${currentHours.toFixed(2)}h + New ${newShiftHours.toFixed(2)}h = ${projected.toFixed(2)}h (Limit ${maxDailyHours}h)`
  };
}

/**
 * Unassign employee from shift.
 */
function unassignEmployeeFromShift(employeeId, shiftId) {
  const emp = presistence.findEmployee(employeeId);
  if (!emp) return { ok: false, message: `Employee not found: ${employeeId}` };

  const shift = presistence.findShift(shiftId);
  if (!shift) return { ok: false, message: `Shift not found: ${shiftId}` };

  const exists = presistence.findAssignment(employeeId, shiftId);
  if (!exists) return { ok: false, message: `No assignment exists for ${employeeId} -> ${shiftId}.` };

  presistence.removeAssignment(employeeId, shiftId);
  return { ok: true, message: `Removed assignment: ${employeeId} -> ${shiftId}` };
}

/**
 * Get employee schedule for a specific date (NO map/filter/sort)
 */
function getEmployeeScheduleForDate(employeeId, date) {
  const emp = presistence.findEmployee(employeeId);
  if (!emp) return { ok: false, message: `Employee not found: ${employeeId}` };

  const cfg = presistence.getConfig();
  const maxDailyHours = Number(cfg.maxDailyHours) || 9;

  const assignedShiftIds = presistence.getShiftIdsForEmployee(employeeId);

  // Collect shifts for that date
  const shifts = [];
  for (let i = 0; i < assignedShiftIds.length; i++) {
    const s = presistence.findShift(assignedShiftIds[i]);
    if (s && s.date === date) {
      shifts.push(s);
    }
  }

  // Manual sort by startTime
  for (let i = 0; i < shifts.length - 1; i++) {
    for (let j = 0; j < shifts.length - 1 - i; j++) {
      if (shifts[j].startTime > shifts[j + 1].startTime) {
        const tmp = shifts[j];
        shifts[j] = shifts[j + 1];
        shifts[j + 1] = tmp;
      }
    }
  }

  // Build items
  const items = [];
  for (let i = 0; i < shifts.length; i++) {
    const s = shifts[i];
    items.push({
      shiftId: s.shiftId,
      startTime: s.startTime,
      endTime: s.endTime,
      durationHours: computeShiftDuration(s.startTime, s.endTime)
    });
  }

  return { ok: true, items, maxDailyHours };
}

/**
 * computeShiftDuration(startTime, endTime)
 * ---------------------------------------------------------
 * This function was generated using an LLM as required by the assignment.
 *
 * Prompt used:
 * "Write a NodeJS (CommonJS) function computeShiftDuration(startTime, endTime)
 * that accepts 'HH:MM' 24-hour time strings and returns the duration in hours
 * as a number (e.g., 11:00 to 13:30 should return 2.5). Validate input format
 * and ensure endTime is after startTime." *

 * @param {string} startTime - 24-hour time string "HH:MM"
 * @param {string} endTime - 24-hour time string "HH:MM"
 * @returns {number} duration in hours (can be fractional)
 * @throws {Error} if invalid format or endTime <= startTime
 */
function computeShiftDuration(startTime, endTime) {
  const toMinutes = (t) => {
    if (typeof t !== "string") throw new Error("Time must be a string");
    const m = t.match(/^(\d{2}):(\d{2})$/);
    if (!m) throw new Error(`Invalid time format: ${t} (expected HH:MM)`);
    const hh = Number(m[1]);
    const mm = Number(m[2]);
    if (!Number.isInteger(hh) || !Number.isInteger(mm)) throw new Error(`Invalid time numbers: ${t}`);
    if (hh < 0 || hh > 23) throw new Error(`Hour out of range: ${t}`);
    if (mm < 0 || mm > 59) throw new Error(`Minute out of range: ${t}`);
    return hh * 60 + mm;
  };

  const startMin = toMinutes(startTime);
  const endMin = toMinutes(endTime);

  if (endMin <= startMin) {
    throw new Error(`endTime must be after startTime (start=${startTime}, end=${endTime})`);
  }

  return (endMin - startMin) / 60;
}

module.exports = {
  listEmployees,
  listShifts,
  assignEmployeeToShift,
  unassignEmployeeFromShift,
  getEmployeeScheduleForDate,
  computeShiftDuration
};
