const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
    foodPlace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FOODPLACES",
    },
    Category: [{
        Name: {
            type: String,
            required: true
        },
        Items: [{
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
    }
    ]
},
    { timestamps: true }
)


const MenuCategory = mongoose.model('MENUCATEGORYS', MenuItemSchema);
module.exports = MenuCategory;