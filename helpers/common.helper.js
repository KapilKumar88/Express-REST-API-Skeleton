const Joi = require("joi");
const crypto = require("node:crypto");
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
    ...(req.body ?? {}),
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

// Generate a cryptographically random token (default 48 bytes = 96 hex chars = 384-bit entropy)
exports.generateRandomToken = (length = 48) => {
  return crypto.randomBytes(length).toString("hex");
};

// sha256 hash of a value — used to store verification/reset tokens without exposing the raw value
exports.sha256Hash = (value) => {
  return crypto.createHash("sha256").update(value).digest("hex");
};
