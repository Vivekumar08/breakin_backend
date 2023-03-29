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
        Items: {
            type: mongoose.Schema.Types.Array,
            ref: "MENUITEMS",
        }
    }
    ]
},
    { timestamps: true }
)


const MenuCategory = mongoose.model('MENUCATEGORYS', MenuItemSchema);
module.exports = MenuCategory;