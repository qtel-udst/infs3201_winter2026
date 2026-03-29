"use strict";

const { MongoClient } = require("mongodb");

let _client = null;
let _db = null;

const DB_NAME = "infs3201_winter2026";
const DEFAULT_MONGO_URL = "mongodb://127.0.0.1:27017";

/**
 * Connects to MongoDB and returns the database instance.
 * @param {string} [mongoUrl]
 * @returns {Promise<import("mongodb").Db>}
 */
async function getDb(mongoUrl = DEFAULT_MONGO_URL) {
  if (_db) {
    return _db;
  }

  _client = new MongoClient(mongoUrl);
  await _client.connect();
  _db = _client.db(DB_NAME);
  return _db;
}

/**
 * Closes the MongoDB connection.
 * @returns {Promise<void>}
 */
async function closeDb() {
  if (_client) {
    await _client.close();
    _client = null;
    _db = null;
  }
}

module.exports = {
  getDb,
  closeDb,
  DB_NAME
};