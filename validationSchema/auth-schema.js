const Joi = require("joi");
const { sendResponse } = require("../helpers/requestHandler.helper");
const userService = require("../services/user.service");
const { validateReqWithSchema } = require("../helpers/common.helper");
const validateUUID = require("./rules/validateUUID.rule");

const loginValidation = async (req, res, next) => {
  try {
    validateReqWithSchema(req, res, next, {
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    });
  } catch (error) {
    next(error);
  }
};

const registerValidation = async (req, res, next) => {
  try {
    const schema = Joi.object({
      name: Joi.string().max(50).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
      repeat_password: Joi.ref("password"),
    }).with("password", "repeat_password");

    const { value, error } = schema.validate(req.body);

    if (error !== undefined) {
      return sendResponse(res, false, 422, "Validations Error", {
        message: error?.details[0]?.message,
        field: error?.details[0]?.context?.key,
      });
    }

    if ((await userService.getCount({ email: value.email })) > 0) {
      return sendResponse(res, false, 422, "Validations Error", {
        message: "Email Id already exists. Please try with different.",
        field: "email",
      });
    }

    // set the variable in the request for validated data
    req.validated = value;
    next();
  } catch (error) {
    next(error);
  }
};

const refreshTokenValidation = async (req, res, next) => {
  try {
    validateReqWithSchema(req, res, next, {
      token: Joi.string()
        .required()
        .custom(validateUUID)
        .message("Invalid Token"),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loginValidation,
  registerValidation,
  refreshTokenValidation,
};
