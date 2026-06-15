const sendMail = require("../utils/mail.util");
const ejs = require("ejs");
const path = require("node:path");
const moment = require("moment");
const { APP_NAME, APP_FRONT_END_APP_URL } = require("../config/app.config");
const logger = require("../utils/winston.util");
const { generateRandomToken, sha256Hash } = require("./common.helper");
const verificationTokenService = require("../services/verificationToken.service");
const userService = require("../services/user.service");

const welcomeEmail = async (params) => {
  try {
    const templateStr = await ejs.renderFile(
      path.join(
        __dirname,
        "..",
        "views",
        "email-templates",
        "welcome-email.ejs"
      ),
      {
        username: params.name,
        appname: APP_NAME,
        dashboardURL: `${APP_FRONT_END_APP_URL}/dashboard`,
      }
    );
    return sendMail(params.email, "Welcome Email", templateStr);
  } catch (error) {
    logger.error("Internal server error in welcomeEmail", {
      error: error.message,
    });
    return false;
  }
};

const sendVerificationEmail = async (email, username) => {
  try {
    const user = await userService.findOne({ email });
    if (!user) return false;

    // Invalidate any existing EMAIL_VERIFY token for this user
    await verificationTokenService.deleteByUserAndType(
      user._id,
      "EMAIL_VERIFY"
    );

    const rawToken = generateRandomToken();
    const tokenHash = sha256Hash(rawToken);
    const expiresAt = moment().add(24, "h").toDate();

    await verificationTokenService.create(
      user._id,
      "EMAIL_VERIFY",
      tokenHash,
      expiresAt
    );

    const verificationURL = `${APP_FRONT_END_APP_URL}/email-verification?token=${rawToken}`;

    const templateStr = await ejs.renderFile(
      path.join(
        __dirname,
        "..",
        "views",
        "email-templates",
        "verification-email.ejs"
      ),
      { username, appname: APP_NAME, verificationURL }
    );

    return sendMail(email, "Verify your email", templateStr);
  } catch (error) {
    logger.error("Internal server error in sendVerificationEmail", {
      error: error.message,
    });
    return false;
  }
};

const sendPasswordResetEmail = async (email, username, rawToken) => {
  try {
    const resetURL = `${APP_FRONT_END_APP_URL}/reset-password?token=${rawToken}`;
    const templateStr = await ejs.renderFile(
      path.join(
        __dirname,
        "..",
        "views",
        "email-templates",
        "password-reset-email.ejs"
      ),
      { username, appname: APP_NAME, resetURL }
    );
    return sendMail(email, "Reset your password", templateStr);
  } catch (error) {
    logger.error("Internal server error in sendPasswordResetEmail", {
      error: error.message,
    });
    return false;
  }
};

const sendAccountExistsEmail = async (email) => {
  try {
    const templateStr = await ejs.renderFile(
      path.join(
        __dirname,
        "..",
        "views",
        "email-templates",
        "account-exists-email.ejs"
      ),
      {
        appname: APP_NAME,
        loginURL: `${APP_FRONT_END_APP_URL}/login`,
        forgotPasswordURL: `${APP_FRONT_END_APP_URL}/forgot-password`,
      }
    );
    return sendMail(email, "Account already exists", templateStr);
  } catch (error) {
    logger.error("Internal server error in sendAccountExistsEmail", {
      error: error.message,
    });
    return false;
  }
};

module.exports = {
  welcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendAccountExistsEmail,
};
