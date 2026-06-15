const refreshTokenModel = require("../models/refreshToken.model");

exports.create = ({ userId, tokenHash, family, expiresAt }) => {
  return refreshTokenModel.create({ userId, tokenHash, family, expiresAt });
};

exports.findByHash = (tokenHash) => {
  return refreshTokenModel.findOne({ tokenHash });
};

exports.revokeById = (id) => {
  return refreshTokenModel.findByIdAndUpdate(id, { revoked: true });
};

exports.revokeFamilyByFamily = (family) => {
  return refreshTokenModel.updateMany({ family }, { revoked: true });
};

exports.deleteByUserId = (userId) => {
  return refreshTokenModel.deleteMany({ userId });
};
