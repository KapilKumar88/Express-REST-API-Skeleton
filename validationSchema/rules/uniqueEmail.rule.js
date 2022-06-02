const UserModel = require("../../models/user.model");

module.exports = async (value) => {
  const result = await UserModel.countDocuments({ email: value });

  return !(result > 0);
};
