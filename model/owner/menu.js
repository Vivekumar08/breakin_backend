const mongoose = require('mongoose');

const MenuItemOwnerSchema = new mongoose.Schema({
    OwnerId: {
        type: String
    },
    ItemName: {
        type: String,
        require: true
    },
    Price: {
        type: String,
        required: true
    },
    Category: {
        type: String,
        required: true
    },
    Ingredients: {
        type: String,
        required: true
    },
    isVeg: {
        type: Boolean,
    },
},
    { timestamps: true }
)


const MenuItemOwner = mongoose.model('MENUITEMS', MenuItemOwnerSchema);
module.exports = MenuItemOwner;