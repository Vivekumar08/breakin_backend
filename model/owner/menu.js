const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
    ItemName: {
        type: String,
        require: true
    },
    Price: {
        type: Number,
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
    isAvailable: {
        type: Boolean,
        default:true
    },
    foodPlace:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "FOODPLACES",
    }
},
    { timestamps: true }
)


const MenuItems = mongoose.model('MENUITEMS', MenuItemSchema);
module.exports = MenuItems;