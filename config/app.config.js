module.exports = Object.freeze({
  APP_PORT: process.env.PORT,
  APP_NAME: process.env.APP_NAME,
  APP_URL: process.env.APP_URL,
  APP_ENV: process.env.NODE_ENV,
  APP_FRONT_END_APP_URL: process.env.FRONT_END_APP_URL,

  APP_ENCRYPTION_ALGORITHM: process.env.ENCRYPTION_ALGORITHM,
  APP_ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET,
});
