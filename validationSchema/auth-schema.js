const Joi = require("joi");
const { validateReqWithSchema } = require("../helpers/common.helper");

const loginValidation = async (req, res, next) => {
  try {
    validateReqWithSchema(req, res, next, {
      email: Joi.string().email().lowercase().trim().required(),
      password: Joi.string().required(),
    });
  } catch (error) {
    next(error);
  }
};

const registerValidation = (req, res, next) => {
  try {
    validateReqWithSchema(req, res, next, {
      name: Joi.string().trim().max(50).required().label("Full Name"),
      email: Joi.string().email().lowercase().trim().required().label("Email"),
      password: Joi.string().min(8).max(128).required().label("Password"),
      confirm_password: Joi.string()
        .valid(Joi.ref("password"))
        .required()
        .label("Confirm Password")
        .messages({ "any.only": "Passwords do not match" }),
    });
  } catch (error) {
    next(error);
  }
};

const refreshTokenValidation = async (req, res, next) => {
  try {
    validateReqWithSchema(req, res, next, {
      token: Joi.string().hex().min(64).required().label("Refresh token"),
    });
  } catch (error) {
    next(error);
  }
};

const emailVerificationValidation = async (req, res, next) => {
  try {
    validateReqWithSchema(req, res, next, {
      token: Joi.string().required().label("Token"),
    });
  } catch (error) {
    next(error);
  }
};

const emailOnlyValidation = (req, res, next) => {
  try {
    validateReqWithSchema(req, res, next, {
      email: Joi.string().email().lowercase().trim().required().label("Email"),
    });
  } catch (error) {
    next(error);
  }
};

const resendEmailVerification = emailOnlyValidation;

const forgotPasswordValidation = emailOnlyValidation;

const resetPasswordValidation = (req, res, next) => {
  try {
    validateReqWithSchema(req, res, next, {
      token: Joi.string().required().label("Token"),
      password: Joi.string().min(8).max(128).required().label("Password"),
      confirm_password: Joi.string()
        .valid(Joi.ref("password"))
        .required()
        .label("Confirm Password")
        .messages({ "any.only": "Passwords do not match" }),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loginValidation,
  registerValidation,
  refreshTokenValidation,
  resendEmailVerification,
  emailVerificationValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
};
