const jwt = require("jsonwebtoken");
const jwtConfig = require("../config/jwt.config");

const generateJwt = async (payload) => {
  return jwt.sign(payload, jwtConfig.JWT_SECRET, {
    expiresIn: `${jwtConfig.JWT_EXPIRE_TIME}${jwtConfig.JWT_EXPIRE_TIME_UNIT}`,
  });
};

const verifyToken = async (token, refreshToken = false) => {
  if (refreshToken) {
    return jwt.verify(token, jwtConfig.JWT_REFRESH_TOKEN_SECRET);
  }

  return jwt.verify(token, jwtConfig.JWT_SECRET);
};

module.exports = {
  generateJwt,
  verifyToken,
};
