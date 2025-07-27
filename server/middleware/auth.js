const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateJWT = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Ensure that decoded.id, decoded.email, decoded.username, decoded.role are correctly populated by your JWT
        // The generateToken function in auth.js should include these fields in the payload.
        req.user = await User.findById(decoded.id);

        if (!req.user) {
            return res.status(401).json({ message: 'User not found' });
        }
        // Attach the role from the database to req.user for consistency,
        // although decoded.role is also available from the token.
        // The line `req.user.role = req.user.role;` is redundant. It should be `req.user.role = req.user.role;`
        // or ensure `req.user` object from DB already has `role`.
        // If your User model `findById` returns the role, this is fine.
        next();
    } catch (err) {
        // Log the actual error for debugging
        console.error("JWT Authentication Error:", err.message);
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Invalid token: Token expired' });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token: Malformed or invalid signature' });
        }
        res.status(401).json({ message: 'Invalid token' });
    }
};

// MODIFIED: authorizeRole now robustly handles single role string or array of roles
const authorizeRole = (allowedRoles) => (req, res, next) => {
    // Ensure allowedRoles is always an array for consistent handling
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    // Check if req.user exists and has a role
    if (!req.user || !req.user.role) {
        return res.status(403).json({ message: 'Forbidden: User role not found' });
    }

    // Check if the user's role is included in the allowedRoles array
    if (!rolesArray.includes(req.user.role)) {
        console.warn(`Access denied for user ${req.user.email} (Role: ${req.user.role}). Required roles: ${rolesArray.join(', ')}`);
        return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }
    next();
};

module.exports = { authenticateJWT, authorizeRole };
