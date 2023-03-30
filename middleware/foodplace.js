const jwt = require('jsonwebtoken');
const foodplace = require('../model/owner/foodPlace');
const listPlace = require('../model/owner/listPlace');
const ownerP = require('../model/owner/ownerProfile');

module.exports = function foodplaceVerified(res, req, next) {
    try {
        // const token = req.headers.authorization.split(" ")[1];
        const token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({ msg: 'Token not found' });
        }
        jwt.verify(token, process.env.SECRET, async (err, user) => {
            if (err) return res.status(401).json({ msg: "Token unverified, authorization denied" })
            req.user = user.id;
            req.owner = await ownerP.findById(req.user)
            req.place = await listPlace.findById(req.owner.PlaceId)
            req.foodplace = await foodplace.findById(req.place.foodplace)
            next();
        });

    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).send({ msg: 'token expired' });
        } else {
            console.log(err)
        }
    }
}
