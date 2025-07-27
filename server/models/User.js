// C:\banner-generator\server\models\User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // <--- IMPORTANT: Import bcryptjs here

const userSchema = new mongoose.Schema({
  username: { // <--- CRITICAL: Added missing username field
    type: String,
    required: true,
    unique: true, // Username should also be unique
    trim: true,
    minlength: 3 // Example minimum length
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true, // Store emails in lowercase for consistency
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  password: {
    type: String,
    required: true,
    minlength: 6 // Example minimum length for password
  },
  role: {
    type: String,
    enum: ['admin', 'staff'], // Only allow 'admin' or 'staff'
    default: 'staff' // Default role for new users
  }
}, { timestamps: true }); // Adds createdAt and updatedAt fields automatically

// --- IMPORTANT: Password Hashing Pre-save Hook ---
userSchema.pre('save', async function(next) {
  // Only run this function if password was actually modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }
  // Hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// --- IMPORTANT: Method to compare passwords for login ---
userSchema.methods.matchPassword = async function(enteredPassword) {
  // 'this.password' refers to the hashed password in the database
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);