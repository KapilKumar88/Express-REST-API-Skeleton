const mongoose = require("mongoose");
const { v4: uuidV4 } = require("uuid");

const refreshTokenSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: uuidV4,
    },
    userId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "user",
    },
    tokenHash: {
      type: String,
      required: true,
    },
    family: {
      type: String,
      required: true,
    },
    revoked: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    _id: false,
  }
);

refreshTokenSchema.index({ userId: 1 });
refreshTokenSchema.index({ family: 1 });
refreshTokenSchema.index({ expiresAt: 1 });

module.exports = mongoose.model("refreshToken", refreshTokenSchema);
