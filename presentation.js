"use strict";

const prompt = require("prompt-sync")({ sigint: true });
const logic = require("./business");

/**
 * Runs the console-based Employee Scheduling System.
 * Presentation layer: handles ALL user I/O and formatting.
 */
function runApp() {
  console.clear();
  console.log("=== Employee Scheduling System (Assignment 2) ===");

  while (true) {
    printMenu();
    const choice = readMenuChoice(0, 5);

    try {
      if (choice === 0) {
        console.log("\nGoodbye!\n");
        return;
      }

      if (choice === 1) handleListEmployees();
      if (choice === 2) handleListShifts();
      if (choice === 3) handleAssignEmployeeToShift();
      if (choice === 4) handleViewEmployeeScheduleForDate();
      if (choice === 5) handleUnassignEmployeeFromShift();

      pause();
    } catch (err) {
      console.log("\n  Something went wrong, but the app is still running.");
      console.log("Error:", err && err.message ? err.message : err);
      pause();
    }
  }
}

function printMenu() {
  console.log("\nMenu:");
  console.log("1) List employees");
  console.log("2) List shifts");
  console.log("3) Assign employee to shift (enforces maxDailyHours)");
  console.log("4) View employee schedule for a date");
  console.log("5) Unassign employee from shift");
  console.log("0) Exit");
}

function pause() {
  prompt("\nPress ENTER to continue...");
}

/**
 * Reads an integer menu choice between min and max inclusive.
 */
function readMenuChoice(min, max) {
  while (true) {
    const raw = prompt("Choose an option: ").trim();
    const n = Number(raw);
    if (Number.isInteger(n) && n >= min && n <= max) return n;
    console.log(` Invalid choice. Enter a number from ${min} to ${max}.`);
  }
}

/**
 * Reads an Employee ID in format E### (e.g., E001).
 */
function readEmployeeId() {
  while (true) {
    const raw = prompt("Enter employeeId (e.g., E001): ").trim();
    if (/^E\d{3}$/i.test(raw)) return raw.toUpperCase();
    console.log(" Invalid employeeId. Format must be E### (example: E001).");
  }
}

/**
 * Reads a Shift ID in format S### (e.g., S001).
 */
function readShiftId() {
  while (true) {
    const raw = prompt("Enter shiftId (e.g., S001): ").trim();
    if (/^S\d{3}$/i.test(raw)) return raw.toUpperCase();
    console.log(" Invalid shiftId. Format must be S### (example: S001).");
  }
}

/**
 * Reads a date in YYYY-MM-DD.
 */
function readDateISO() {
  while (true) {
    const raw = prompt("Enter date (YYYY-MM-DD): ").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    console.log(" Invalid date. Format must be YYYY-MM-DD (example: 2025-02-12).");
  }
}

function handleListEmployees() {
  console.log("\n=== Employees ===");
  const employees = logic.listEmployees();

  if (employees.length === 0) {
    console.log("(No employees found)");
    return;
  }

  // Friendly output (not JSON)
  console.log("ID     Name                 Phone");
  console.log("-----  -------------------  ----------------");
  for (const e of employees) {
    console.log(
      `${padRight(e.employeeId, 5)}  ${padRight(e.name, 19)}  ${e.phone ?? ""}`
    );
  }
}

function handleListShifts() {
  console.log("\n=== Shifts ===");
  const shifts = logic.listShifts();

  if (shifts.length === 0) {
    console.log("(No shifts found)");
    return;
  }

  console.log("ID     Date        Start   End     Duration");
  console.log("-----  ----------  ------  ------  --------");
  for (const s of shifts) {
    const dur = logic.computeShiftDuration(s.startTime, s.endTime);
    console.log(
      `${padRight(s.shiftId, 5)}  ${padRight(s.date, 10)}  ${padRight(
        s.startTime,
        6
      )}  ${padRight(s.endTime, 6)}  ${dur.toFixed(2)}h`
    );
  }
}

function handleAssignEmployeeToShift() {
  console.log("\n=== Assign employee to shift ===");
  const employeeId = readEmployeeId();
  const shiftId = readShiftId();

  const result = logic.assignEmployeeToShift(employeeId, shiftId);

  if (!result.ok) {
    console.log("\n Assignment failed:");
    console.log(result.message);
    return;
  }

  console.log("\n Assigned successfully.");
  console.log(result.message);
}

function handleViewEmployeeScheduleForDate() {
  console.log("\n=== View employee schedule for date ===");
  const employeeId = readEmployeeId();
  const date = readDateISO();

  const result = logic.getEmployeeScheduleForDate(employeeId, date);
  if (!result.ok) {
    console.log("\n", result.message);
    return;
  }

  console.log(`\nSchedule for ${employeeId} on ${date}`);
  console.log("Shift   Start   End     Duration");
  console.log("-----   ------  ------  --------");
  let total = 0;
  for (const item of result.items) {
    total += item.durationHours;
    console.log(
      `${padRight(item.shiftId, 5)}   ${padRight(item.startTime, 6)}  ${padRight(
        item.endTime,
        6
      )}  ${item.durationHours.toFixed(2)}h`
    );
  }
  console.log(`\nTotal hours: ${total.toFixed(2)}h (Limit: ${result.maxDailyHours}h)`);
}

function handleUnassignEmployeeFromShift() {
  console.log("\n=== Unassign employee from shift ===");
  const employeeId = readEmployeeId();
  const shiftId = readShiftId();

  const result = logic.unassignEmployeeFromShift(employeeId, shiftId);

  if (!result.ok) {
    console.log("\n Unassign failed:");
    console.log(result.message);
    return;
  }

  console.log("\n Unassigned successfully.");
  console.log(result.message);
}

function padRight(str, width) {
  const s = String(str ?? "");
  return s.length >= width ? s.slice(0, width) : s + " ".repeat(width - s.length);
}

module.exports = { runApp };