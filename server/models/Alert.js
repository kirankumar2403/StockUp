const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  type: { type: String, enum: ['low_stock', 'reorder', 'other'], required: true },
  message: { type: String, required: true },
  resolved: { type: Boolean, default: false },
  poGenerated: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema); 