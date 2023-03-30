const express = require("express");
require("dotenv").config();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth")
const foodplaceVerified = require("../middleware/foodplace")
const restaurantRouter = express.Router();

const MenuCategory = require("../model/owner/menu");
const RatePlace = require("../model/user/ratePlace");
const userP = require("../model/user/userProfile");
const ownerP = require("../model/owner/ownerProfile");
const listPlace = require("../model/owner/listPlace");
const { generateRandomFoodPlaceId } = require("../utils/basicsFunctions");
const upload = require("../utils/bucket");
const foodplace = require("../model/owner/foodPlace");
const MenuItems = require("../model/owner/ItemSchema");
const deleteFile = require("../utils/deleteFile");


// Rate Place

restaurantRouter.get("/review/:id", async (req, res) => {
    const place = await listPlace.find({ PlaceId: req.params.id })
    // const reviews = await
    // let OverallRating, Hygiene, Taste, Quality, Ambience, Comment  ;
    // OverallRating = averageAll(place)
})

restaurantRouter.get("/review/page?", foodplaceVerified, async (req, res) => {
    let pageNumber = req.params.page
    const rates = await RatePlace.find({ foodPlaceId: req.place.foodplace }).limit(4).skip(4 * (pageNumber - 1))
    res.status(200).json(rates)
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
        const foodPlace = await foodplace.findById(req.params.id)
        foodPlace.RatedBy = foodPlace.RatedBy + 1
        const Ratings = (foodPlace.Ratings + (Hygiene + Taste + Quality + Ambience) / 4) / 2
        await foodPlace.update({ $set: { Ratings: Ratings, RatedBy: foodPlace.RatedBy } })
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
        const owner = await ownerP.findById(req.user)
        if (owner.PlaceId) {
            res.status(400).json({ err: "Place already listed" })
        } else {
            const user = new listPlace({
                PlaceName, Address, OwnerName, document: filename, mimetype: mimetype, status: "verifying"
            });
            await owner.updateOne({ $set: { PlaceId: user } })
            await user.save();
            res.status(200).json({ msg: "Place listed successfully." })
        }
    } catch (error) {
        res.status(500).json({ err: error })
    }
})

restaurantRouter.get("/listPlace/get", auth, async (req, res) => {
    try {
        const user = await ownerP.findById(req.user);
        if (user.PlaceId) {
            const details = await listPlace.findById(user.PlaceId.toString());
            res.status(200).json(details)
        } else {
            res.status(401).json({ err: "Place not listed" })
        }
    } catch (error) {
        res.status(500).json({ err: error })
    }
})

restaurantRouter.put("/listPlace/:id", auth, async (req, res) => {
    try {
        const { status } = req.body
        const user = await ownerP.findById(req.user);
        const details = await listPlace.findById(user.PlaceId._id.toString())
        if (req.params.id == "setStatus") {
            const arr = ["verified", "unverified", "verifying"]
            if (arr.includes(status)) {
                if (details.status == status) return res.status(202).json({ msg: "Already upto date everything." })
                await details.updateOne({ $set: { status: status } })
                res.status(200).json({ status: status, msg: "Status Updated Successfully" })
            } else {
                res.status(401).json({ err: "Invalid Status Update Request" })
            }
        } else {
            res.status(400).json({ err: "invalid api configuration" })
        }
    } catch (error) {
        res.status(500).json({ err: error })
    }
})


restaurantRouter.get("/get/status/:place/:menuid", foodplaceVerified, async (req, res) => {
    if (req.params.place == "foodplace") {
        res.status(200).json(req.foodplace.status)
    } else if (req.params.place == "listplace") {
        res.status(200).json(req.place.status)
    } else if (req.params.place == "menuItems") {
        const menu = await MenuItems.findById(req.params.menuid)
        res.status(200).json({ available: menu.isAvailable, veg: menu.isVeg })
    } else {
        res.status(400).json("No Status found related to your query")
    }
})

restaurantRouter.get("/owner/foodPlace", auth, async (req, res) => {
    const details = await ownerP.findById(req.user)
    if (details.PlaceId) {
        const placeDetail = await listPlace.findById(details.PlaceId.toString())
        res.status(200).json(placeDetail.foodPlace)
    } else {
        res.status(400).json({ err: "There is no food place here" })
    }
})
restaurantRouter.get("/get/foodPlace", auth, async (req, res) => {
    const details = await ownerP.findById(req.user)
    if (details.PlaceId) {
        const placeDetail = await listPlace.findById(details.PlaceId.toString())
        const foodPlace = await foodplace.findById(placeDetail.foodPlace)
        const menuitems = await MenuCategory.find({ foodPlace: placeDetail.foodPlace.toString() })
        const response = foodPlace.toJSON()
        response.Menu = menuitems[0]["Category"]
        res.status(200).json(response)
    } else {
        res.status(400).json({ err: "There is no food place here" })
    }
})

