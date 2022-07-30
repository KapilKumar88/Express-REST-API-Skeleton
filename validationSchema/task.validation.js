const { validateReqWithSchema } = require("../helpers/common.helper");
const Joi = require("joi");
const validateMongooseId = require("./rules/validateMongoObjectId.rule");

/**
 * Description: This function validate the payload for create task API
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
exports.createTaskValidation = (req, res, next) => {
  try {
    validateReqWithSchema(req, res, next, {
      name: Joi.string().trim().min(3).max(150).required(),
      description: Joi.string().trim().min(3).max(500).required(),
      status: Joi.string()
        .trim()
        .valid("in-progress", "done", "todo")
        .optional(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Description: validate the payload for update task API
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
exports.updateTaskValidation = (req, res, next) => {
  try {
    validateReqWithSchema(req, res, next, {
      id: Joi.string()
        .trim()
        .required()
        .custom(validateMongooseId)
        .message("InvalidId"),
      name: Joi.string().trim().min(3).max(150).required(),
      description: Joi.string().trim().min(3).max(500).required(),
      status: Joi.string()
        .trim()
        .valid("in-progress", "done", "todo")
        .optional(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Description: Fetch list Validation
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
exports.getTaskValidation = (req, res, next) => {
  try {
    validateReqWithSchema(req, res, next, {
      page: Joi.number().integer().required(),
      limit: Joi.number().integer().required(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Description: Delete task validation
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
exports.deleteTaskValidation = (req, res, next) => {
  try {
    validateReqWithSchema(req, res, next, {
      id: Joi.string()
        .trim()
        .required()
        .custom(validateMongooseId)
        .message("InvalidId"),
    });
  } catch (error) {
    next(error);
  }
};
