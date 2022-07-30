const { validate: uuidValidate } = require("uuid");

module.exports = (value, _helpers) => {
  if (uuidValidate(value)) {
    return value;
  }

  throw new Error("Invalid Token.");
};
