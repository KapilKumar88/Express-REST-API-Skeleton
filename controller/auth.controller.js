const { sendResponse } = require("../helpers/requestHandler.helper");
const { hashValue, verifyHash } = require("../helpers/hash.helper");
const { generateJwt } = require("../helpers/jwt.helper");
const {
  welcomeEmail,
  sendVerificationEmail,
} = require("../helpers/mail.helper");
const { v4: uuidV4 } = require("uuid");
const moment = require("moment");
const {
  JWT_EXPIRE_TIME_UNIT,
  JWT_EXPIRE_TIME,
  JWT_REFRESH_TOKEN_EXPIRE_TIME,
  JWT_REFRESH_TOKEN_EXPIRE_TIME_UNIT,
} = require("../config/jwt.config");
const userService = require("../services/user.service");
const { decrypt } = require("../helpers/encryptDecrypt.helper");

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
 * @return JSON
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
      welcomeEmail({
        name: user.name,
        email: user.email,
      });
      await sendVerificationEmail(user.email, user.name);
      return sendResponse(
        res,
        true,
        200,
        "Registered Successfully. Please verify you email by clicking on the link sent on you email."
      );
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
 * @return JSON
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const checkToken = await userService.findOne({
      refreshToken: req.validated.token,
    });

    if (checkToken?._id) {
      if (moment().unix() < checkToken.refreshTokenExpireAt) {
        const token = await generateJwt({
          id: checkToken._id,
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

exports.verifyEmail = async (req, res, next) => {
  try {
    let decryptToken = decrypt(req.validated.token);
    decryptToken = JSON.parse(decryptToken);

    const currentTime = moment().unix();

    if (currentTime > decryptToken.expiryTime) {
      return sendResponse(res, false, 401, "Link expired");
    }

    const checkToken = await userService.findOne({
      email: decryptToken?.email,
      emailVerificationToken: decryptToken?.token,
    });

    if (checkToken?._id) {
      await userService.updateUserById(checkToken?._id, {
        emailVerifiedAt: moment(),
      });

      return sendResponse(res, true, 200, "Email Verified successfully.");
    } else {
      return sendResponse(res, true, 400, "Invalid Link");
    }
  } catch (error) {
    next(error);
  }
};

exports.resendEmailVerificationMail = async (req, res, next) => {
  try {
    const user = await userService.findOne({
      email: req.validated.email,
    });
    if (user._id) {
      await sendVerificationEmail(user.email, user.name);
    }
    return sendResponse(res, true, 200, "Instructions sent successfully");
  } catch (error) {
    next(error);
  }
};
