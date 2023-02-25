const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    try {
        const token = req.header('x-auth-token');
        // const token = req.cookie;
        console.log(token);

        if (!token) {
            return res.status(401).json({ msg: 'Authorization denied' });
        }
        const decoded = jwt.verify(token, process.env.SECRET);
        if (!decoded) return res.status(401).json({ msg: "Token unverified, authorization denied" })
        req.user = decoded.id;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).send({ msg: 'token expired' });
        }
        res.status(402).json({ msg: 'Authorizaton denied' });
    }
};
;