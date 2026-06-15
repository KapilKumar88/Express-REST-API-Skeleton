const { sendResponse } = require("../helpers/requestHandler.helper");
const { hashValue, verifyHash } = require("../helpers/hash.helper");
const { generateJwt } = require("../helpers/jwt.helper");
const {
  welcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendAccountExistsEmail,
} = require("../helpers/mail.helper");
const { sha256Hash, generateRandomToken } = require("../helpers/common.helper");
const { v4: uuidV4 } = require("uuid");
const moment = require("moment");
const {
  JWT_EXPIRE_TIME_UNIT,
  JWT_EXPIRE_TIME,
  JWT_REFRESH_TOKEN_EXPIRE_TIME,
  JWT_REFRESH_TOKEN_EXPIRE_TIME_UNIT,
} = require("../config/jwt.config");
const userService = require("../services/user.service");
const verificationTokenService = require("../services/verificationToken.service");
const refreshTokenService = require("../services/refreshToken.service");
const { auditLog } = require("../utils/audit.util");
const {
  MAX_LOGIN_ATTEMPTS,
  LOCKOUT_MINUTES,
} = require("../config/lockout.config");

exports.login = async (req, res, next) => {
  try {
    const result = await userService.findOneWithPassword({
      email: req.validated.email,
    });

    if (result === null) {
      auditLog("LOGIN_FAILURE", {
        reason: "unknown_user",
        requestId: req.requestId,
      });
      return sendResponse(res, false, 401, "Invalid emailId and password");
    }

    // Check lockout BEFORE bcrypt to prevent timing oracle on locked accounts
    if (result.lockedUntil && new Date() < new Date(result.lockedUntil)) {
      auditLog("LOGIN_FAILURE", {
        reason: "locked",
        userId: String(result._id),
        requestId: req.requestId,
      });
      return sendResponse(res, false, 401, "Invalid emailId and password");
    }

    if (!(await verifyHash(req.validated.password, result.password))) {
      const updated = await userService.incrementFailedAttempts(result._id);
      if (updated.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
        const lockedUntil = moment().add(LOCKOUT_MINUTES, "m").toDate();
        await userService.lockUser(result._id, lockedUntil);
        auditLog("ACCOUNT_LOCKED", {
          userId: String(result._id),
          requestId: req.requestId,
        });
      }
      auditLog("LOGIN_FAILURE", {
        reason: "bad_password",
        requestId: req.requestId,
      });
      return sendResponse(res, false, 401, "Invalid emailId and password");
    }

    if (!result.emailVerifiedAt) {
      auditLog("LOGIN_FAILURE", {
        reason: "unverified",
        userId: String(result._id),
        requestId: req.requestId,
      });
      return sendResponse(
        res,
        false,
        403,
        "Please verify your email before logging in."
      );
    }

    // Successful login — reset brute-force counter and issue family-based refresh token
    await userService.resetLoginAttempts(result._id);

    const rawToken = generateRandomToken();
    const tokenHash = sha256Hash(rawToken);
    const family = uuidV4();
    const expiresAt = moment()
      .add(JWT_REFRESH_TOKEN_EXPIRE_TIME, JWT_REFRESH_TOKEN_EXPIRE_TIME_UNIT)
      .toDate();

    await refreshTokenService.create({
      userId: result._id,
      tokenHash,
      family,
      expiresAt,
    });

    const token = await generateJwt({ id: result._id });

    if (token === undefined) {
      return sendResponse(
        res,
        false,
        400,
        "Something went wrong please try again"
      );
    }

    auditLog("LOGIN_SUCCESS", {
      userId: String(result._id),
      requestId: req.requestId,
    });

    return sendResponse(res, true, 200, "Login Successfully", {
      token,
      tokenExpireAt: moment().add(JWT_EXPIRE_TIME, JWT_EXPIRE_TIME_UNIT).unix(),
      refreshToken: rawToken,
      refreshTokenExpireAt: Math.floor(expiresAt.getTime() / 1000),
    });
  } catch (error) {
    next(error);
  }
};

