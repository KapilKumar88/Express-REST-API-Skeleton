const { createLogger, format, transports } = require('winston');
const { DailyRotateFile } = require('winston/lib/winston/transports');
const { DIR_NAME, ZIP_ARCHIVE, MAX_SIZE, MAX_FILES, LOG_FILE_NAME } = require('../config/winston.config');
const { combine, timestamp, prettyPrint } = format;

const dailyTransport = DailyRotateFile({
    filename: LOG_FILE_NAME,
    dirname: DIR_NAME,
    datePattern: 'YYYY-MM-DD-HH',
    zippedArchive: ZIP_ARCHIVE,
    maxSize: MAX_SIZE,
    maxFiles: MAX_FILES
});

const logger = createLogger({
    format: combine(timestamp(), prettyPrint()),
    transports: [
        dailyTransport,
        new transports.Console({
            level: 'debug',
            handleExceptions: true,
        })
    ],
    exitOnError: false, // do not exit on handled exceptions
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
    }));
}

// create a stream object with a 'write' function that will be used by `morgan`
logger.stream = {
    write: function (message, encoding) {
        // use the 'info' log level so the output will be picked up by both transports (file and console)
        logger.info(message);
    },
};

module.exports = logger;