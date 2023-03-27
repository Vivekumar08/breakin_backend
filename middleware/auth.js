const jwt = require('jsonwebtoken');
const foodplace = require('../model/owner/foodPlace');
const listPlace = require('../model/owner/listPlace');
const ownerP = require('../model/owner/ownerProfile');

module.exports = function auth(req, res, next) {
    try {
        // const token = req.headers.authorization.split(" ")[1];
        const token = req.headers.authorization;
        // const token = req.header('x-auth-token');
        // const {token} = req.cookies;
        if (!token) {
            return res.status(401).json({ msg: 'Token not found' });
        }
        jwt.verify(token, process.env.SECRET, (err, user) => {
            if (err) return res.status(401).json({ msg: "Token unverified, authorization denied" })
            console.log(user)
            req.user = user.id;
            next();
        });

    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).send({ msg: 'token expired' });
        }
        res.status(402).json({ msg: err });
    }
};

exports.foodplaceVerified = (res, req, next) => {
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
        }
        res.status(402).json({ msg: err });
    }
}
