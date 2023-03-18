const mongoose = require('mongoose');

const FeedBackUserSchema = new mongoose.Schema({
    Message: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    userOwner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "USERS",
        required: true,
    },
},
    { timestamps: true }
)


const FeedBackUser = mongoose.model('FEEDBACKUSER', FeedBackUserSchema);
module.exports = FeedBackUser;