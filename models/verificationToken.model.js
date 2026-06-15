const mongoose = require("mongoose");

const verificationTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "user",
    },
    type: {
      type: String,
      required: true,
      enum: ["EMAIL_VERIFY", "PASSWORD_RESET"],
    },
    tokenHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

verificationTokenSchema.index({ userId: 1, type: 1 });

module.exports = mongoose.model("verificationToken", verificationTokenSchema);
