const mongoose = require('mongoose');

const movementLogSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product', // Ensure 'Product' matches the name of your Product model
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Ensure 'User' matches the name of your User model
    required: true
  },
  action: {
    type: String,
    required: true,
    // CRITICAL: Ensure these enum values match ALL action types you use in products.js
    enum: ['Create', 'Update Stock', 'Restock', 'Sale', 'Delete', 'Adjustment', 'Transfer']
  },
  quantity: { // Quantity moved (+ for restock, - for sale/delete)
    type: Number,
    required: true
  },
  oldStock: { // CRITICAL: Added missing field
    type: Number,
    required: true
  },
  newStock: { // CRITICAL: Added missing field
    type: Number,
    required: true
  },
  // Removed redundant 'timestamp' field. 'createdAt' will be provided by timestamps: true
}, { timestamps: true }); // This adds 'createdAt' and 'updatedAt' fields automatically

module.exports = mongoose.model('MovementLog', movementLogSchema);