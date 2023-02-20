const mongoose = require('mongoose');

const ownerProfile = new mongoose.Schema({

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


const ownerP = mongoose.model('USER', ownerProfile);
module.exports = ownerP;