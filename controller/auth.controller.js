const { sendResponse } = require('../helpers/requestHandler.helper');
const UserModel = require('../models/user.model');
const { hashValue, verifyHash } = require('../helpers/hash.helper');
const { generateJwt } = require('../helpers/jwt.helper');
const { welcomeEmail } = require('../helpers/mail.helper');

/**
 * Description: Login user into the application
 * @param {email, password} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.login = async (req, res, next) => {
    try {

        let result = await UserModel.findOne({ email: req.validated.email }).exec();
        if (result == null || !(await verifyHash(req.validated.password, result.password))) {
            return sendResponse(res, false, 401, "Invalid emailId and password");
        }

        let token = await generateJwt({ id: result._id, name: result.name, email: result.email, userType: result.userType });

        if (token == undefined) {
            return sendResponse(res, false, 400, "Something went wrong please try again");
        }

        return sendResponse(res, true, 200, "Login Successfully", { token });
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

        if(user._id){
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