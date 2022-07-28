const Joi = require("joi");
const { sendResponse } = require("../helpers/requestHandler.helper");
const { validate: uuidValidate } = require("uuid");
const userService = require("../services/user.service");

const loginValidation = async (req, res, next) => {
  try {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    });

    const { value, error } = schema.validate(req.body);

    if (error !== undefined) {
      return sendResponse(res, false, 422, error.details[0].message);
    }

    // set the variable in the request for validated data
    req.validated = value;
    next();
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
      return sendResponse(res, false, 422, error.details[0].message);
    }

    if ((await userService.getCount({ email: value.email })) > 0) {
      return sendResponse(
        res,
        false,
        422,
        "Email Id already exists. Please try with different."
      );
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
    const schema = Joi.object({
      token: Joi.string().required(),
    });

    const { value, error } = schema.validate(req.body);

    if (error !== undefined) {
      return sendResponse(res, false, 422, error.details[0].message);
    }

    if (!uuidValidate(value.token)) {
      return sendResponse(res, false, 422, "Invalid Token.");
    }

    // set the variable in the request for validated data
    req.validated = value;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loginValidation,
  registerValidation,
  refreshTokenValidation,
};
