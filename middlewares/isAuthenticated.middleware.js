const { verifyToken } = require("../helpers/jwt.helper");
const userService = require("../services/user.service");

const isAuthenticated = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({
        status: false,
        statusCode: 401,
        statusMessage: "Access token not found",
      });
    }

    const token = req.headers.authorization.split(" ");
    const decodedToken = await verifyToken(token[1].trim());

    req.user = await userService.findOne({ _id: decodedToken.id });
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = isAuthenticated;
