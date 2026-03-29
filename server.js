"use strict";

const express = require("express");
const path = require("path");
const exphbs = require("express-handlebars");

const business = require("./business");
const persistence = require("./persistence");
const { ObjectId } = require("mongodb");

const app = express();
const PORT = 8000;
const SESSION_MINUTES = 5;
const PHOTOS_DIR = path.join(__dirname, "photos");

app.engine("hbs", exphbs.engine({
  extname: "hbs",
  defaultLayout: false
}));
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

/**
 * Read cookies from request headers.
 * @param {import("express").Request} req
 * @returns {Object}
 */
function parseCookies(req) {
  const header = req.headers.cookie;
  const cookies = {};

  if (!header) {
    return cookies;
  }

  const parts = header.split(";");
  let i = 0;

  while (i < parts.length) {
    const piece = parts[i].trim();
    const eqIndex = piece.indexOf("=");

    if (eqIndex > -1) {
      const key = piece.substring(0, eqIndex);
      const value = piece.substring(eqIndex + 1);
      cookies[key] = decodeURIComponent(value);
    }

    i += 1;
  }

  return cookies;
}

/**
 * Calculate a new session expiry time.
 * @returns {Date}
 */
function getSessionExpiry() {
  return new Date(Date.now() + SESSION_MINUTES * 60 * 1000);
}

/**
 * Load session from cookie and extend valid sessions.
 */
app.use(async function (req, res, next) {
  try {
    const cookies = parseCookies(req);
    const token = cookies.sessionToken;

    req.username = null;
    req.sessionToken = null;

    if (!token) {
      next();
      return;
    }

    const session = await persistence.getSessionByToken(token);

    if (!session) {
      next();
      return;
    }

    const now = new Date();
    const expiresAt = new Date(session.expiresAt);

    if (expiresAt <= now) {
      await persistence.deleteSession(token);
      res.setHeader("Set-Cookie", "sessionToken=; Path=/; Max-Age=0; HttpOnly");
      next();
      return;
    }

    const newExpiry = getSessionExpiry();
    await persistence.updateSessionExpiry(token, newExpiry);

    res.setHeader(
      "Set-Cookie",
      "sessionToken=" + token + "; Path=/; Max-Age=300; HttpOnly"
    );

    req.username = session.username;
    req.sessionToken = token;

    next();
  } catch (err) {
    next(err);
  }
});

/**
 * Security access log middleware.
 */
app.use(async function (req, res, next) {
  try {
    await persistence.insertSecurityLog(
      req.username,
      req.originalUrl,
      req.method
    );
    next();
  } catch (err) {
    next(err);
  }
});

/**
 * Protect all routes except login and logout.
 */
app.use(function (req, res, next) {
  if (req.path === "/login" || req.path === "/logout") {
    next();
    return;
  }

  if (!req.username) {
    res.redirect("/login?message=Please+log+in+to+continue");
    return;
  }

  next();
});

/**
 * Login page.
 */
app.get("/login", function (req, res) {
  res.render("login", { message: req.query.message || "" });
});

/**
 * Login submit.
 */
app.post("/login", async function (req, res, next) {
  try {
    const username = req.body.username;
    const password = req.body.password;

    const valid = await business.validateLogin(username, password);

    if (!valid) {
      res.status(401).render("login", {
        message: "Invalid username or password."
      });
      return;
    }

    const token = business.generateSessionToken();
    const expiresAt = getSessionExpiry();

    await persistence.createSession(token, username, expiresAt);

    res.setHeader(
      "Set-Cookie",
      "sessionToken=" + token + "; Path=/; Max-Age=300; HttpOnly"
    );

    res.redirect("/");
  } catch (err) {
    next(err);
  }
});

/**
 * Logout route.
 */
app.get("/logout", async function (req, res, next) {
  try {
    if (req.sessionToken) {
      await persistence.deleteSession(req.sessionToken);
    }

    res.setHeader("Set-Cookie", "sessionToken=; Path=/; Max-Age=0; HttpOnly");
    res.redirect("/login");
  } catch (err) {
    next(err);
  }
});

/**
 * Home page.
 */
app.get("/", async function (req, res, next) {
  try {
    const employees = await business.getEmployees();

    res.render("home", {
      employees: employees,
      username: req.username
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Employee details page.
 */
app.get("/employee/:id", async function (req, res, next) {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      res.status(404).send("Employee not found.");
      return;
    }

    const employee = await business.getEmployeeDetails(req.params.id);

    if (!employee) {
      res.status(404).send("Employee not found.");
      return;
    }

    res.render("employee", {
      employee: employee,
      username: req.username
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Protected employee photo route.
 */
app.get("/photo/:id", async function (req, res, next) {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      res.status(404).send("Employee not found.");
      return;
    }

    const employee = await persistence.getEmployeeById(req.params.id);

    if (!employee) {
      res.status(404).send("Employee not found.");
      return;
    }

    if (!employee.photoFilename) {
      res.status(404).send("Photo not found.");
      return;
    }

    res.sendFile(path.join(PHOTOS_DIR, employee.photoFilename));
  } catch (err) {
    next(err);
  }
});

/**
 * Edit employee form.
 */
app.get("/edit/:id", async function (req, res, next) {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      res.status(404).send("Employee not found.");
      return;
    }

    const employee = await business.getEmployeeDetails(req.params.id);

    if (!employee) {
      res.status(404).send("Employee not found.");
      return;
    }

    res.render("edit", {
      employee: employee,
      errors: [],
      username: req.username
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Edit employee submit.
 */
app.post("/edit/:id", async function (req, res, next) {
  try {
    const employeeId = req.params.id;

    if (!ObjectId.isValid(employeeId)) {
      res.status(404).send("Employee not found.");
      return;
    }

    const name = req.body.name;
    const phone = req.body.phone;

    const errors = await business.editEmployee(employeeId, name, phone);

    if (errors.length > 0) {
      res.render("edit", {
        employee: {
          _id: employeeId,
          name: name,
          phone: phone
        },
        errors: errors,
        username: req.username
      });
      return;
    }

    res.redirect("/employee/" + employeeId);
  } catch (err) {
    next(err);
  }
});

/**
 * Error handler.
 */
app.use(function (err, req, res, next) {
  console.error(err);
  res.status(500).send("Internal server error.");
});

/**
 * Start server.
 */
async function start() {
  await persistence.init();

  app.listen(PORT, function () {
    console.log("Server running on http://127.0.0.1:" + PORT);
  });
}

start();