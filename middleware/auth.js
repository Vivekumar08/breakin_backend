const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    try {
        const token = req.headers.authorization.split(" ")[1];
        // const token = req.headers.authorization;
        // const token = req.header('x-auth-token');
        // const {token} = req.cookies;

        if (!token) {
            return res.status(401).json({ msg: 'Token not found' });
        }
        const decoded = jwt.verify(token, process.env.SECRET, (err) => {
            if (err) return res.status(401).json({ msg: "Token unverified, authorization denied" })
            console.log(decoded)
            // req.user = decoded.id;
        });
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).send({ msg: 'token expired' });
        }
        res.status(402).json({ msg: 'Authorizaton denied' });
    }
};
;