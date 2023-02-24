const mongoose = require('mongoose');

const RatePlaceSchema = new mongoose.Schema({
    Name:{
        type:String,
        default:"Annonymous"
    },
    OverallRating: {
        type: String,
        required: true
    },
    Hygiene: {
        type: String,
        required: true
    },
    Taste: {
        type: String,
        required: true
    },
    Quality: {
        type: String,
        required: true
    },
    Ambience: {
        type: String,
        required: true
    },
    Comment: {
        type: String,
        required: true
    },

},
    { timestamps: true }
)


const RatePlace = mongoose.model('RATEPLACE', RatePlaceSchema);
module.exports = RatePlace;