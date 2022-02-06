const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

const generateJwt = async (payload) => {
    return jwt.sign(payload, jwtConfig.JWT_SECRET, { expiresIn: jwtConfig.JWT_EXPIRE_TIME });
}

const verifyToken = async (token) => {
    return jwt.verify(token, jwtConfig.JWT_SECRET);
}


module.exports = {
    generateJwt,
    verifyToken
}