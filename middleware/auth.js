const jwt = require('jsonwebtoken');

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
