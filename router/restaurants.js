const express = require("express");
require("dotenv").config();

const auth = require("../middleware/auth")
const restaurantRouter = express.Router();

const MenuCategory = require("../model/owner/menu");
const RatePlace = require("../model/user/ratePlace");
const userP = require("../model/user/userProfile");
const ownerP = require("../model/owner/ownerProfile");
const listPlace = require("../model/owner/listPlace");
const { generateRandomFoodPlaceId } = require("../utils/basicsFunctions");
const upload = require("../utils/bucket");
const foodplace = require("../model/owner/foodPlace");
const deleteFile = require("../utils/deleteFile");


// Rate Place

// restaurantRouter.get("/review/:id", async (req, res) => {
//     const place = await listPlace.find({ PlaceId: req.params.id })
// const reviews = await
// let OverallRating, Hygiene, Taste, Quality, Ambience, Comment  ;
// OverallRating = averageAll(place)
// })

restaurantRouter.get("/review", auth, async (req, res) => {
    const details = await ownerP.findById(req.user)
    const listPlaces = await listPlace.findById(details.PlaceId)
    let pageNumber = req.query.page
    let limit = req.query.limit
    const rates = await RatePlace.find({ foodPlaceId: listPlaces.foodPlace }).sort({createdAt: -1}).skip(limit * (pageNumber - 1)).limit(limit)
    if (rates.length < limit) {
        res.status(202).json({ rates, msg: "No More Ratings" })
    } else {
        res.status(200).json({ rates })
    }
})

