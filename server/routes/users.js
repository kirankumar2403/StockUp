const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Path to your User Mongoose model
const { authenticateJWT, authorizeRole } = require('../middleware/auth'); // Path to your auth middleware
const bcrypt = require('bcryptjs'); // For password hashing during manual user creation/update

// GET all users (Admin only)
router.get('/', authenticateJWT, authorizeRole('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ email: 1 }); // Fetch all users, exclude password, sort by email
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error fetching users', error: error.message });
  }
});

// GET a single user by ID (Admin only) - useful for editing form population if needed
router.get('/:id', authenticateJWT, authorizeRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching single user:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid User ID provided.', error: error.message });
    }
    res.status(500).json({ message: 'Server error fetching user', error: error.message });
  }
});


// Create a new user (Admin only)
router.post('/', authenticateJWT, authorizeRole('admin'), async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    // Check if user already exists
    let userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'User with that email or username already exists.' });
    }

    // Create new user instance. Password hashing is handled by pre-save hook in User model
    const user = new User({ username, email, password, role });
    await user.save();

    // Do not return password
    const userResponse = user.toObject();
    delete userResponse.password;

    console.log('New user created by admin:', userResponse);
    res.status(201).json({ message: 'User created successfully', user: userResponse });

  } catch (error) {
    console.error('Error creating user:', error);
    if (error.name === 'ValidationError') {
      const errors = {};
      for (let field in error.errors) {
        errors[field] = error.errors[field].message;
      }
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    res.status(500).json({ message: 'Server error creating user', error: error.message });
  }
});

// Update user (Admin only - typically for role changes, etc.)
router.put('/:id', authenticateJWT, authorizeRole('admin'), async (req, res) => {
  const userId = req.params.id;
  const { username, email, role, password } = req.body; // Can potentially update password too, but usually separate API for security

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Prevent changing role to non-admin for the only admin user (optional but good practice)
    if (user.role === 'admin' && role !== 'admin') {
        const adminCount = await User.countDocuments({ role: 'admin' });
        if (adminCount <= 1) {
            return res.status(400).json({ message: 'Cannot demote the only admin user. Create another admin first.' });
        }
    }
    // Prevent admin from demoting themselves without another admin existing (security concern)
    if (req.user._id.toString() === userId && user.role === 'admin' && role !== 'admin') {
        const adminCount = await User.countDocuments({ role: 'admin' });
        if (adminCount <= 1) {
            return res.status(400).json({ message: 'Cannot demote yourself if you are the only admin.' });
        }
    }


    // Update fields (only if provided in req.body)
    if (username !== undefined) user.username = username;
    if (email !== undefined) user.email = email;
    if (role !== undefined) user.role = role;
    if (password) { // If password is provided, re-hash it
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save(); // .save() will trigger pre-save hooks (like password hashing if modified)

    // Do not return password
    const userResponse = user.toObject();
    delete userResponse.password;

    console.log('User updated by admin:', userResponse);
    res.json({ message: 'User updated successfully', user: userResponse });

  } catch (error) {
    console.error('Error updating user:', error);
    if (error.name === 'ValidationError') {
      const errors = {};
      for (let field in error.errors) {
        errors[field] = error.errors[field].message;
      }
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid User ID provided.', error: error.message });
    }
    if (error.code === 11000) { // Duplicate key error
        return res.status(400).json({ message: 'User with this email or username already exists.', errors: { email: 'Duplicate email or username.' } });
    }
    res.status(500).json({ message: 'Server error updating user', error: error.message });
  }
});

// Delete user (Admin only)
router.delete('/:id', authenticateJWT, authorizeRole('admin'), async (req, res) => {
  const userId = req.params.id;

  try {
    // Prevent an admin from deleting themselves (for safety)
    if (req.user._id.toString() === userId) {
        return res.status(400).json({ message: 'You cannot delete your own account while logged in.' });
    }

    // Prevent deleting the only admin user
    const userToDelete = await User.findById(userId);
    if (userToDelete && userToDelete.role === 'admin') {
        const adminCount = await User.countDocuments({ role: 'admin' });
        if (adminCount <= 1) {
            return res.status(400).json({ message: 'Cannot delete the only admin user. Create another admin first.' });
        }
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    console.log('User deleted by admin:', user.email);
    res.status(204).end(); // No Content

  } catch (error) {
    console.error('Error deleting user:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid User ID provided.', error: error.message });
    }
    res.status(500).json({ message: 'Server error deleting user', error: error.message });
  }
});

module.exports = router;