module.exports = Object.freeze({
  LOG_FILE_NAME: process.env.WINSTON_LOG_FILE_NAME || "app-logs-%DATE%.log",
  DIR_NAME: process.env.WINSTON_LOG_DIR_NAME || "logs",
  ZIP_ARCHIVE: process.env.WINSTON_ZIP_ARCHIVE || false,
  MAX_SIZE: process.env.WINSTON_MAX_SIZE || "20m",
  MAX_FILES: process.env.WINSTON_MAX_FILE || "14d",
  DATE_PATTERN: "YYYY-MM-DD-HH",
});
