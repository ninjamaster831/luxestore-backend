const jwt = require("jsonwebtoken");
require("dotenv").config();

const authmiddleware = (req, res, next) => {
    const authheader = req.headers["authorization"];

    const token = authheader && authheader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;

        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid or Expired token" });
    }
};

module.exports = authmiddleware;