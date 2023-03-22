const mongoose = require('mongoose');

const FoodPlaceSchema = new mongoose.Schema({

    foodPlaceId: {
        type: String,
        required: true

    },
    FoodPlaceName: {
        type: String,
        required: true

    },
    status: {
        type: Boolean,
        default: true
    },
    type: {
        type: String,
        required: true
    },
    Landmark: {
        type: String,
        // required: true
    },
    CoverPhoto: {
        type: String,
        required: true
    },
    Cordinate: [
        {
            lat: Number
        },
        {
            lng: Number
        },
    ],
    mimetype: {
        type: String,
        // required: true
    },
    Menu: {
        type: mongoose.Schema.Types.Array,
        ref: "MENUITEMS",
    },
    RatedBy: {
        type: Number,
        default: 0
    },
    Reviews: {
        type: mongoose.Schema.Types.Array,
        ref: "RATEPLACE",
    },
})


const foodplace = mongoose.model('FOODPLACES', FoodPlaceSchema);
module.exports = foodplace;