const bcrypt = require("bcryptjs");

const hashValue = async (value) => {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(value, salt);
};

const verifyHash = async (value, hash) => {
  return bcrypt.compare(value, hash);
};

module.exports = {
  hashValue,
  verifyHash,
};
