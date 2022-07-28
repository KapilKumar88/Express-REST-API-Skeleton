const { sendResponse } = require("../helpers/requestHandler.helper");
const UserModel = require("../models/user.model");
const { hashValue, verifyHash } = require("../helpers/hash.helper");
const { generateJwt } = require("../helpers/jwt.helper");
const { welcomeEmail } = require("../helpers/mail.helper");
const { v4: uuidV4 } = require("uuid");
const moment = require("moment");
const {
  JWT_EXPIRE_TIME_UNIT,
  JWT_EXPIRE_TIME,
  JWT_REFRESH_TOKEN_EXPIRE_TIME,
  JWT_REFRESH_TOKEN_EXPIRE_TIME_UNIT,
} = require("../config/jwt.config");
const userService = require("../services/user.service");

/**
 * Description: Login user into the application
 * @param {email, password} req
 * @param {*} res
 * @param {*} next
 * @returns JSON
 */
exports.login = async (req, res, next) => {
  try {
    const uid = uuidV4();
    const refreshTokenExpTime = moment()
      .add(JWT_REFRESH_TOKEN_EXPIRE_TIME, JWT_REFRESH_TOKEN_EXPIRE_TIME_UNIT)
      .unix();
    const result = await userService.findOne({
      email: req.validated.email,
    });

    if (
      result === null ||
      !(await verifyHash(req.validated.password, result.password))
    ) {
      return sendResponse(res, false, 401, "Invalid emailId and password");
    }

    await userService.updateUserById(result._id, {
      refreshToken: uid,
      refreshTokenExpireAt: refreshTokenExpTime,
    });

    const token = await generateJwt({
      id: result._id,
    });

    if (token === undefined) {
      return sendResponse(
        res,
        false,
        400,
        "Something went wrong please try again"
      );
    }

    return sendResponse(res, true, 200, "Login Successfully", {
      token,
      tokenExpireAt: moment().add(JWT_EXPIRE_TIME, JWT_EXPIRE_TIME_UNIT).unix(),
      refreshToken: uid,
      refreshTokenExpireAt: refreshTokenExpTime,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Description: Register a new user into application
 * @param {name, email, password} req
 * @param {*} res
 * @param {*} next
 */
exports.register = async (req, res, next) => {
  try {
    const hash = await hashValue(req.validated.password);

    const user = await userService.create({
      name: req.validated.name,
      email: req.validated.email,
      password: hash,
    });

    if (user._id) {
      await welcomeEmail({
        name: user.name,
        email: user.email,
      });
      return sendResponse(res, true, 200, "Registered Successfully");
    }

    return sendResponse(
      res,
      true,
      400,
      "Something went wrong. Please try again"
    );
  } catch (error) {
    next(error);
  }
};

/*
 * Description: Refresh the access token
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const checkToken = await UserModel.findOne({
      refreshToken: req.validated.token,
    });

    if (checkToken?._id) {
      if (moment().unix() < checkToken.refreshTokenExpireAt) {
        const token = await generateJwt({
          id: checkToken._id,
          name: checkToken.name,
          email: checkToken.email,
          userType: checkToken.userType,
        });

        return sendResponse(
          res,
          true,
          200,
          "Access token retrived successfully.",
          { token }
        );
      }
      return sendResponse(res, true, 401, "Token Expired");
    } else {
      return sendResponse(res, true, 400, "Invalid Token");
    }
  } catch (error) {
    next(error);
  }
};
