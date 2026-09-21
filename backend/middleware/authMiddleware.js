const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const JWT_SECRET = process.env.JWT_SECRET || "student_course_mgmt_secret_key_2026";

// Protect routes: verify JWT Bearer token
const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer ")
    ) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Not authorized. No authentication token provided."
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User belonging to this token no longer exists."
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Token verification failed:", error.message);
        return res.status(401).json({
            success: false,
            message: "Not authorized. Token is invalid or has expired."
        });
    }
};

// Authorize specific roles (e.g. 'admin')
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Forbidden. Role '${req.user ? req.user.role : "none"}' does not have permission to perform this action.`
            });
        }
        next();
    };
};

module.exports = {
    protect,
    authorize,
    JWT_SECRET
};
