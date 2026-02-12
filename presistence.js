"use strict";

const fs = require("fs");
const path = require("path");

const EMP_FILE = path.join(__dirname, "employees.json");
const SHIFT_FILE = path.join(__dirname, "shifts.json");
const ASSIGN_FILE = path.join(__dirname, "assignments.json");
const CONFIG_FILE = path.join(__dirname, "config.json");

/**
 * Reads a JSON file safely.
 * @param {string} filePath
 * @param {any} fallback
 * @returns {any}
 */
function readJson(filePath, fallback) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

/**
 * Writes JSON file safely.
 * @param {string} filePath
 * @param {any} data
 */
function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

/**
 * Returns config object from config.json.
 * Default: { maxDailyHours: 9 }
 */
function getConfig() {
  const cfg = readJson(CONFIG_FILE, { maxDailyHours: 9 });
  const n = Number(cfg.maxDailyHours);
  cfg.maxDailyHours = Number.isFinite(n) ? n : 9;
  return cfg;
}

/**
 * Returns all employees.
 * @returns {Array}
 */
function getAllEmployees() {
  const list = readJson(EMP_FILE, []);
  return Array.isArray(list) ? list : [];
}

/**
 * Returns all shifts.
 * @returns {Array}
 */
function getAllShifts() {
  const list = readJson(SHIFT_FILE, []);
  return Array.isArray(list) ? list : [];
}

/**
 * Returns all assignments.
 * @returns {Array}
 */
function getAllAssignments() {
  const list = readJson(ASSIGN_FILE, []);
  return Array.isArray(list) ? list : [];
}

/**
 * Find one employee by employeeId (NO find()).
 * @param {string} employeeId
 * @returns {object|undefined}
 */
function findEmployee(employeeId) {
  const employees = getAllEmployees();
  for (let i = 0; i < employees.length; i++) {
    if (employees[i].employeeId === employeeId) {
      return employees[i];
    }
  }
  return undefined;
}

/**
 * Find one shift by shiftId (NO find()).
 * @param {string} shiftId
 * @returns {object|undefined}
 */
function findShift(shiftId) {
  const shifts = getAllShifts();
  for (let i = 0; i < shifts.length; i++) {
    if (shifts[i].shiftId === shiftId) {
      return shifts[i];
    }
  }
  return undefined;
}

/**
 * Find assignment record for employeeId + shiftId (NO find()).
 * @param {string} employeeId
 * @param {string} shiftId
 * @returns {object|undefined}
 */
function findAssignment(employeeId, shiftId) {
  const assignments = getAllAssignments();
  for (let i = 0; i < assignments.length; i++) {
    const a = assignments[i];
    if (a.employeeId === employeeId && a.shiftId === shiftId) {
      return a;
    }
  }
  return undefined;
}

/**
 * Get all shiftIds assigned to an employee (NO filter/map).
 * @param {string} employeeId
 * @returns {string[]}
 */
function getShiftIdsForEmployee(employeeId) {
  const assignments = getAllAssignments();
  const ids = [];
  for (let i = 0; i < assignments.length; i++) {
    if (assignments[i].employeeId === employeeId) {
      ids.push(assignments[i].shiftId);
    }
  }
  return ids;
}

/**
 * Add an assignment and persist to assignments.json.
 * @param {{employeeId:string, shiftId:string}} assignment
 */
function addAssignment(assignment) {
  const list = getAllAssignments();
  list.push({ employeeId: assignment.employeeId, shiftId: assignment.shiftId });
  writeJson(ASSIGN_FILE, list);
}

/**
 * Remove an assignment and persist (NO filter()).
 * @param {string} employeeId
 * @param {string} shiftId
 */
function removeAssignment(employeeId, shiftId) {
  const list = getAllAssignments();
  const newList = [];
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    if (!(a.employeeId === employeeId && a.shiftId === shiftId)) {
      newList.push(a);
    }
  }
  writeJson(ASSIGN_FILE, newList);
}

module.exports = {
  getConfig,
  getAllEmployees,
  getAllShifts,
  getAllAssignments,
  findEmployee,
  findShift,
  findAssignment,
  getShiftIdsForEmployee,
  addAssignment,
  removeAssignment
};

