const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ msg: 'Authorization denied' });
    }
    try {
        const decoded = jwt.verify(token, process.env.SECRET);
        if (!decoded) return res.status(401).json({ msg: "Token unverified, authorization denied" })
        req.user = decoded.tokenUser;
        console.log(req.user)
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).send({ msg: 'token expired' });
        }
        res.status(401).json({ msg: 'Authorizaton denied' });
    }
};
module.exports = auth;