const mongoose = require('mongoose');

const userProfile = new mongoose.Schema({

    FullName: {
        type: String,
        required:true
    },
    Email: {
        type: String,
    },
    Password: {
        type: String,
    },
    PhoneNumber:{
        type:String
    },
    previousPasswd: {
        type: [String],
    },
    profilePic: {
        type: String,
        default: null
    },
    profilePicMimetype:{
        type: String,
        default: null
    },
    previousPictures: {
        type: [String],
    },
    location:{
        type:String
    },
    resetPasswordOTP: {
        type: String,
        default: ""
    },
    resetPasswordExpires: {
        type: String,
        default: ""
    }
})


const userP = mongoose.model('USER', userProfile);
module.exports = userP;