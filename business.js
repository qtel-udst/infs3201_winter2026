"use strict";

const crypto = require("crypto");
const persistence = require("./persistence");

/**
 * Sort employees by name using bubble sort
 * @param {Array} employees
 * @returns {Array}
 */
function sortEmployeesByName(employees) {
  let i = 0;
  while (i < employees.length - 1) {
    let j = 0;
    while (j < employees.length - 1 - i) {
      if (employees[j].name.localeCompare(employees[j + 1].name) > 0) {
        const temp = employees[j];
        employees[j] = employees[j + 1];
        employees[j + 1] = temp;
      }
      j += 1;
    }
    i += 1;
  }
  return employees;
}

/**
 * Sort shifts by date and start time using bubble sort
 * @param {Array} shifts
 * @returns {Array}
 */
function sortShiftsByDateTime(shifts) {
  let i = 0;
  while (i < shifts.length - 1) {
    let j = 0;
    while (j < shifts.length - 1 - i) {
      const aKey = shifts[j].date + " " + shifts[j].startTime;
      const bKey = shifts[j + 1].date + " " + shifts[j + 1].startTime;
      if (aKey > bKey) {
        const temp = shifts[j];
        shifts[j] = shifts[j + 1];
        shifts[j + 1] = temp;
      }
      j += 1;
    }
    i += 1;
  }
  return shifts;
}

/**
 * Get all employees for home page
 * @returns {Promise<Array>}
 */
async function getEmployees() {
  const employees = await persistence.getAllEmployees();
  return sortEmployeesByName(employees);
}

/**
 * Get one employee and their assigned shifts
 * @param {string} employeeId
 * @returns {Promise<Object|null>}
 */
async function getEmployeeDetails(employeeId) {
  const employee = await persistence.getEmployeeById(employeeId);

  if (!employee) {
    return null;
  }

  const shifts = await persistence.getShiftsForEmployee(employeeId);
  employee.shifts = sortShiftsByDateTime(shifts);

  return employee;
}

/**
 * Validate employee edit input
 * @param {string} name
 * @param {string} phone
 * @returns {Array}
 */
function validateEmployee(name, phone) {
  const errors = [];

  if (!name || name.trim() === "") {
    errors.push("Name is required.");
  }

  if (!phone || phone.trim() === "") {
    errors.push("Phone is required.");
  }

  return errors;
}

/**
 * Update employee info after validation
 * @param {string} employeeId
 * @param {string} name
 * @param {string} phone
 * @returns {Promise<Array>}
 */
async function editEmployee(employeeId, name, phone) {
  const errors = validateEmployee(name, phone);

  if (errors.length > 0) {
    return errors;
  }

  await persistence.updateEmployee(employeeId, name, phone);
  return [];
}

/**
 * Hash a password using sha256
 * @param {string} password
 * @returns {string}
 */
function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * Check login credentials
 * @param {string} username
 * @param {string} password
 * @returns {Promise<boolean>}
 */
async function validateLogin(username, password) {
  if (!username || !password) {
    return false;
  }

  const user = await persistence.getUserByUsername(username);

  if (!user) {
    return false;
  }

  const passwordHash = hashPassword(password);
  return user.passwordHash === passwordHash;
}

/**
 * Generate a random session token
 * @returns {string}
 */
function generateSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

module.exports = {
  getEmployees,
  getEmployeeDetails,
  editEmployee,
  validateLogin,
  generateSessionToken
};