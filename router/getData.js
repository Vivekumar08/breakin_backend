const express = require("express");
require("dotenv").config();

const auth = require("../middleware/auth")
const getDataRouter = express.Router();

const MenuCategory = require("../model/owner/menu");
const RatePlace = require("../model/user/ratePlace");
const userP = require("../model/user/userProfile");
const ownerP = require("../model/owner/ownerProfile");
const listPlace = require("../model/owner/listPlace");
const { generateRandomFoodPlaceId, isWithinBoundary } = require("../utils/basicsFunctions");
const upload = require("../utils/bucket");
const foodplace = require("../model/owner/foodPlace");
const deleteFile = require("../utils/deleteFile");


getDataRouter.get("/NearestHotspot", auth, async (req, res) => {
    try {
        const det = await userP.findById(req.user)
        if (det) {
            const lat = req.query.lat
            const lng = req.query.lng
            const food = await foodplace.find()
            console.log(food)
            const arr = []
            const distArr = []
            const sortArr = [];
            for (var key of food) {
                const dist = isWithinBoundary(lat, lng, key.Locations.lat, key.Locations.lng)
                if (dist) {
                    distArr.push(dist)
                    arr.push(key)
                }
            }
            for (let i = 0; i < distArr.length; i++) {
                sortArr.push({ food: arr[i], dist: distArr[i] });
            }
            sortArr.sort((a, b) => a.dist - b.dist);
            const sortedName = sortArr.map((obj) => obj.food);
            res.status(200).json(sortedName)
        }
    } catch (err) {
        console.log(err)
        res.status(500).json(err)
    }
})
getDataRouter.get("/filterSearch", auth, async (req, res) => {
    try {
        const det = await userP.findById(req.user)
        if (det) {
            const lat = req.query.lat
            const lng = req.query.lng
            const cat = req.query.cat
            const food = await foodplace.find({ category: cat })
            console.log(food)
            const arr = []
            const distArr = []
            const sortArr = [];
            for (var key of food) {
                const dist = isWithinBoundary(lat, lng, key.Locations.lat, key.Locations.lng, 5)
                if (dist) {
                    distArr.push(dist)
                    arr.push(key)
                }
            }
            for (let i = 0; i < distArr.length; i++) {
                sortArr.push({ food: arr[i], dist: distArr[i] });
            }
            sortArr.sort((a, b) => a.dist - b.dist);
            const sortedName = sortArr.map((obj) => obj.food);
            res.status(200).json(sortedName)
        }
    } catch (err) {
        console.log(err)
        res.status(500).json(err)
    }
})
getDataRouter.get("/foodPlace", auth, async (req, res) => {
    try {
        const det = await userP.findById(req.user)
        if (det) {
            const foodPlaceId = req.query.foodPlaceId
            const foodPlace = await foodplace.findOne({ foodPlaceId: foodPlaceId })
            const menuitems = await MenuCategory.find({ foodPlace: placeDetail.foodPlace.toString() })
            const response = foodPlace.toJSON()
            response.Menu = menuitems[0]["Category"]
            if (!response.Menu) response.Menu = []
            res.status(200).json(response)
        } else {
            res.status(400).json({ err: "There is no food place here" })
        }
    } catch (err) {
        console.log(err)
        res.status(500).json(err)
    }
})
getDataRouter.get("/Search", auth, async (req, res) => {
    try {
        const det = await userP.findById(req.user)
        if (det) {
            const word = req.query.word
            const regex = new RegExp(word, "i");
            const food = await foodplace.find({ FoodPlaceName: { $regex: regex } })
            const item = await MenuCategory.find({ "Category.Items.ItemName": { $regex: regex } }, { "Category.Items.ItemName": 1, "_id": 0 })
            const arrFoodPlace = []
            const arrItemName = []
            for (var key of food) {
                arrFoodPlace.push({ FoodPlaceName: key.FoodPlaceName, foodPlaceId: key.foodPlaceId })
            }
            for (var name of item) {
                for (var itm of name.Category) {
                    for (var tems of itm.Items) {
                        if (regex.exec(tems.ItemName)) {
                            arrItemName.push(tems.ItemName)
                        }
                    }
                }
                break
            }
            if (arrFoodPlace.length > 0 && arrItemName.length > 0) {
                res.status(200).json({
                    foodplaces: [...new Set(arrFoodPlace)],
                    ItemNames: [...new Set(arrItemName)]
                })
            } else if (arrFoodPlace.length > 0) {
                res.status(200).json({
                    foodplaces: [...new Set(arrFoodPlace)],
                })
            } else if (arrItemName.length > 0) {
                res.status(200).json({
                    foodplaces: [...new Set(arrItemName)],
                })
            } else {
                res.status(400).json({ err: "Nothing is found" })
            }
        }
    } catch (err) {
        console.log(err)
        res.status(500).json(err)
    }
})

module.exports = getDataRouter
