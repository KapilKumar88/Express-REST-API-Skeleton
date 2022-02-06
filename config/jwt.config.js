require('dotenv').config();

module.exports = Object.freeze({
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRE_TIME: process.env.JWT_EXPIRE_TIME || '30m'
});