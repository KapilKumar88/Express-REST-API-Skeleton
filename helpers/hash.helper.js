const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 12;

const hashValue = async (value) => {
  return bcrypt.hash(value, SALT_ROUNDS);
};

const verifyHash = async (value, hash) => {
  return bcrypt.compare(value, hash);
};

module.exports = {
  hashValue,
  verifyHash,
};
