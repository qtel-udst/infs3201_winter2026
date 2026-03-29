"use strict";

const { getDb } = require("./db");
const { ObjectId } = require("mongodb");

let db;

/**
 * Initialize database connection
 */
async function init() {
  db = await getDb();
}

/**
 * Get all employees
 * @returns {Promise<Array>}
 */
async function getAllEmployees() {
  const employees = db.collection("employees");
  return await employees.find({}).toArray();
}

/**
 * Get employee by ObjectId
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
async function getEmployeeById(id) {
  const employees = db.collection("employees");
  return await employees.findOne({ _id: new ObjectId(id) });
}

/**
 * Update employee info
 * @param {string} id
 * @param {string} name
 * @param {string} phone
 * @returns {Promise<void>}
 */
async function updateEmployee(id, name, phone) {
  const employees = db.collection("employees");

  await employees.updateOne(
    { _id: new ObjectId(id) },
    { $set: { name: name, phone: phone } }
  );
}

/**
 * Get all shifts assigned to a specific employee
 * @param {string} employeeId
 * @returns {Promise<Array>}
 */
async function getShiftsForEmployee(employeeId) {
  const shifts = db.collection("shifts");

  return await shifts.find({
    employees: new ObjectId(employeeId)
  }).toArray();
}

/**
 * Get user by username
 * @param {string} username
 * @returns {Promise<Object|null>}
 */
async function getUserByUsername(username) {
  const users = db.collection("users");
  return await users.findOne({ username: username });
}

/**
 * Create a new session
 * @param {string} token
 * @param {string} username
 * @param {Date} expiresAt
 * @returns {Promise<void>}
 */
async function createSession(token, username, expiresAt) {
  const sessions = db.collection("sessions");

  await sessions.insertOne({
    token: token,
    username: username,
    expiresAt: expiresAt
  });
}

/**
 * Get session by token
 * @param {string} token
 * @returns {Promise<Object|null>}
 */
async function getSessionByToken(token) {
  const sessions = db.collection("sessions");
  return await sessions.findOne({ token: token });
}

/**
 * Update session expiry time
 * @param {string} token
 * @param {Date} expiresAt
 * @returns {Promise<void>}
 */
async function updateSessionExpiry(token, expiresAt) {
  const sessions = db.collection("sessions");

  await sessions.updateOne(
    { token: token },
    { $set: { expiresAt: expiresAt } }
  );
}

/**
 * Delete session by token
 * @param {string} token
 * @returns {Promise<void>}
 */
async function deleteSession(token) {
  const sessions = db.collection("sessions");
  await sessions.deleteOne({ token: token });
}

/**
 * Insert one security log entry
 * @param {string|null} username
 * @param {string} url
 * @param {string} method
 * @returns {Promise<void>}
 */
async function insertSecurityLog(username, url, method) {
  const securityLog = db.collection("security_log");

  await securityLog.insertOne({
    timestamp: new Date(),
    username: username,
    url: url,
    method: method
  });
}

module.exports = {
  init,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  getShiftsForEmployee,
  getUserByUsername,
  createSession,
  getSessionByToken,
  updateSessionExpiry,
  deleteSession,
  insertSecurityLog
};