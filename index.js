"use strict";

const fs = require("fs/promises");
const prompt = require("prompt-sync")({ sigint: true });

/**
 * Read a JSON file and return an array. If missing/empty, return [].
 * @param {string} fileName
 * @returns {Promise<Array>}
 */
async function loadList(fileName) {
    try {
        const raw = await fs.readFile(fileName, "utf-8");
        if (!raw || raw.trim().length === 0) {
            return [];
        }
        const data = JSON.parse(raw);
        if (!data) {
            return [];
        }
        return data;
    } catch (err) {
        if (err && err.code === "ENOENT") {
            return [];
        }
        console.log("Error reading " + fileName);
        return [];
    }
}

/**
 * Save an array to a JSON file.
 * @param {string} fileName
 * @param {Array} list
 * @returns {Promise<void>}
 */
async function saveList(fileName, list) {
    const out = JSON.stringify(list);
    await fs.writeFile(fileName, out, "utf-8");
}

/**
 * Create next employeeId in E### format.
 * @param {Array} employees
 * @returns {string}
 */
function nextEmployeeId(employees) {
    let max = 0;
    let i = 0;

    while (i < employees.length) {
        const id = String(employees[i].employeeId || "");
        if (id.length > 1 && id[0] === "E") {
            const n = Number(id.substring(1));
            if (!isNaN(n) && n > max) {
                max = n;
            }
        }
        i++;
    }

    let next = String(max + 1);
    while (next.length < 3) {
        next = "0" + next;
    }
    return "E" + next;
}

/**
 * Print all employees with aligned columns.
 * @returns {Promise<void>}
 */
async function listEmployees() {
    const employees = await loadList("employees.json");

    const idW = 11;
    const nameW = 20;

    console.log("Employee ID".padEnd(idW) + "  " + "Name".padEnd(nameW) + "  Phone");
    console.log("-".repeat(idW) + "  " + "-".repeat(nameW) + "  " + "-".repeat(9));

    let i = 0;
    while (i < employees.length) {
        const e = employees[i] || {};
        console.log(
            String(e.employeeId || "").padEnd(idW) + "  " +
            String(e.name || "").padEnd(nameW) + "  " +
            String(e.phone || "")
        );
        i++;
    }
}

/**
 * Add a new employee (auto-increment ID) and save.
 * @returns {Promise<void>}
 */
async function addEmployee() {
    const employees = await loadList("employees.json");
    const name = prompt("Enter employee name: ").trim();
    const phone = prompt("Enter phone number: ").trim();

    const newId = nextEmployeeId(employees);
    employees[employees.length] = { employeeId: newId, name: name, phone: phone };

    await saveList("employees.json", employees);
    console.log("Employee added...");
}

/**
 * Assign an employee to a shift (referential integrity + composite key).
 * @returns {Promise<void>}
 */
async function assignShift() {
    const employees = await loadList("employees.json");
    const shifts = await loadList("shifts.json");
    const assignments = await loadList("assignments.json");

    const employeeId = prompt("Enter employee ID: ").trim();
    const shiftId = prompt("Enter shift ID: ").trim();

    let empFound = false;
    let i = 0;
    while (i < employees.length) {
        if (employees[i].employeeId === employeeId) {
            empFound = true;
        }
        i++;
    }
    if (!empFound) {
        console.log("Employee does not exist");
        return;
    }

    let shiftFound = false;
    i = 0;
    while (i < shifts.length) {
        if (shifts[i].shiftId === shiftId) {
            shiftFound = true;
        }
        i++;
    }
    if (!shiftFound) {
        console.log("Shift does not exist");
        return;
    }

    i = 0;
    while (i < assignments.length) {
        if (assignments[i].employeeId === employeeId && assignments[i].shiftId === shiftId) {
            console.log("Employee already assigned to shift");
            return;
        }
        i++;
    }

    assignments[assignments.length] = { employeeId: employeeId, shiftId: shiftId };
    await saveList("assignments.json", assignments);
    console.log("Shift Recorded");
}

/**
 * Print employee schedule as CSV-like output.
 * @returns {Promise<void>}
 */
async function viewSchedule() {
    const employeeId = prompt("Enter employee ID: ").trim();
    console.log("date,startTime,endTime");

    const employees = await loadList("employees.json");
    let empFound = false;
    let i = 0;
    while (i < employees.length) {
        if (employees[i].employeeId === employeeId) {
            empFound = true;
        }
        i++;
    }
    if (!empFound) {
        return;
    }

    const assignments = await loadList("assignments.json");
    const shifts = await loadList("shifts.json");

    i = 0;
    while (i < shifts.length) {
        const s = shifts[i];
        let assigned = false;

        let j = 0;
        while (j < assignments.length) {
            if (assignments[j].employeeId === employeeId && assignments[j].shiftId === s.shiftId) {
                assigned = true;
            }
            j++;
        }

        if (assigned) {
            console.log(s.date + "," + s.startTime + "," + s.endTime);
        }
        i++;
    }
}

/**
 * Program entry point.
 * @returns {Promise<void>}
 */
async function main() {
    while (true) {
        console.log("1. Show all employees");
        console.log("2. Add new employee");
        console.log("3. Assign employee to shift");
        console.log("4. View employee schedule");
        console.log("5. Exit");

        const selection = Number(prompt("What is your choice> "));

        if (selection === 1) {
            await listEmployees();
        } else if (selection === 2) {
            await addEmployee();
        } else if (selection === 3) {
            await assignShift();
        } else if (selection === 4) {
            await viewSchedule();
        } else if (selection === 5) {
            break;
        } else {
            console.log("******** ERROR!!! Pick a number between 1 and 5");
        }

        console.log("");
    }
}

main();
