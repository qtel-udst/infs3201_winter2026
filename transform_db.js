"use strict";

const { getDb, closeDb } = require("./db");
const { ObjectId } = require("mongodb");

const MONGO_URL = "mongodb://127.0.0.1:27017";

/**
 * Adds an empty employees array to every shift that does not already have one.
 * @param {import("mongodb").Db} db
 * @returns {Promise<void>}
 */
async function addEmptyEmployeesArray(db) {
  const shifts = db.collection("shifts");

  const result = await shifts.updateMany(
    { employees: { $exists: false } },
    { $set: { employees: [] } }
  );

  console.log("Step 1 complete: added empty employees arrays.");
  console.log("Matched:", result.matchedCount, "Modified:", result.modifiedCount);
}

/**
 * Finds employee _id values from assignments and embeds them into shifts.employees.
 * Prevents duplicates by using $addToSet.
 * @param {import("mongodb").Db} db
 * @returns {Promise<void>}
 */
async function embedEmployeesInShifts(db) {
  const employees = db.collection("employees");
  const shifts = db.collection("shifts");
  const assignments = db.collection("assignments");

  const assignmentList = await assignments.find({}).toArray();

  let i = 0;
  while (i < assignmentList.length) {
    const assignment = assignmentList[i];

    const employee = await employees.findOne({ employeeId: assignment.employeeId });
    const shift = await shifts.findOne({ shiftId: assignment.shiftId });

    if (!employee) {
      console.log(
        "Warning: employee not found for assignment:",
        assignment
      );
      i += 1;
      continue;
    }

    if (!shift) {
      console.log(
        "Warning: shift not found for assignment:",
        assignment
      );
      i += 1;
      continue;
    }

    await shifts.updateOne(
      { _id: shift._id },
      { $addToSet: { employees: new ObjectId(employee._id) } }
    );

    i += 1;
  }

  console.log("Step 2 complete: embedded employee ObjectIds into shifts.");
}

/**
 * Removes old employeeId field from employees collection.
 * @param {import("mongodb").Db} db
 * @returns {Promise<void>}
 */
async function removeEmployeeIdField(db) {
  const employees = db.collection("employees");

  const result = await employees.updateMany(
    {},
    { $unset: { employeeId: "" } }
  );

  console.log("Removed employeeId from employees.");
  console.log("Matched:", result.matchedCount, "Modified:", result.modifiedCount);
}

/**
 * Removes old shiftId field from shifts collection.
 * @param {import("mongodb").Db} db
 * @returns {Promise<void>}
 */
async function removeShiftIdField(db) {
  const shifts = db.collection("shifts");

  const result = await shifts.updateMany(
    {},
    { $unset: { shiftId: "" } }
  );

  console.log("Removed shiftId from shifts.");
  console.log("Matched:", result.matchedCount, "Modified:", result.modifiedCount);
}

/**
 * Drops the assignments collection completely.
 * @param {import("mongodb").Db} db
 * @returns {Promise<void>}
 */
async function dropAssignmentsCollection(db) {
  const collections = await db.listCollections({ name: "assignments" }).toArray();

  if (collections.length > 0) {
    await db.collection("assignments").drop();
    console.log("Dropped assignments collection.");
  } else {
    console.log("Assignments collection does not exist. Nothing to drop.");
  }
}

/**
 * Displays sample data after transformation.
 * @param {import("mongodb").Db} db
 * @returns {Promise<void>}
 */
async function showResults(db) {
  const employees = db.collection("employees");
  const shifts = db.collection("shifts");

  const sampleEmployee = await employees.findOne({});
  const sampleShift = await shifts.findOne({});

  console.log("\nSample employee after transform:");
  console.log(JSON.stringify(sampleEmployee, null, 2));

  console.log("\nSample shift after transform:");
  console.log(JSON.stringify(sampleShift, null, 2));
}

/**
 * Runs the full Assignment 4 schema transformation.
 * @returns {Promise<void>}
 */
async function main() {
  let db;

  try {
    db = await getDb(MONGO_URL);

    console.log("Connected to MongoDB.");
    console.log("Starting Assignment 4 transformation...\n");

    await addEmptyEmployeesArray(db);
    await embedEmployeesInShifts(db);
    await removeEmployeeIdField(db);
    await removeShiftIdField(db);
    await dropAssignmentsCollection(db);
    await showResults(db);

    console.log("\nTransformation finished successfully.");
  } catch (err) {
    console.error("Transformation failed:", err);
  } finally {
    await closeDb();
    console.log("MongoDB connection closed.");
  }
}

main();