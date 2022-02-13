const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config');

const generateJwt = async (payload) => {
    return jwt.sign(payload, jwtConfig.JWT_SECRET, { expiresIn: jwtConfig.JWT_EXPIRE_TIME });
}

const verifyToken = async (token, refreshToken = false) => {
    if (refreshToken) {
        return jwt.verify(token, jwtConfig.JWT_REFRESH_TOKEN_SECRET);
    }

    return jwt.verify(token, jwtConfig.JWT_SECRET);
}

const generateRefreshToken = async (payload) => {
    return jwt.sign(payload, jwtConfig.JWT_REFRESH_TOKEN_SECRET, { expiresIn: jwtConfig.JWT_REFRESH_TOKEN_EXPIRE_TIME });
}


module.exports = {
    generateJwt,
    verifyToken,
    generateRefreshToken
}