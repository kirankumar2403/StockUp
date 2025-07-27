const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Ensure this path is correct to your User model
const router = express.Router();

// Helper: generate JWT
function generateToken(user) {
    // Include username in the token payload for easier access on frontend
    return jwt.sign(
        { id: user._id, email: user.email, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

// @route   POST /api/auth/signup
// @desc    Register user
// @access  Public
router.post('/signup', async (req, res) => {
    // Destructure username along with other fields
    const { username, email, password, role } = req.body;

    try {
        // --- Server-side Validation ---
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Please enter all required fields.' });
        }
        if (username.length < 3) {
            return res.status(400).json({ error: 'Username must be at least 3 characters.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }
        if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
            return res.status(400).json({ error: 'Please enter a valid email address.' });
        }

        // Check if email already exists
        let existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: 'User with this email already exists.' });
        }

        // Check if username already exists (assuming username is unique)
        existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ error: 'User with this username already exists.' });
        }

        // --- REMOVED: const hash = await bcrypt.hash(password, 10); ---
        // The password will now be hashed by the pre('save') hook in the User model

        const allowedRoles = ['admin', 'staff'];
        const userRole = allowedRoles.includes(role) ? role : 'staff';

        // Create the user, passing the PLAIN password. The pre('save') hook will hash it.
        const user = await User.create({ username, email, password, role: userRole }); // <--- Pass plain password here

        const token = generateToken(user);

        // Return username in the response
        res.status(201).json({ user: { id: user._id, username: user.username, email: user.email, role: user.role }, token });

    } catch (err) {
        // --- IMPORTANT: Log the actual error for debugging ---
        console.error("Backend Error in /api/auth/signup:", err);
        // Handle specific Mongoose validation errors if needed
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ error: messages.join(', ') });
        }
        // Handle duplicate key errors (e.g., if unique index fails for username/email)
        if (err.code === 11000) {
            return res.status(409).json({ error: 'An account with this email or username already exists.' });
        }
        res.status(500).json({ error: 'Signup failed due to server error.' });
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        // Use the matchPassword method from the User model to compare
        const match = await user.matchPassword(password); // <--- Using matchPassword method
        if (!match) return res.status(400).json({ error: 'Invalid credentials' });

        const token = generateToken(user);
        // Return username in the response
        res.json({ user: { id: user._id, username: user.username, email: user.email, role: user.role }, token });
    } catch (err) {
        // --- IMPORTANT: Log the actual error for debugging ---
        console.error("Backend Error in /api/auth/login:", err);
        res.status(500).json({ error: 'Login failed due to server error.' });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private (requires token)
router.get('/me', async (req, res) => {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'No token' });
    try {
        const token = auth.split(' ')[1]; // Extract token from "Bearer <token>"
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Find user by ID, exclude password, and include username
        const user = await User.findById(decoded.id).select('-password');
        if (!user) return res.status(401).json({ error: 'User not found' });
        // Return username in the response
        res.json({ user: { id: user._id, username: user.username, email: user.email, role: user.role } });
    } catch (err) { // Catch specific JWT errors
        // --- IMPORTANT: Log the actual error for debugging ---
        console.error("Backend Error in /api/auth/me:", err);
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        res.status(500).json({ error: 'Failed to authenticate token.' });
    }
});

// @route   POST /api/auth/logout
// @desc    Logout (client just deletes token)
// @access  Public (or private if you want to enforce token presence)
router.post('/logout', (req, res) => {
    // For JWT, logout is primarily a client-side action (deleting the token).
    // The server just acknowledges the request.
    console.log("Backend: Logout request received (client-side token removal assumed).");
    res.json({ message: 'Logged out' });
});

// @route   GET /api/auth/google
// @desc    Google login (placeholder)
// @access  Public
router.get('/google', (req, res) => {
    console.warn("Backend: Google login endpoint hit. Not fully implemented.");
    res.status(501).json({ error: 'Google login not implemented' });
});

// @route   POST /api/auth/reset-password
// @desc    Reset password (placeholder)
// @access  Public
router.post('/reset-password', (req, res) => {
    console.warn("Backend: Reset password endpoint hit. Not fully implemented.");
    res.status(501).json({ error: 'Reset password not implemented' });
});

module.exports = router;