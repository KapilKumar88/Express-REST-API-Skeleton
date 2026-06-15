const verificationTokenModel = require("../models/verificationToken.model");

exports.create = (userId, type, tokenHash, expiresAt) => {
  return verificationTokenModel.create({ userId, type, tokenHash, expiresAt });
};

exports.findValidByHash = (tokenHash, type) => {
  return verificationTokenModel.findOne({
    tokenHash,
    type,
    expiresAt: { $gt: new Date() },
  });
};

exports.deleteByUserAndType = (userId, type) => {
  return verificationTokenModel.deleteMany({ userId, type });
};
