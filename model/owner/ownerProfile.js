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
    PreviousPassword: {
        type: [String],
    },
    PhoneNumber: {
        type: String,
    },
    profilePic: {
        type: String,
    },
    previousPictures: {
        type: [String],
    },
    CoverPhoto: {
        type: String,
    },
    previousCoverPhotos: {
        type: [String],
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


const ownerP = mongoose.model('OWNER', ownerProfile);
module.exports = ownerP;