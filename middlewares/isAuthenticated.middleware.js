const { verifyToken } = require("../helpers/jwt.helper");
const { sendResponse } = require("../helpers/requestHandler.helper");
const userService = require("../services/user.service");
const { auditLog } = require("../utils/audit.util");

const isAuthenticated = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      auditLog("ACCESS_DENIED", {
        reason: "missing_token",
        path: req.originalUrl,
        requestId: req.requestId,
      });
      return sendResponse(res, false, 401, "Access token not found");
    }

    const parts = req.headers.authorization.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      auditLog("ACCESS_DENIED", {
        reason: "invalid_format",
        path: req.originalUrl,
        requestId: req.requestId,
      });
      return sendResponse(res, false, 401, "Invalid authorization format");
    }

    const decodedToken = await verifyToken(parts[1].trim());
    req.user = await userService.findOne({ _id: decodedToken.id });

    if (!req.user) {
      auditLog("ACCESS_DENIED", {
        reason: "user_not_found",
        path: req.originalUrl,
        requestId: req.requestId,
      });
      return sendResponse(res, false, 401, "User not found");
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = isAuthenticated;