restaurantRouter.post('/ratePlace', auth, async (req, res) => {
    const { Hygiene, Taste, Quality, Ambience, Comment } = req.body;
    try {
        if (!Hygiene, !Taste, !Quality, !Ambience, !Comment) {
            res.status(400).json({ msg: "You can not rate this place with incomplete information" })
        }
        const OverallRating = (Hygiene + Taste + Quality + Ambience) / 4
        const user = await userP.findById(req.user)
        const ratePlace = new RatePlace({
            OverallRating: OverallRating,
            Hygiene, Taste, Quality, Ambience, Comment,
            Name: user.FullName,
            userId: user,
            foodPlaceId: req.query.id
        });
        const foodPlace = await foodplace.findOne({ foodPlaceId: req.query.id })
        foodPlace.RatedBy = foodPlace.RatedBy + 1
        const Ratings = ((foodPlace.Ratings) * (foodPlace.RatedBy - 1) + OverallRating) / foodPlace.RatedBy
        await foodPlace.updateOne({ $set: { Ratings: Ratings, RatedBy: foodPlace.RatedBy } })
        await ratePlace.save();
        res.status(200).json({ msg: `${foodPlace.FoodPlaceName} rated successfully` })
    } catch (error) {
        res.status(500).json({ err: "Internal Server Error" })
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

restaurantRouter.put("/:place/setStatus", auth, async (req, res) => {
    try {
        const { status } = req.body
        const user = await ownerP.findById(req.user);
        const details = await listPlace.findById(user.PlaceId._id.toString())
        if (req.params.place == "listPlace") {
            const arr = ["verified", "unverified", "verifying"]
            if (arr.includes(status)) {
                if (details.status == status) return res.status(202).json({ msg: "Already upto date everything." })
                await details.updateOne({ $set: { status: status } })
                res.status(200).json({ status: status, msg: "Status Updated Successfully" })
            } else {
                res.status(401).json({ err: "Invalid Status Update Request" })
            }
        } else if (req.params.place == "foodPlace") {
            const foodPlaces = await foodplace.findById(details.foodPlace)
            const arr = [true, false]
            if (arr.includes(status)) {
                if (foodPlaces.status == status) return res.status(202).json({ msg: "Already upto date everything." })
                await foodPlaces.updateOne({ $set: { status: status } })
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


restaurantRouter.get("/get/status/:place", auth, async (req, res) => {
    try {
        const details = await ownerP.findById(req.user)
        if (req.params.place == "foodPlace") {
            const listPlaces = await listPlace.findById(details.PlaceId)
            const foodPlaces = await foodplace.findById(listPlaces.foodPlace)
            res.status(200).json({ status: foodPlaces.status })
        } else if (req.params.place == "listPlace") {
            const listPlaces = await listPlace.findById(details.PlaceId)
            res.status(200).json({ status: listPlaces.status })
        } else if (req.params.place == "menuItems" && req.params.menuid) {
            const listPlaces = await listPlace.findById(details.PlaceId)
            const menuitemsid = await MenuCategory.find({ foodPlace: listPlaces.foodPlace, "Category.Items": { $elemMatch: { _id: req.params.menuid } } })
            const items = menuitemsid[0].Category.find((element) => element.Name == Category).Items.find((element) => element._id == req.params.menuid)
            res.status(200).json({ status: items.isAvailable, veg: items.isVeg })
        } else {
            res.status(400).json({ err: "No Status found related to your query" })
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({ err: "Internal server err" })
    }
})

restaurantRouter.patch("/update/status/menuItems", auth, async (req, res) => {
    try {
        const details = await ownerP.findById(req.user)
        const menuid = req.query.menuid
        const { status } = req.body
        const listPlaces = await listPlace.findById(details.PlaceId)
        await MenuCategory.updateOne({ foodPlace: listPlaces.foodPlace, "Category.Items": { $elemMatch: { _id: menuid } } }, { $set: { "Category.$.Items.$[items].isAvailable": status } }, {
            arrayFilters: [
                { "items._id": menuid }
            ]
        })
        res.status(200).json({ msg: `Status changed successfully` })
    } catch (err) {
        console.log(err)
        res.status(500).json({ err: "Internal server err" })
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
        if (!response.Menu) response.Menu = []
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

restaurantRouter.post("/edit/coverPhoto", auth, upload.single("file"), async (req, res) => {
    try {
        const details = await ownerP.findById(req.user)
        const listPlaces = await listPlace.findById(details.PlaceId)
        const foodPlaces = await foodplace.findById(listPlaces.foodPlace)
        if (foodPlaces.CoverPhoto) {
            deleteFile(foodPlaces.CoverPhoto)
            await foodPlaces.updateOne({ $set: { CoverPhoto: req.file.filename, mimetype: req.file.mimetype } })
            res.status(200).json({ msg: `Cover Photo updated successfully`, imageUrl: req.file.filename })
        } else {
            await foodPlaces.updateOne({ $set: { CoverPhoto: req.file.filename, mimetype: req.file.mimetype } })
            res.status(200).json({ msg: `Cover Photo updated successfully`, imageUrl: req.file.filename })
        }
    } catch (error) {
        res.status(500).json({ err: "Internal Server Error" })
    }

})
// restaurantRouter.post("/delete/coverPhoto", auth, async (req, res) => {
//     try {
//         const details = await ownerP.findById(req.user)
//         const listPlaces = await listPlace.findById(details.PlaceId)
//         const foodPlaces = await foodplace.findById(listPlaces.foodPlace)
//         if (req.params.type == "edit") {
//             if (foodPlaces.CoverPhoto) {
//                 upload.single("file");
//                 deleteFile(foodPlaces.CoverPhoto)
//                 await foodPlaces.updateOne({ $set: { CoverPhoto: req.file.filename, mimetype: req.file.mimetype } })
//                 res.status(200).json(`Cover Photo ${req.file.filename} updated successfully`)
//             } else {
//                 upload.single('file')
//                 await foodPlaces.updateOne({ $set: { CoverPhoto: req.file.filename, mimetype: req.file.mimetype } })
//                 res.status(200).json(`Cover Photo ${req.file.filename} updated successfully`)
//             }
//         } else if (req.params.type == "delete") {
//             if (foodPlaces.CoverPhoto) {
//                 upload.single('file')
//                 deleteFile(foodPlaces.CoverPhoto)
//                 await foodPlaces.updateOne({ $set: { CoverPhoto: null, mimetype: null } })
//                 res.status(200).json(`Cover Photo ${foodPlaces.CoverPhoto} deleted successfully`)
//             } else {
//                 res.status(200).json(`Cover Photo doesn't exists to delete`)
//             }
//         }
//     } catch (error) {
//         res.status(500).json(error)
//     }

// })

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
                    res.status(200).json({ msg: `${Category} added successfully` })
                }
            } else {
                const menuItems = new MenuCategory({
                    Category: { Name: Category },
                    foodPlace: foodplaceid
                });
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
                    "Category.Name": Category,
                })
                if (det.length != 0) {
                    const menuitems = det[0].Category.find((elem) => elem.Name == Category).Items.find((elem) => elem.ItemName == ItemName)
                    if (menuitems == null) {
                        await MenuCategory.findOneAndUpdate({
                            foodPlace: placeDetail.foodPlace,
                            "Category.Name": Category
                        }, {
                            $push: {
                                "Category.$.Items": {
                                    "ItemName": ItemName,
                                    "Price": Price,
                                    "Ingredients": Ingredients,
                                    "isVeg": isVeg,
                                    "isAvailable": isAvailable,
                                }
                            }
                        })
                        const menuitemsid = await MenuCategory.find({ "Category.Items": { $elemMatch: { ItemName: ItemName } } })
                        const id = menuitemsid[0].Category.find((element) => element.Name == Category).Items.find((element) => element.ItemName == ItemName)._id
                        res.status(200).json({ msg: `${ItemName} added successfully`, id: id.toString() })
                    } else {
                        res.status(400).json({ err: `${ItemName} already exists` })
                    }
                } else {
                    await MenuCategory.updateOne({
                        foodPlace: placeDetail.foodPlace,
                    }, {
                        $push: {
                            Category: {
                                Name: Category,
                                Items: {
                                    "ItemName": ItemName,
                                    "Price": Price,
                                    "Ingredients": Ingredients,
                                    "isVeg": isVeg,
                                    "isAvailable": isAvailable,
                                    // menuId:det._id
                                }
                            }
                        },
                    });
                    const menuitemsid = await MenuCategory.find({ "Category.Items": { $elemMatch: { ItemName: ItemName } } })

                    const id = menuitemsid[0].Category.find((element) => element.Name == Category).Items.find((element) => element.ItemName == ItemName)._id
                    res.status(200).json({ msg: `${ItemName} added successfully`, id: id.toString() })
                }
            } else {
                const menuItems = new MenuCategory({
                    Category: {
                        Name: Category,
                        Items: {
                            "ItemName": ItemName,
                            "Price": Price,
                            "Ingredients": Ingredients,
                            "isVeg": isVeg,
                            "isAvailable": isAvailable,
                        }
                    },
                    foodPlace: foodplaceid
                });
                await menuItems.save();
                const menuitemsid = await MenuCategory.find({ "Category.Items": { $elemMatch: { ItemName: ItemName } } })

                const id = menuitemsid[0].Category.find((element) => element.Name == Category).Items.find((element) => element.ItemName == ItemName)._id
                res.status(200).json({ msg: `${ItemName} added successfully`, id: id.toString() })
            }
        } else {
            res.status(400).json({ err: "There is no food place here" })
        }
    } catch (error) {
        console.log(error);
    }
})

restaurantRouter.put("/edit/menuitems", auth, async (req, res) => {
    try {
        const menuid = req.query.id
        const details = await ownerP.findById(req.user)
        const placeDetail = await listPlace.findById(details.PlaceId.toString())
        const { ItemName, Price, Category, Ingredients, isVeg, isAvailable } = req.body;
        const menuCat = await MenuCategory.findOne({ foodPlace: placeDetail.foodPlace, "Category.Name": Category })
        if (menuCat) {
            const menuItemName = await MenuCategory.findOne({ foodPlace: placeDetail.foodPlace, "Category.Name": Category })
            const CatItemName = menuItemName.Category.find((element) => element.Name == Category).Items.find((elem) => elem.ItemName == ItemName)
            if (CatItemName) {
                res.status(400).json({ err: `${ItemName} already exist` })
            } else {
                const menuCatsid = await MenuCategory.findOne({ foodPlace: placeDetail.foodPlace, "Category.Items": { $elemMatch: { _id: menuid } } })
                const CatName = menuCatsid.Category.find((element) => element.Name == Category).Items.find((elem) => elem._id == menuid)
                if (CatName) {
                    await MenuCategory.findOneAndUpdate({ foodPlace: placeDetail.foodPlace, "Category.Items": { $elemMatch: { _id: menuid } } },
                        {
                            $set: {
                                "Category.$.Items.$[items]": {
                                    ItemName: ItemName,
                                    Price: Price,
                                    Ingredients: Ingredients,
                                    isVeg: isVeg,
                                    isAvailable: isAvailable
                                }
                            }
                        }, {
                        arrayFilters: [
                            { "items._id": menuid }
                        ]
                    })
                    const menuitemsid = await MenuCategory.find({ "Category.Items": { $elemMatch: { ItemName: ItemName } } })

                    const id = menuitemsid[0].Category.find((element) => element.Name == Category).Items.find((element) => element.ItemName == ItemName)._id
                    res.status(200).json({ msg: `${ItemName} modified successfully`, id: id.toString() })
                } else {
                    await MenuCategory.findOneAndUpdate({ foodPlace: placeDetail.foodPlace, "Category.Items": { $elemMatch: { _id: menuid } } },
                        {
                            $pull: { "Category.$.Items": { "_id": menuid } }
                        })
                    await MenuCategory.findOneAndUpdate({
                        foodPlace: placeDetail.foodPlace,
                        "Category.Name": Category
                    }, {
                        $push: {
                            "Category.$.Items": {
                                "ItemName": ItemName,
                                "Price": Price,
                                "Ingredients": Ingredients,
                                "isVeg": isVeg,
                                "isAvailable": isAvailable,
                            }
                        }
                    })
                    const menuitemsid = await MenuCategory.find({ "Category.Items": { $elemMatch: { ItemName: ItemName } } })

                    const id = menuitemsid[0].Category.find((element) => element.Name == Category).Items.find((element) => element.ItemName == ItemName)._id
                    res.status(200).json({ msg: `${ItemName} modified successfully`, id: id.toString() })
                }
            }
        }
        else {
            res.status(400).json({ err: "Category doesn't exist" })
        }
    } catch (err) {
        res.status(500).json({ err: "Internal server err" })
    }
})


restaurantRouter.delete("/delete/menuItems", auth, async (req, res) => {
    try {
        const menuid = req.query.id
        const details = await ownerP.findById(req.user)
        const placeDetail = await listPlace.findById(details.PlaceId.toString())
        await MenuCategory.findOneAndUpdate({ foodPlace: placeDetail.foodPlace, "Category.Items": { $elemMatch: { _id: menuid } } },
            {
                $pull: { "Category.$.Items": { "_id": menuid } }
            })
        res.status(200).json({ msg: `Item deleted successfully` })

    } catch (error) {
        res.status(500).json({ err: "Internal server err" })
    }
})


module.exports = restaurantRouter
