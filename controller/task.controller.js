const { sendResponse } = require("../helpers/requestHandler.helper");
const taskService = require("../services/task.service");

/**
 * Description: Create a task
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns JSON
 */
exports.create = async (req, res, next) => {
  try {
    const result = await taskService.create({
      ...req.validated,
      userId: req.user._id,
    });
    return sendResponse(res, true, 201, "Task created successfully", result);
  } catch (error) {
    next(error);
  }
};

/**
 * Destails: Update the details of task in DB
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns JSON
 */
exports.update = async (req, res, next) => {
  try {
    const result = await taskService.update(req.validated.id, {
      name: req.validated.name,
      descrition: req.validated.description,
      status: req.validated.status,
    });

    return sendResponse(res, true, 200, "Task updated successfully", result);
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch a list
 * @param {*} _req
 * @param {*} res
 * @param {*} next
 * @returns JSON
 */
exports.list = async (_req, res, next) => {
  try {
    const result = await taskService.fetchAll(_req.validated);
    return sendResponse(
      res,
      true,
      200,
      "Task list fetched successfully",
      result
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a record
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns JSON
 */
exports.delete = async (req, res, next) => {
  try {
    const result = await taskService.deleteById(req.validated.id);
    if (result) {
      return sendResponse(res, true, 200, "Task deleted successfully");
    }

    return sendResponse(
      res,
      false,
      400,
      "Something went wrong or task does not exists."
    );
  } catch (error) {
    next(error);
  }
};
