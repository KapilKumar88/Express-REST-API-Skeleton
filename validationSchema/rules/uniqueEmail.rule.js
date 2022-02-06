const UserModel = require('../../models/user.model');

module.exports = async (value) => {
    let result = await UserModel.countDocuments({email: value});
    
    return (result > 0) ? false : true;
};