const { verifyToken } = require('../helpers/jwt-helper');

const authenticated = async (req, res, next) => {
    try {

        if(!req.headers.authorization){
            return res.status(401).json({
                status: false,
                statusCode: 401,
                statusMessage: 'Access token not found'
            })
        }
        
        let token = (req.headers.authorization).split(' ');
        req.user = await verifyToken((token[1]).trim());

        next();

    } catch (error) {
        next(error);
    }
}

module.exports = {
    authenticated
}