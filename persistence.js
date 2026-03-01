"use strict";

/**
 * Persistence layer (MongoDB).
 * Collections: employees, shifts, assignments.
 */

let _db = null;

/**
 * Initializes persistence with a MongoDB Db instance.
 * @param {import("mongodb").Db} db
 */
function init(db) {
  _db = db;
}

/**
 * Gets the employees collection.
 * @returns {import("mongodb").Collection}
 */
function employeesCol() {
  return _db.collection("employees");
}

/**
 * Gets the shifts collection.
 * @returns {import("mongodb").Collection}
 */
function shiftsCol() {
  return _db.collection("shifts");
}

/**
 * Gets the assignments collection.
 * @returns {import("mongodb").Collection}
 */
function assignmentsCol() {
  return _db.collection("assignments");
}

/**
 * Returns all employees as an array.
 * @returns {Promise<Array>}
 */
async function getAllEmployees() {
  const cursor = employeesCol().find({});
  const list = await cursor.toArray();
  return Array.isArray(list) ? list : [];
}

/**
 * Returns one employee by employeeId.
 * @param {string} employeeId
 * @returns {Promise<object|null>}
 */
async function getEmployeeById(employeeId) {
  const emp = await employeesCol().findOne({ employeeId: employeeId });
  return emp || null;
}

/**
 * Updates an employee's name and phone.
 * @param {string} employeeId
 * @param {string} name
 * @param {string} phone
 * @returns {Promise<boolean>} true if updated
 */
async function updateEmployee(employeeId, name, phone) {
  const result = await employeesCol().updateOne(
    { employeeId: employeeId },
    { $set: { name: name, phone: phone } }
  );
  return !!(result && result.matchedCount === 1);
}

/**
 * Returns one shift by shiftId.
 * @param {string} shiftId
 * @returns {Promise<object|null>}
 */
async function getShiftById(shiftId) {
  const shift = await shiftsCol().findOne({ shiftId: shiftId });
  return shift || null;
}

/**
 * Returns assignments for a given employeeId.
 * @param {string} employeeId
 * @returns {Promise<Array>}
 */
async function getAssignmentsForEmployee(employeeId) {
  const cursor = assignmentsCol().find({ employeeId: employeeId });
  const list = await cursor.toArray();
  return Array.isArray(list) ? list : [];
}

module.exports = {
  init,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  getShiftById,
  getAssignmentsForEmployee
};