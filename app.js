require("dotenv").config();
require("./config/validate-env");
require("./utils/db-connection.util");
const express = require("express");
const path = require("node:path");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const morgan = require("morgan");
const logger = require("./utils/winston.util");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const { exceptionHandler } = require("./exceptionHandling");
const { sendResponse } = require("./helpers/requestHandler.helper");

const crypto = require("node:crypto");

const app = express();
app.disable("x-powered-by");

// Security headers
app.use(helmet());

// Request correlation — generate or forward X-Request-Id on every request
app.use((req, res, next) => {
  const id =
    (req.headers["x-request-id"] &&
      String(req.headers["x-request-id"]).slice(0, 64)) ||
    crypto.randomUUID();
  req.requestId = id;
  res.setHeader("X-Request-Id", id);
  next();
});

// CORS — restrict to configured frontend origin
if (process.env.NODE_ENV === "production" && !process.env.FRONT_END_APP_URL) {
  logger.warn(
    "FRONT_END_APP_URL is not set — CORS will block all browser cross-origin requests in production"
  );
}
app.use(
  cors({
    origin: process.env.FRONT_END_APP_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
    credentials: true,
  })
);

// Global rate limiter — 100 requests per 15 minutes per IP (disabled in test)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  handler: (_req, res) =>
    sendResponse(res, false, 429, "Too many requests, please try again later."),
});
app.use(globalLimiter);

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(morgan("combined", { stream: logger.stream }));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));
// Strip MongoDB operators from mutable request properties (defence-in-depth).
// req.query is read-only in Express 5 — Joi validation covers that boundary.
app.use((req, _res, next) => {
  if (req.body) req.body = mongoSanitize.sanitize(req.body);
  if (req.params) req.params = mongoSanitize.sanitize(req.params);
  next();
});

app.use(express.static(path.join(__dirname, "public")));

// routes
require("./routes/index.route")(app);

// Swagger — development and staging only
if (process.env.NODE_ENV !== "production") {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(YAML.load("./documentation/swagger.yaml"))
  );
}

// Health check
app.get("/health", (_req, res) => {
  return sendResponse(res, true, 200, "OK", {
    app: process.env.APP_NAME || "node-skeleton",
    env: process.env.NODE_ENV,
    uptime: process.uptime(),
  });
});

// 404 handler
app.use((_req, res) => {
  return sendResponse(res, false, 404, "Route not found");
});

// Centralized error handler
app.use((err, req, res, _next) => {
  return exceptionHandler(err, req, res);
});

module.exports = app;
