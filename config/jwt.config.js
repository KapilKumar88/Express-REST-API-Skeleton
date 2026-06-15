module.exports = Object.freeze({
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE_TIME: process.env.JWT_EXPIRE_TIME || "30",
  JWT_EXPIRE_TIME_UNIT: "m",
  JWT_REFRESH_TOKEN_EXPIRE_TIME:
    process.env.JWT_REFRESH_TOKEN_EXPIRE_TIME || "90",
  JWT_REFRESH_TOKEN_EXPIRE_TIME_UNIT: "d",
  // Note: refresh tokens in this app are UUID strings stored in the DB,
  // not JWTs. JWT_REFRESH_TOKEN_SECRET is kept for potential future use.
  JWT_REFRESH_TOKEN_SECRET: process.env.JWT_REFRESH_TOKEN_SECRET,
});
