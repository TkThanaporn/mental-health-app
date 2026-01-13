// middleware/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../.env' }); 

const authMiddleware = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'Access denied. No token provided.' });
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (e) {
        res.status(401).json({ msg: 'Token is invalid or expired.' });
    }
};

const authorizeRole = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ msg: 'Access denied. You do not have permission.' });
    }
    next();
};

module.exports = { authMiddleware, authorizeRole };