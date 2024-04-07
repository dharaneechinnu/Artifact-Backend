const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
   
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: "User"
    },
 
    otpToken:{
         type:String,
    },
    Otpexprie:{
        type:String,
    },
    resetPwdToken: {
        type: String,
        default: null
    },
    resetPwdExpire: {
        type: Date,
        default: null
    },

});

const userModel = mongoose.model("ArtFactsLogin", userSchema); 
module.exports = userModel;