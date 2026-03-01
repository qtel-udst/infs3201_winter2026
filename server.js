"use strict";

const path = require("path");
const express = require("express");
const { engine } = require("express-handlebars");

const { getDb } = require("./db");
const persistence = require("./persistence");
const business = require("./business");

const PORT = 8000;
const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017";

async function main() {
  const db = await getDb(MONGO_URL);
  persistence.init(db);

  const app = express();

  // Handlebars
  app.engine("hbs", engine({
  extname: ".hbs",
  defaultLayout: false
}));
  app.set("view engine", "hbs");
  app.set("views", path.join(__dirname, "views"));

  // Form parsing
  app.use(express.urlencoded({ extended: false }));

  // Static CSS only
  app.use("/public", express.static(path.join(__dirname, "public")));

  /**
   * Landing page: list employees
   */
  app.get("/", async (req, res) => {
    try {
      const employees = await business.listEmployees();
      res.render("home", { employees: employees });
    } catch (e) {
      res.status(500).send("Server error loading employees.");
    }
  });

  /**
   * Employee details page
   */
  app.get("/employee/:employeeId", async (req, res) => {
    try {
      const employeeId = String(req.params.employeeId || "").toUpperCase();
      const result = await business.getEmployeeDetails(employeeId);
      if (!result.ok) return res.status(404).send(result.message);

      res.render("employee", {
        employee: result.employee,
        shifts: result.shifts
      });
    } catch (e) {
      res.status(500).send("Server error loading employee details.");
    }
  });

  /**
   * Edit employee details (GET form)
   */
  app.get("/edit/:employeeId", async (req, res) => {
    try {
      const employeeId = String(req.params.employeeId || "").toUpperCase();
      const emp = await persistence.getEmployeeById(employeeId);
      if (!emp) return res.status(404).send(`Employee not found: ${employeeId}`);

      res.render("edit", { employee: emp });
    } catch (e) {
      res.status(500).send("Server error loading edit form.");
    }
  });

  /**
   * Edit employee details (POST)
   * Server-side validation only, then PRG redirect to "/"
   */
  app.post("/edit/:employeeId", async (req, res) => {
    try {
      const employeeId = String(req.params.employeeId || "").toUpperCase();

      const check = business.validateEmployeeEdit(req.body.name, req.body.phone);
      if (!check.ok) return res.status(400).send(check.message);

      const updated = await persistence.updateEmployee(
        employeeId,
        check.name,
        check.phone
      );
      if (!updated) return res.status(404).send(`Employee not found: ${employeeId}`);

      // PRG cycle
      res.redirect("/");
    } catch (e) {
      res.status(500).send("Server error saving employee details.");
    }
  });

  app.listen(PORT, () => {
    console.log(`Server running at http://127.0.0.1:${PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});