const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email:{
    type: String,
    required: true,
    unique: true
  },
  password:{
    type: String,
    required: true
  },
  userType:{
    type: String,
    required: true,
    enum:['admin', 'user'],
    default: 'user'
  }
},{
  timestamps: true
});

const user = mongoose.model("user", userSchema);

module.exports = user;