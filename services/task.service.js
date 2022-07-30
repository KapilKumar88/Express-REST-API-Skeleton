const taskModel = require("../models/task.model");

/**
 * create a record in database
 * @param {name, description, status} params
 * @returns Promise
 */
exports.create = async (params) => {
  return taskModel.create(params);
};

/**
 * Update the recor in database
 * @param id mongoose.Schema.Types.ObjectId
 * @param {name, status, description} params Object
 * @returns Promise
 */
exports.update = async (id, params) => {
  return taskModel.findByIdAndUpdate(id, params, {
    returnDocument: "after",
  });
};

/**
 * find all the record by filter if present
 * @param {page, limit} params Object Optional
 * @returns Promise
 */
exports.fetchAll = async (params) => {
  let skip = (params.page - 1) * params.limit;
  return taskModel.find().skip(skip).limit(params.limit);
};

/**
 * Delete record by ID
 * @param id mongoose.Schema.Types.ObjectId
 * @returns Promise
 */
exports.deleteById = async (id) => {
  return taskModel.findByIdAndDelete(id);
};

/**
 * Find the record by ID
 * @param id mongoose.Schema.Types.ObjectId
 * @returns Promise
 */
exports.findById = async (id) => {
  return taskModel.findById(id);
};

/**
 * Return the count task in database
 * @param {*} filter Object
 * @return Promise
 */
exports.countAllRecord = (filter = {}) => {
  if (Object.keys(filter).length !== 0) {
    return taskModel.countDocuments();
  }
  return taskModel.countDocuments();
};
