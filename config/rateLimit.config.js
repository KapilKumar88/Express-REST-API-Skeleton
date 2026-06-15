const rateLimit = require("express-rate-limit");
const { sendResponse } = require("../helpers/requestHandler.helper");

const handler = (_req, res) =>
  sendResponse(res, false, 429, "Too many attempts. Please try again later.");

const skip = () => process.env.NODE_ENV === "test";

const base = { standardHeaders: true, legacyHeaders: false, skip, handler };

module.exports = {
  authLimiter: rateLimit({ ...base, windowMs: 15 * 60 * 1000, max: 10 }),
  resendLimiter: rateLimit({ ...base, windowMs: 60 * 60 * 1000, max: 5 }),
  verifyEmailLimiter: rateLimit({ ...base, windowMs: 60 * 60 * 1000, max: 10 }),
  logoutLimiter: rateLimit({ ...base, windowMs: 60 * 60 * 1000, max: 20 }),
  forgotPasswordLimiter: rateLimit({
    ...base,
    windowMs: 60 * 60 * 1000,
    max: 3,
  }),
};
