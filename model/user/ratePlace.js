const mongoose = require('mongoose');

const RatePlaceSchema = new mongoose.Schema({
    Name: {
        type: String,
        default: "Annonymous"
    },
    OverallRating: {
        type: String,
        required: true
    },
    Hygiene: {
        type: Number,
        required: true
    },
    Taste: {
        type: Number,
        required: true
    },
    Quality: {
        type: Number,
        required: true
    },
    Ambience: {
        type: Number,
        required: true
    },
    Comment: {
        type: String,
        required: true
    },
    foodPlaceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FOODPLACES",
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "USERS",
        required: true,
    },

},
    { timestamps: true }
)


const RatePlace = mongoose.model('RATEPLACES', RatePlaceSchema);
module.exports = RatePlace;