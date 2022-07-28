const { sendResponse } = require("../helpers/requestHandler.helper");
const logger = require("../utils/winston.util");

/**
 * Description: This handler is used to handle the exception and return the formatted
 * response with custom messages
 * @param {*} error
 * @param {*} res
 * @returns JSON
 */
exports.exceptionHandler = (error, req, res) => {
  let statusCode, message;

  switch (error?.code) {
    case 11000:
      statusCode = 422;
      message = "Email already exists. Try with different";
      break;
    default:
      statusCode = error?.status || 500;
      message = error?.message || "Internal server error.";
      break;
  }

  logger.error(
    `${statusCode} | ${message} | ${req.originalUrl} | ${req.method} | ${req.ip}`
  );

  return sendResponse(res, false, statusCode, message);
};
