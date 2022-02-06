const mongoose = require('mongoose');

module.exports = (value, helpers) => {
    
    if(mongoose.Types.ObjectId.isValid(value)){
        return value;
    }
    
    throw new Error('Invalid Id');
};