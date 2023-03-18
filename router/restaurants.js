const express = require("express");
require("dotenv").config();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth")
const restaurantRouter = express.Router();

const MenuItems = require("../model/owner/menu");
const RatePlace = require("../model/user/ratePlace");
const userP = require("../model/user/userProfile");
const ownerP = require("../model/owner/ownerProfile");
const listPlace = require("../model/owner/listPlace");
const { averageAll, generateRandomId } = require("../utils/basicsFunctions");
const upload = require("../utils/bucket");


// Rate Place

restaurantRouter.get("/review/:id", async (req, res) => {
    const place = await listPlace.find({ PlaceId: req.params.id })
    // const reviews = await 
    // let OverallRating, Hygiene, Taste, Quality, Ambience, Comment  ;
    // OverallRating = averageAll(place)
})

restaurantRouter.post('/ratePlace/:id', auth, async (req, res) => {
    const { OverallRating, Hygiene, Taste, Quality, Ambience, Comment } = req.body;
    try {
        if (!OverallRating, !Hygiene, !Taste, !Quality, !Ambience, !Comment) {
            res.status(400).json({ msg: "You can not rate this place with incomplete information" })
        }
        const user = await userP.findById(req.user)
        const ratePlace = new RatePlace({
            OverallRating, Hygiene, Taste, Quality, Ambience, Comment,
            userId: user
        });
        await listPlace.findOneAndUpdate({ PlaceId: req.params.id }, { $push: { Reviews: ratePlace } })
        const savedUser = await ratePlace.save();
        res.status(200).json(savedUser)
    } catch (error) {
        console.log("Server Error")
    }
})

restaurantRouter.post("/listPlace", auth, upload.single("file"), async (req, res) => {
    try {
        const { PlaceName, Address, OwnerName } = req.body;
        const { filename, mimetype } = req.file;

        if (!PlaceName, !Address, !OwnerName) return res.json({ msg: "We can not list a place without improper information." })
        const user = new listPlace({
            PlaceId: generateRandomId(), PlaceName, Address, OwnerName, document: filename, mimetype: mimetype
        });

        const savedUser = await user.save();
        res.status(200).json({ savedUser, msg: "Place listed successfully." })

    } catch (error) {
        res.status(500).json({ err: error })
    }
})

restaurantRouter.post("/menuItems/:id", auth, async (req, res) => {
    try {
        const { ItemName, Price, Category, Ingredients, isVeg } = req.body
        if (!ItemName, !Price, !Category, !Ingredients, !isVeg) return res.status(400).json({ msg: "Give complete details of the Menu item." })
        const menuItems = new MenuItems({
            OwnerId: req.user, ItemName, Price, Category, Ingredients, isVeg
        });
        await listPlace.findOneAndUpdate({ PlaceId: req.params.id }, { $push: { Menu: menuItems } })
        const savedUser = await menuItems.save();
        res.status(200).json(savedUser)
    } catch (error) {
        console.log("err");

    }
})

restaurantRouter.post("/edit/menuItems", auth, async (req, res) => {
    try {
        const { ItemName, Price, Category, Ingredients, isVeg } = req.body
        if (!ItemName, !Price, !Category, !Ingredients, !isVeg) return res.status(400).json({ msg: "Give complete details of the Menu item." })
        const menuItems = await MenuItemOwner.findOneAndUpdate({ _id: req.user }, {
            $set: { ItemName: ItemName, Price: Price, Category: Category, Ingredients: Ingredients, isVeg: isVeg }
        })
        if (menuItems) {
            res.status(200).send("Menu Items updated successfully.");
        } else {
            res.status(401).send("Unable to update, No data found");
        }
    } catch (error) {
        console.log("err");

    }
})

restaurantRouter.delete("/edit/menuItems", auth, async (req, res) => {
    try {
        const { ItemName, Price, Category, Ingredients, isVeg } = req.body
        if (!ItemName, !Price, !Category, !Ingredients, !isVeg) return res.status(400).json({ msg: "Give complete details of the Menu item." })
        const menuItems = await MenuItemOwner.findOneAndUpdate({ _id: req.user }, {
            $set: { ItemName: ItemName, Price: Price, Category: Category, Ingredients: Ingredients, isVeg: isVeg }
        })
        if (menuItems) {
            res.status(200).send("Menu Items updated successfully.");
        } else {
            res.status(401).send("Unable to update, No data found");
        }
    } catch (error) {
        console.log("err");

    }
})

module.exports = restaurantRouter