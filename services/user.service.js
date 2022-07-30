const userModel = require("../models/user.model");

/**
 * Description: Create a record in user table
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
 * Description: Count the documents by the given filter if present
 * @param {*} filter
 * @returns Promise
 */
exports.getCount = (filter = {}) => {
  if (Object.keys(filter).length !== 0) {
    return userModel.countDocuments(filter);
  }

  return userModel.countDocuments();
};

/**
 * Description: find the user by ID and update details
 * @param id mongoose.Schema.Types.ObjectId
 * @param {*} params
 * @returns Promise
 */
exports.updateUserById = (id, params) => {
  return userModel.findByIdAndUpdate(id, params);
};

/**
 * Description: Find the user in Database
 * @param {*} filter
 * @returns Promise
 */
exports.findOne = (filter) => {
  return userModel.findOne(filter);
};
