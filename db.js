"use strict";

const { MongoClient } = require("mongodb");

/**
 * MongoDB connection singleton.
 */
let _client = null;
let _db = null;

const DB_NAME = "infs3201_winter2026";

/**
 * Connects to MongoDB and returns the database instance.
 * @param {string} mongoUrl - MongoDB connection URL (e.g., "mongodb://127.0.0.1:27017")
 * @returns {Promise<import("mongodb").Db>}
 */
async function getDb(mongoUrl) {
  if (_db) return _db;

  _client = new MongoClient(mongoUrl);
  await _client.connect();
  _db = _client.db(DB_NAME);
  return _db;
}

/**
 * Closes the MongoDB connection (optional).
 * @returns {Promise<void>}
 */
async function closeDb() {
  if (_client) {
    await _client.close();
    _client = null;
    _db = null;
  }
}

module.exports = { getDb, closeDb, DB_NAME };