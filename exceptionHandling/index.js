const { sendResponse } = require("../helpers/requestHandler.helper");
const logger = require("../utils/winston.util");
const jwt = require("jsonwebtoken");

exports.exceptionHandler = (error, req, res) => {
  let statusCode, clientMessage;

  if (
    error instanceof jwt.TokenExpiredError ||
    error instanceof jwt.JsonWebTokenError ||
    error instanceof jwt.NotBeforeError
  ) {
    statusCode = 401;
    clientMessage = "Authentication failed";
  } else if (error?.code === 11000) {
    statusCode = 500;
    clientMessage = "Internal server error";
  } else {
    statusCode = error?.statusCode || 500;
    clientMessage = "Internal server error";
  }

  logger.error({
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    statusCode,
    errorCode: error?.code,
    message: error?.message,
    stack: error?.stack,
  });

  return sendResponse(res, false, statusCode, clientMessage);
};
