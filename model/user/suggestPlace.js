const mongoose = require('mongoose');

const SuggestPlaceSchema = new mongoose.Schema({
    PlaceName:{
        type:String,
        require:true
    },
    Address: {
        type: String,
        required: true
    },
    Contact: {
        type: String,
        required: true
    },
},
    { timestamps: true }
)


const SuggestPlace = mongoose.model('SUGGESTPLACE', SuggestPlaceSchema);
module.exports = SuggestPlace;