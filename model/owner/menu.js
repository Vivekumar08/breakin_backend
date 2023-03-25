const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
    Category: {
        Name: {
            type: String,
            required: true
        },
        Items: [
            {
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
            }]
    },
    foodPlace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FOODPLACES",
    }
},
    { timestamps: true }
)


const MenuItems = mongoose.model('MENUITEMS', MenuItemSchema);
module.exports = MenuItems;