restaurantRouter.post("/add/foodPlace", auth, upload.single("file"), async (req, res) => {
    try {
        const { FoodPlaceName, type, category, lat, lng, address, landmark } = req.body;
        const { filename, mimetype } = req.file;
        const details = await ownerP.findById(req.user)
        const placeDetail = await listPlace.findById(details.PlaceId._id.toString())
        if (placeDetail.status == "verified") {
            if (!FoodPlaceName, !type, !category, !lat, !lng, !address) return res.json({ msg: "We can not list a food place without improper information." })
            if (landmark) {
                const user = new foodplace({
                    foodPlaceId: generateRandomFoodPlaceId(), FoodPlaceName: FoodPlaceName, type: type, category: category,
                    Locations: { lat, lng, address, landmark },
                    CoverPhoto: filename, mimetype: mimetype
                });
                await placeDetail.updateOne({ $push: { foodPlace: user } })
                const foodPlace = await user.save();
                res.status(200).json({ foodPlace, msg: "Place listed successfully." })
            } else {
                const user = new foodplace({
                    foodPlaceId: generateRandomFoodPlaceId(), FoodPlaceName: FoodPlaceName, type: type, category: category,
                    Locations: { lat, lng, address },
                    CoverPhoto: filename, mimetype: mimetype
                });
                await placeDetail.updateOne({ $push: { foodPlace: user } })
                const foodPlace = await user.save();
                res.status(200).json({ foodPlace, msg: "Place listed successfully." })
            }
        } else {
            res.status(400).json({ err: "List Place not found." })
        }

    } catch (error) {
        res.status(500).json({ err: error })
    }
})

restaurantRouter.post("/:type/coverPhoto", foodplaceVerified, async (req, res) => {
    try {
        if (req.params.type == "edit") {
            if (req.foodplace.CoverPhoto) {
                upload.single('file')
                deleteFile(req.foodplace.CoverPhoto)
                await req.foodplace.updateOne({ $set: { CoverPhoto: req.file.filename, mimetype: req.file.mimetype } })
                res.status(200).json(`Cover Photo ${req.file.filename} updated successfully`)
            } else {
                upload.single('file')
                await req.foodplace.updateOne({ $set: { CoverPhoto: req.file.filename, mimetype: req.file.mimetype } })
                res.status(200).json(`Cover Photo ${req.file.filename} updated successfully`)
            }
        } else if (req.params.type == "delete") {
            if (req.foodplace.CoverPhoto) {
                upload.single('file')
                deleteFile(req.foodplace.CoverPhoto)
                await req.foodplace.updateOne({ $set: { CoverPhoto: null, mimetype: null } })
                res.status(200).json(`Cover Photo ${req.foodplace.CoverPhoto} deleted successfully`)
            } else {
                res.status(200).json(`Cover Photo doesn't exists to delete`)
            }
        }
    } catch (error) {
        res.status(500).json("Internal server error")
    }

})

restaurantRouter.post("/add/MenuItems/Category", auth, async (req, res) => {
    try {
        const details = await ownerP.findById(req.user)
        if (details.PlaceId) {
            const placeDetail = await listPlace.findById(details.PlaceId.toString())
            const foodplaceid = await foodplace.findById(placeDetail.foodPlace)
            const { Category } = req.body
            if (!Category) return res.status(400).json({ err: "Give complete details of the Menu item." })
            const menuitemDetail = await MenuCategory.find({
                foodPlace: placeDetail.foodPlace
            })
            if (menuitemDetail.length != 0) {
                const det = await MenuCategory.find({
                    foodPlace: placeDetail.foodPlace,
                    "Category.Name": Category
                })
                if (det.length != 0) {
                    res.status(400).json({ err: `${Category} already exists` })
                } else {
                    await MenuCategory.updateOne({ foodPlace: placeDetail.foodPlace }, {
                        $push: { Category: { Name: Category } }
                    })
                    // await foodplaceid.updateOne({ $set: { Menu: menuItems } })
                    res.status(200).json({ msg: `${Category} added successfully` })
                }
            } else {
                const menuItems = new MenuCategory({
                    Category: { Name: Category },
                    foodPlace: foodplaceid
                });
                console.log(menuItems)
                // await foodplaceid.updateOne({ $push: { Menu: menuItems } })
                await menuItems.save();
                res.status(200).json({ msg: `${Category} added successfully` })
            }
        } else {
            res.status(400).json({ err: "There is no food place here" })
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ err: "There is some server error here" })
    }
})

