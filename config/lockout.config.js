module.exports = Object.freeze({
  MAX_LOGIN_ATTEMPTS: Number.parseInt(process.env.MAX_LOGIN_ATTEMPTS, 10) || 5,
  LOCKOUT_MINUTES: Number.parseInt(process.env.LOCKOUT_MINUTES, 10) || 30,
});
