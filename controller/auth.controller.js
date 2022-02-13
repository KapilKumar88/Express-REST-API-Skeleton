const { sendResponse } = require('../helpers/requestHandler.helper');
const UserModel = require('../models/user.model');
const { hashValue, verifyHash } = require('../helpers/hash.helper');
const { generateJwt, generateRefreshToken, verifyToken } = require('../helpers/jwt.helper');
const { welcomeEmail } = require('../helpers/mail.helper');
const { v4: uuidV4 } = require('uuid');

/**
 * Description: Login user into the application
 * @param {email, password} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.login = async (req, res, next) => {
    try {
        let uid = uuidV4();
        let result = await UserModel.findOne({ email: req.validated.email }).exec();

        if (result == null || !(await verifyHash(req.validated.password, result.password))) {
            return sendResponse(res, false, 401, "Invalid emailId and password");
        }

        await UserModel.findByIdAndUpdate(result._id, {
            refreshToken: uid
        });

        let token = await generateJwt({ id: result._id, name: result.name, email: result.email, userType: result.userType });

        let refreshToken = await generateRefreshToken({
            id: result._id,
            uid
        });

        if (token == undefined) {
            return sendResponse(res, false, 400, "Something went wrong please try again");
        }

        return sendResponse(res, true, 200, "Login Successfully", { token, refreshToken });
    } catch (error) {
        next(error);
    }
}



/**
 * Description: Register a new user into application
 * @param {name, email, password} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.register = async (req, res, next) => {
    try {
        let hash = await hashValue(req.validated.password);

        let user = await UserModel.create({
            name: req.validated.name,
            email: req.validated.email,
            password: hash
        });

        if (user._id) {
            await welcomeEmail({
                name: req.validated.name,
                email: req.validated.email
            })
            return sendResponse(res, true, 200, "Registered Successfully");
        }

        return sendResponse(res, true, 400, 'Something went wrong. Please try again')
    } catch (error) {
        next(error);
    }
}

/*
* Description: Refresh the access token
* @param {*} req 
* @param {*} res 
* @param {*} next 
*/
exports.refreshToken = async (req, res, next) => {
    try {
        let result = await verifyToken(req.body.token, true);

        if (result.uid) {
            let checkToken = await UserModel.findOne({ refreshToken: result.uid });

            if (checkToken._id == result.id) {
                let token = await generateJwt({ id: checkToken._id, name: checkToken.name, email: checkToken.email, userType: checkToken.userType });

                return sendResponse(res, true, 200, "Access token retrived successfully.", { token });

            } else {
                return sendResponse(res, true, 400, 'Invalid Token')
            }
        }

        return sendResponse(res, true, 400, 'Something went wrong. Please try again')
    } catch (error) {
        next(error);
    }
}