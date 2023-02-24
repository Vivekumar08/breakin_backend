const mongoose = require('mongoose');

const FeedBackUserSchema = new mongoose.Schema({
    Message: {
        type: String,
        required: true
    },
},
    { timestamps: true }
)


const FeedBackUser = mongoose.model('FEEDBACKUSER', FeedBackUserSchema);
module.exports = FeedBackUser;