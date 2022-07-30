const express = require("express");
const router = express.Router();
const taskController = require("../controller/task.controller");
const isAuthenticated = require("../middlewares/isAuthenticated.middleware");
const {
  updateTaskValidation,
  createTaskValidation,
  getTaskValidation,
  deleteTaskValidation,
} = require("../validationSchema/task.validation");

router.post(
  "/create",
  isAuthenticated,
  createTaskValidation,
  taskController.create
);
router.put(
  "/update/:id",
  isAuthenticated,
  updateTaskValidation,
  taskController.update
);

router.delete(
  "/delete/:id",
  isAuthenticated,
  deleteTaskValidation,
  taskController.delete
);
router.get("/list", isAuthenticated, getTaskValidation, taskController.list);

module.exports = router;
