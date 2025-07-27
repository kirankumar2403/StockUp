// C:\banner-generator\server\models\Product.js (or wherever your Product schema is defined)

const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  barcode: { type: String, trim: true },
  stock: { type: Number, required: true, min: 0 },
  threshold: { type: Number, required: true, min: 0 },
  price: { type: Number, required: true, min: 0 }, // Ensure price is required if your schema still has it
  expiryDate: { type: Date },

  // >>> IMPORTANT: Change 'required: true' to 'required: false' or remove it for brand <<<
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: false // <--- THIS IS THE KEY CHANGE
  },
  // >>> Consider this for category too, if it's optional <<<
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true // Keep true if category is always mandatory
  },
  // ... other fields
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);