exports.register = async (req, res, next) => {
  try {
    const existingUser = await userService.findOne({
      email: req.validated.email,
    });

    if (existingUser) {
      // Enumeration-safe: silent no-op visible only in the email the owner receives
      sendAccountExistsEmail(req.validated.email);
      return sendResponse(
        res,
        true,
        200,
        "Registered Successfully. Please verify your email by clicking on the link sent to your email."
      );
    }

    const hash = await hashValue(req.validated.password);
    const user = await userService.create({
      name: req.validated.name,
      email: req.validated.email,
      password: hash,
    });

    if (user._id) {
      welcomeEmail({ name: user.name, email: user.email });
      await sendVerificationEmail(user.email, user.name);
      return sendResponse(
        res,
        true,
        200,
        "Registered Successfully. Please verify your email by clicking on the link sent to your email."
      );
    }

    return sendResponse(
      res,
      false,
      400,
      "Something went wrong. Please try again"
    );
  } catch (error) {
    next(error);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const tokenHash = sha256Hash(req.validated.token);
    const record = await refreshTokenService.findByHash(tokenHash);

    if (!record) {
      return sendResponse(res, false, 401, "Invalid token");
    }

    if (new Date() > new Date(record.expiresAt)) {
      return sendResponse(res, false, 401, "Token expired");
    }

    if (record.revoked) {
      // Reuse of a revoked token — compromise signal: revoke the entire family
      await refreshTokenService.revokeFamilyByFamily(record.family);
      auditLog("REFRESH_REUSE", {
        userId: record.userId.toHexString(),
        family: record.family,
        requestId: req.requestId,
      });
      return sendResponse(res, false, 401, "Session invalidated");
    }

    // Rotate: revoke old token, issue new one in the same family
    await refreshTokenService.revokeById(record._id);

    const rawToken = generateRandomToken();
    const newTokenHash = sha256Hash(rawToken);
    const expiresAt = moment()
      .add(JWT_REFRESH_TOKEN_EXPIRE_TIME, JWT_REFRESH_TOKEN_EXPIRE_TIME_UNIT)
      .toDate();

    await refreshTokenService.create({
      userId: record.userId,
      tokenHash: newTokenHash,
      family: record.family,
      expiresAt,
    });

    const token = await generateJwt({ id: record.userId });

    auditLog("TOKEN_REFRESH", {
      userId: record.userId.toHexString(),
      requestId: req.requestId,
    });

    return sendResponse(
      res,
      true,
      200,
      "Access token retrieved successfully.",
      {
        token,
        tokenExpireAt: moment()
          .add(JWT_EXPIRE_TIME, JWT_EXPIRE_TIME_UNIT)
          .unix(),
        refreshToken: rawToken,
        refreshTokenExpireAt: Math.floor(expiresAt.getTime() / 1000),
      }
    );
  } catch (error) {
    next(error);
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const tokenHash = sha256Hash(req.validated.token);
    const record = await verificationTokenService.findValidByHash(
      tokenHash,
      "EMAIL_VERIFY"
    );

    if (!record) {
      return sendResponse(res, false, 401, "Invalid or expired link");
    }

    // Single-use: delete before marking user verified
    await verificationTokenService.deleteByUserAndType(
      record.userId,
      "EMAIL_VERIFY"
    );

    await userService.updateUserById(record.userId, {
      emailVerifiedAt: new Date(),
    });

    auditLog("EMAIL_VERIFIED", {
      userId: record.userId.toHexString(),
      requestId: req.requestId,
    });

    return sendResponse(res, true, 200, "Email Verified successfully.");
  } catch (error) {
    next(error);
  }
};

exports.resendEmailVerificationMail = async (req, res, next) => {
  try {
    const user = await userService.findOne({ email: req.validated.email });
    if (user?._id && !user.emailVerifiedAt) {
      await sendVerificationEmail(user.email, user.name);
    }
    // Always return the same response to prevent user enumeration
    return sendResponse(res, true, 200, "Instructions sent successfully");
  } catch (error) {
    next(error);
  }
};

// req.user is set by isAuthenticated middleware
exports.logout = async (req, res, next) => {
  try {
    await refreshTokenService.deleteByUserId(req.user._id);
    auditLog("LOGOUT", {
      userId: String(req.user._id),
      requestId: req.requestId,
    });
    return sendResponse(res, true, 200, "Logged out successfully");
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await userService.findOne({ email: req.validated.email });

    if (user?._id && user.emailVerifiedAt) {
      await verificationTokenService.deleteByUserAndType(
        user._id,
        "PASSWORD_RESET"
      );

      const rawToken = generateRandomToken();
      const tokenHash = sha256Hash(rawToken);
      const expiresAt = moment().add(1, "h").toDate();

      await verificationTokenService.create(
        user._id,
        "PASSWORD_RESET",
        tokenHash,
        expiresAt
      );
      await sendPasswordResetEmail(user.email, user.name, rawToken);

      auditLog("PASSWORD_RESET_REQUESTED", {
        userId: String(user._id),
        requestId: req.requestId,
      });
    }

    // Always return the same response — enumeration-safe
    return sendResponse(
      res,
      true,
      200,
      "If that email is registered you will receive a reset link shortly."
    );
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const tokenHash = sha256Hash(req.validated.token);
    const record = await verificationTokenService.findValidByHash(
      tokenHash,
      "PASSWORD_RESET"
    );

    if (!record) {
      return sendResponse(res, false, 401, "Invalid or expired link");
    }

    // Single-use: delete before updating password
    await verificationTokenService.deleteByUserAndType(
      record.userId,
      "PASSWORD_RESET"
    );

    const newPasswordHash = await hashValue(req.validated.password);

    await userService.updateUserById(record.userId, {
      password: newPasswordHash,
      passwordResetAt: new Date(),
    });

    // Revoke all active refresh token families for this user
    await refreshTokenService.deleteByUserId(record.userId);

    auditLog("PASSWORD_RESET_COMPLETED", {
      userId: record.userId.toHexString(),
      requestId: req.requestId,
    });

    return sendResponse(
      res,
      true,
      200,
      "Password reset successfully. Please log in with your new password."
    );
  } catch (error) {
    next(error);
  }
};
