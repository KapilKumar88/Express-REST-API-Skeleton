const mongoose = require("mongoose");

module.exports = function validateMongoObjectId(value, _helpers) {
  if (mongoose.Types.ObjectId.isValid(value)) {
    return value;
  }

  throw new Error("Invalid Id");
};
