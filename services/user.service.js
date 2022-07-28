const userModel = require("../models/user.model");

/**
 * Create a record in user table
 * @param {name, email, password} params
 * @returns Promise
 */
exports.create = (params) => {
  return userModel.create({
    name: params.name,
    email: params.email,
    password: params.password,
  });
};

/**
 * Count the documents by the given filter if present
 * @param {*} filter
 * @returns Promise
 */
exports.getCount = (filter = {}) => {
  if (Object.keys(filter).length !== 0) {
    return userModel.countDocuments(filter);
  }

  return userModel.countDocuments();
};
