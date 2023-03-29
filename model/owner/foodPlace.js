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
    category: {
        type: String,
        required: true
    },
    CoverPhoto: {
        type: String,
        required: true
    },
    Locations: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        address: { type: String, required: true },
        landmark: { type: String, default: null },
    },
    mimetype: {
        type: String,
        // required: true
    },
    Menu: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MENUITEMS",
    },
    RatedBy: {
        type: Number,
        default: 0
    },
    Ratings: {
        type: Number,
        default: null
    },
})


const foodplace = mongoose.model('FOODPLACES', FoodPlaceSchema);
module.exports = foodplace;
