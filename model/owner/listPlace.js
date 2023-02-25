const mongoose = require('mongoose');

const ownerPlace = new mongoose.Schema({

    PlaceName: {
        type: String,
        required: true
    },
    Address: {
        type: String,
        required: true
    },
    OwnerName: {
        type: String,
        required: true
    },
    document: {
        type: String,
    },
    mimetype: {
        type: String,
    }
})


const listPlace = mongoose.model('LISTPLACE', ownerPlace);
module.exports = listPlace;