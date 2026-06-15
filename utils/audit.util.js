const { createLogger, format, transports } = require("winston");
require("winston-daily-rotate-file");
const {
  DIR_NAME,
  ZIP_ARCHIVE,
  MAX_SIZE,
  MAX_FILES,
} = require("../config/winston.config");
const { combine, timestamp, json } = format;

const auditTransport = new transports.DailyRotateFile({
  filename: "audit-%DATE%.log",
  dirname: DIR_NAME,
  datePattern: "YYYY-MM-DD",
  zippedArchive: ZIP_ARCHIVE,
  maxSize: MAX_SIZE,
  maxFiles: MAX_FILES,
});

const auditLogger = createLogger({
  format: combine(timestamp(), json()),
  transports: [auditTransport],
  exitOnError: false,
});

/**
 * Log a security event to the dedicated audit log.
 * Rules:
 *   - meta must NEVER contain: token, password, resetLink, verificationLink, authHeader, cookie
 *   - on failure paths, do not include email (use userId or omit identity entirely)
 */
const auditLog = (event, meta = {}) => {
  auditLogger.info({ event, ...meta });
};

module.exports = { auditLog };
