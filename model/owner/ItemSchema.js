const mongoose = require('mongoose');
const ItemSchema = new mongoose.Schema({
    ItemName: {
        type: String,
        require: true
    },
    Price: {
        type: Number,
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
        default: true
    },
    // menuId: {
    //     type: mongoose.Schema.Types.Array,
    //     ref: "MENUCATEGORYS",
    // }
})

const MenuItems = mongoose.model('MENUITEMS', ItemSchema);
module.exports = MenuItems;