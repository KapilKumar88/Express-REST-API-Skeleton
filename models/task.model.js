const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: [3, "name must be at least 3 characters"],
      maxlength: [200, "name must not exceed 200 characters"],
    },
    description: {
      type: String,
      required: true,
      minlength: [3, "description must be at least 3 characters"],
      maxlength: [500, "description must not exceed 500 characters"],
    },
    status: {
      type: String,
      required: true,
      enum: ["in-progress", "done", "todo"],
      default: "todo",
    },
    userId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "user",
    },
  },
  {
    timestamps: true,
  }
);

taskSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("task", taskSchema);