restaurantRouter.post("/add/MenuItems", auth, async (req, res) => {
    try {
        const details = await ownerP.findById(req.user)
        if (details.PlaceId) {
            const placeDetail = await listPlace.findById(details.PlaceId.toString())
            const foodplaceid = await foodplace.findById(placeDetail.foodPlace)
            const { ItemName, Price, Category, Ingredients, isVeg, isAvailable } = req.body
            if (!ItemName, !Price, !Ingredients, !isVeg) return res.status(400).json({ err: "Give complete details of the Menu item." })
            const menuCategory = await MenuCategory.find({
                foodPlace: placeDetail.foodPlace
            })
            if (menuCategory.length != 0) {
                const det = await MenuCategory.find({
                    foodPlace: placeDetail.foodPlace,
                    "Category.Name": Category
                })
                if (det.length != 0) {
                    const name = await MenuCategory.find({
                        foodPlace: placeDetail.foodPlace,
                        "Category.Name": Category,
                        "Category.$.ItemName": ItemName,
                    })
                    if (name.length == 0) {

                        const menuitems = new MenuItems({
                            "ItemName": ItemName,
                            "Price": Price,
                            "Ingredients": Ingredients,
                            "isVeg": isVeg,
                            "isAvailable": isAvailable,
                            // menuId:det._id
                        })
                        await MenuCategory.updateOne({
                            foodPlace: placeDetail.foodPlace,
                            "Category.Name": Category
                        }, { $push: { "Category.$.Items": menuitems } })
                        await menuitems.save();
                        res.status(200).json({ msg: `${ItemName} added successfully`, id: menuitems._id })
                    } else {
                        res.status(400).json({ err: `${ItemName} already exits` })
                    }

                } else {
                    const menuitems = new MenuItems({
                        "ItemName": ItemName,
                        "Price": Price,
                        "Ingredients": Ingredients,
                        "isVeg": isVeg,
                        "isAvailable": isAvailable,
                        // menuId:det._id
                    })
                    await MenuCategory.updateOne({
                        foodPlace: placeDetail.foodPlace,
                        "Category.Name": Category
                    }, { $push: { "Category.$.Items": menuitems } })
                    // await foodplaceid.updateOne({ $set: { Menu: menuItems } })
                    res.status(200).json({ msg: `${ItemName} added successfully`, id: menuitems._id })
                }
            } else {
                const menu = new MenuItems({
                    "ItemName": ItemName,
                    "Price": Price,
                    "Ingredients": Ingredients,
                    "isVeg": isVeg,
                    "isAvailable": isAvailable
                })
                const menuItems = new MenuCategory({
                    Category: {
                        Name: Category,
                        Items: menu.toJSON()
                    },
                    foodPlace: foodplaceid
                });
                await menu.save();
                // await foodplaceid.updateOne({ $push: { Menu: menuItems } })
                const savedUser = await menuItems.save();
                res.status(200).json({ msg: `${ItemName} added successfully`, id: menu._id })
            }
        } else {
            res.status(400).json({ err: "There is no food place here" })
        }
    } catch (error) {
        console.log(error);
    }
})

restaurantRouter.put("/edit/menuitems/:id", foodplaceVerified, async (req, res) => {
    try {
        const { ItemName, Price, Category, Ingredients, isVeg, isAvailable } = req.body;
        const menuItems = await MenuCategory.findOne({ foodPlace: req.foodPlace })
        await menuItems.updateOne({
            Category: {
                Name: Category,
                Items: { _id: req.params.id }
            }
        },
            {
                $set: {
                    "Category.$.Items": {
                        "ItemName": ItemName,
                        "Price": Price,
                        "Ingredients": Ingredients,
                        "isVeg": isVeg,
                        "isAvailable": isAvailable
                    }
                }
            })
        res.status(200).json({ msg: `${ItemName} modified successfully` })
    } catch (err) {
        res.status(500).json({ err: "Internal server err" })
    }
})

// restaurantRouter.post("/edit/menuItems", auth, async (req, res) => {
//     try {
//         const { ItemName, Price, Category, Ingredients, isVeg } = req.body
//         if (!ItemName, !Price, !Category, !Ingredients, !isVeg) return res.status(400).json({ msg: "Give complete details of the Menu item." })
//         const menuItems = await MenuItemOwner.findOneAndUpdate({ _id: req.user }, {
//             $set: { ItemName: ItemName, Price: Price, Category: Category, Ingredients: Ingredients, isVeg: isVeg }
//         })
//         if (menuItems) {
//             res.status(200).send("Menu Items updated successfully.");
//         } else {
//             res.status(401).send("Unable to update, No data found");
//         }
//     } catch (error) {
//         res.status(500).json("Internal server err")
//     }
// })

restaurantRouter.delete("/delete/menuItems/:id", foodplaceVerified, async (req, res) => {
    try {
        const menuItems = await MenuCategory.findOne({ foodPlace: req.foodPlace })
        await menuItems.updateOne({
            Category: {
                Name: Category,
                Items: { _id: req.params.id }
            }
        },
            {
                $pull: { "Category.$.Items": { _id: req.params.id } }
            })
        res.status(200).json({ msg: `Item Delete successfully` })

    } catch (error) {
        res.status(500).json({ err: "Internal server err" })
    }
})


module.exports = restaurantRouter
