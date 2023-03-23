const mongoose = require('mongoose');

const ownerPlace = new mongoose.Schema({

    PlaceName: {
        type: String,
        required: true
    },
    Address: {
        type: String,
        // required: true
    },
    OwnerName: {
        type: String,
        required: true
    },
    document: {
        type: String,
        // required: true
    },
    mimetype: {
        type: String,
        // required: true
    },
    status: {
        type: String,
    },
    foodPlace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FOODPLACES",
    }
})


const listPlace = mongoose.model('LISTPLACES', ownerPlace);
module.exports = listPlace;
