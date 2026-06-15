const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

// Load .env so that real credentials are available as fallbacks.
// dotenv does not override vars already in process.env.
require("dotenv").config();

process.env.NODE_ENV = "test";

// Use the in-memory MongoDB URI written by globalSetup.js
const URI_FILE = path.join(os.tmpdir(), "jest-mongo-uri.txt");
if (fs.existsSync(URI_FILE)) {
  process.env.MONGO_CONNECTION_STRING = fs
    .readFileSync(URI_FILE, "utf-8")
    .trim();
} else {
  // Fallback: use MONGO_CONNECTION_STRING from .env (must be a test DB)
  process.env.MONGO_CONNECTION_STRING =
    process.env.MONGO_CONNECTION_STRING ||
    "mongodb://localhost:27017/node-skeleton-test";
}

process.env.JWT_SECRET =
  process.env.JWT_SECRET ||
  "test-jwt-secret-that-is-long-enough-for-tests-only";
// Must be ≥ 32 chars and different from JWT_SECRET
process.env.JWT_REFRESH_TOKEN_SECRET =
  process.env.JWT_REFRESH_TOKEN_SECRET ||
  "test-refresh-token-secret-long-enough-for-validation";
// 32-byte hex key (64 hex chars)
process.env.ENCRYPTION_SECRET =
  process.env.ENCRYPTION_SECRET ||
  "0000000000000000000000000000000000000000000000000000000000000001";
// 16-byte IV (32 hex chars)
// Mail — SMTP is mocked in tests; these values satisfy boot-time env validation only
process.env.MAIL_HOST = process.env.MAIL_HOST || "localhost";
process.env.MAIL_PORT = process.env.MAIL_PORT || "1025";
process.env.MAIL_USERNAME = process.env.MAIL_USERNAME || "test";
process.env.MAIL_PASSWORD = process.env.MAIL_PASSWORD || "test";
process.env.MAIL_FROM_ADDRESS =
  process.env.MAIL_FROM_ADDRESS || "no-reply@test.local";
