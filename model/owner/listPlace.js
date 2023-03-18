const mongoose = require('mongoose');

const ownerPlace = new mongoose.Schema({

    PlaceId: {
        type: String,
        required: true
        
    },
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
    Menu: {
        type: mongoose.Schema.Types.Array,
        ref: "MENUITEMS",
    },
    Reviews: {
        type: mongoose.Schema.Types.Array,
        ref: "RATEPLACE",
    },
})


const listPlace = mongoose.model('LISTPLACE', ownerPlace);
module.exports = listPlace;