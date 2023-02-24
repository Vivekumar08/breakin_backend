const mongoose = require('mongoose');

const HelpUserSchema = new mongoose.Schema({
    Name:{
        type:String,
        require:true
    },
    Email: {
        type: String,
        required: true
    },
    Message: {
        type: String,
        required: true
    },
},
    { timestamps: true }
)


const HelpUser = mongoose.model('HELPUSER', HelpUserSchema);
module.exports = HelpUser;