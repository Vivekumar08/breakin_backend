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
    }
})
const MenuItemSchema = new mongoose.Schema({
    Category: [{
        Name: {
            type: String,
            required: true
        },
        Items: [{
            type: ItemSchema
        }
        ]
    }],
    foodPlace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FOODPLACES",
    }
},
    { timestamps: true }
)


const MenuItems = mongoose.model('MENUITEMS', MenuItemSchema);
module.exports = MenuItems;