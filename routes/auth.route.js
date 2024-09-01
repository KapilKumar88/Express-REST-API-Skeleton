const express = require("express");
const router = express.Router();
const authController = require("../controller/auth.controller");
const {
  loginValidation,
  registerValidation,
  refreshTokenValidation,
  resendEmailVerification,
  emailVerificationValidation,
} = require("../validationSchema/auth-schema");

router.post("/register", registerValidation, authController.register);
router.post("/login", loginValidation, authController.login);
router.post("/token", refreshTokenValidation, authController.refreshToken);
router.post(
  "/verify-email",
  emailVerificationValidation,
  authController.verifyEmail
);
router.post(
  "/resend-email-verification",
  resendEmailVerification,
  authController.resendEmailVerificationMail
);

module.exports = router;
