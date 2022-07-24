const { createLogger, format, transports } = require("winston");
require("winston-daily-rotate-file");
const {
  DIR_NAME,
  ZIP_ARCHIVE,
  MAX_SIZE,
  MAX_FILES,
  LOG_FILE_NAME,
  DATE_PATTERN,
} = require("../config/winston.config");
const { combine, timestamp, prettyPrint } = format;
const { APP_ENV } = require("../config/app.config");

const dailyTransport = new transports.DailyRotateFile({
  filename: LOG_FILE_NAME,
  dirname: DIR_NAME,
  datePattern: DATE_PATTERN,
  zippedArchive: ZIP_ARCHIVE,
  maxSize: MAX_SIZE,
  maxFiles: MAX_FILES,
});

const logger = createLogger({
  format: combine(timestamp(), prettyPrint()),
  transports: [dailyTransport],
  exitOnError: false, // do not exit on handled exceptions
});

if (APP_ENV !== "production") {
  logger.add(
    new transports.Console({
      level: "debug",
      handleExceptions: true,
    })
  );
}

// create a stream object with a 'write' function that will be used by `morgan`
logger.stream = {
  write: function (message, _encoding) {
    // use the 'info' log level so the output will be picked up by both transports (file and console)
    logger.info(message);
  },
};

module.exports = logger;
