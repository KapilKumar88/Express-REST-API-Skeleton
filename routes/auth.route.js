const express = require("express");
const router = express.Router();
const authController = require("../controller/auth.controller");
const isAuthenticated = require("../middlewares/isAuthenticated.middleware");
const {
  authLimiter,
  resendLimiter,
  verifyEmailLimiter,
  logoutLimiter,
  forgotPasswordLimiter,
} = require("../config/rateLimit.config");
const {
  loginValidation,
  registerValidation,
  refreshTokenValidation,
  resendEmailVerification,
  emailVerificationValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} = require("../validationSchema/auth-schema");

router.post(
  "/register",
  authLimiter,
  registerValidation,
  authController.register
);
router.post("/login", authLimiter, loginValidation, authController.login);
router.post(
  "/token",
  authLimiter,
  refreshTokenValidation,
  authController.refreshToken
);
router.post(
  "/verify-email",
  verifyEmailLimiter,
  emailVerificationValidation,
  authController.verifyEmail
);
router.post(
  "/resend-email-verification",
  resendLimiter,
  resendEmailVerification,
  authController.resendEmailVerificationMail
);
router.post("/logout", logoutLimiter, isAuthenticated, authController.logout);
router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  forgotPasswordValidation,
  authController.forgotPassword
);
router.post(
  "/reset-password",
  resetPasswordValidation,
  authController.resetPassword
);

module.exports = router;
