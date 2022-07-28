const Joi = require("joi");
const { sendResponse } = require("./requestHandler.helper");

/**
 * Validate the Validation schema and add the validated Object to req
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @param {*} validationSchema
 * @returns void
 */
exports.validateReqWithSchema = (req, res, next, validationSchema) => {
  const schema = Joi.object(validationSchema);
  const { value, error } = schema.validate({
    ...req.body,
    ...req.query,
    ...req.params,
  });
  if (error !== undefined) {
    return sendResponse(res, false, 422, "Validations Error", {
      message: error?.details[0]?.message,
      field: error?.details[0]?.context?.key,
    });
  }
  // set the variable in the request for validated data
  req.validated = value;
  next();
};
