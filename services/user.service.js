const userModel = require("../models/user.model");

exports.create = (params) => {
  return userModel.create({
    name: params.name,
    email: params.email,
    password: params.password,
  });
};

exports.getCount = (filter = {}) => {
  if (Object.keys(filter).length !== 0) {
    return userModel.countDocuments(filter);
  }
  return userModel.countDocuments();
};

exports.updateUserById = (id, params) => {
  return userModel.findByIdAndUpdate(id, params);
};

exports.updateUserByEmail = (email, params) => {
  return userModel.findOneAndUpdate({ email }, params);
};

// Password excluded — safe for general use (middleware, profile, etc.)
exports.findOne = (filter) => {
  return userModel.findOne(filter).select("-password");
};

// Password included — only for login password verification
exports.findOneWithPassword = (filter) => {
  return userModel.findOne(filter);
};

// Returns the updated document so the caller can read the new count in one round trip
exports.incrementFailedAttempts = (id) => {
  return userModel
    .findByIdAndUpdate(id, { $inc: { failedLoginAttempts: 1 } }, { new: true })
    .select("failedLoginAttempts");
};

exports.lockUser = (id, lockedUntil) => {
  return userModel.findByIdAndUpdate(id, { lockedUntil });
};

exports.resetLoginAttempts = (id) => {
  return userModel.findByIdAndUpdate(id, {
    failedLoginAttempts: 0,
    lockedUntil: null,
  });
};
