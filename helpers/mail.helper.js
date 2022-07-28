const sendMail = require("../utils/mail.util");
const ejs = require("ejs");
const { APP_NAME } = require("../config/app.config");
const logger = require("../utils/winston.util");
const path = require("path");

/**
 * This fucntion will render a welcome email template
 * and will send a mail to the given mail ID
 * @param {name, email} params
 * @returns
 */
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
      }
    );

    return sendMail(params.email, "Welcome Email", templateStr);
  } catch (error) {
    logger.error("Internal server error in Welcome Email function");
    return false;
  }
};

module.exports = {
  welcomeEmail,
};
