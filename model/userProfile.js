const mongoose = require('mongoose');

const userProfile = new mongoose.Schema({

    FullName: {
        type: String,
        required: true
    },
    Email: {
        type: String,
        required: true
    },
    Password: {
        type: String,
        required: true
    },
    resetPasswordToken: {
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