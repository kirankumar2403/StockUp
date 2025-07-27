const express = require('express');
const router = express.Router();
const MovementLog = require('../models/MovementLog'); // Path to your MovementLog Mongoose model
const Product = require('../models/Product'); // Needed for product name search
const User = require('../models/User');     // Needed for user email/username search
const { authenticateJWT } = require('../middleware/auth'); // Path to your auth middleware

// Get all movement logs with filtering options
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const { productName, userId, action, startDate, endDate } = req.query;
    const query = {};

    // --- Filter by Product Name (requires finding product IDs first) ---
    // If productName is provided, first find the IDs of products that match the name
    if (productName) {
      // Find products matching the search name (case-insensitive)
      const matchingProducts = await Product.find({ name: { $regex: productName, $options: 'i' } }).select('_id');
      const productIds = matchingProducts.map(p => p._id);
      if (productIds.length > 0) {
        query.product = { $in: productIds }; // Filter logs whose 'product' field is one of these IDs
      } else {
        // If no products match the name, return an empty array of logs immediately
        // as no logs could possibly match
        return res.json([]);
      }
    }

    // --- Filter by User (requires finding user IDs first) ---
    // If userId is provided (which can be an email or username string from frontend)
    if (userId) {
      // Find users matching the search email/username (case-insensitive)
      const matchingUsers = await User.find({
          $or: [
              { email: { $regex: userId, $options: 'i' } },
              { username: { $regex: userId, $options: 'i' } } // Assuming your User model has a username field
          ]
      }).select('_id'); // Select only the _id of matching users
      const userIds = matchingUsers.map(u => u._id);
      if (userIds.length > 0) {
        query.user = { $in: userIds }; // Filter logs whose 'user' field is one of these IDs
      } else {
        // If no users match the search, return an empty array of logs immediately
        return res.json([]);
      }
    }

    // Filter by action type (e.g., 'Restock', 'Sale', 'Create')
    if (action) {
      query.action = action; // Direct match for the action string
    }

    // Filter by date range (using 'createdAt' field, which Mongoose adds with timestamps: true)
    if (startDate || endDate) {
      query.createdAt = {}; // Initialize createdAt query object
      if (startDate) {
        query.createdAt.$gte = new Date(startDate); // Greater than or equal to start date
      }
      if (endDate) {
        // To include the entire end day, set the end date to the very end of that day
        let end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Set to 23:59:59.999
        query.createdAt.$lte = end; // Less than or equal to end of end date
      }
    }

    // Fetch logs from the database based on the constructed query
    // .populate() is used to replace the product/user ObjectId with the actual document data
    // We select specific fields ('name', 'sku' for product; 'email', 'username' for user)
    const logs = await MovementLog.find(query)
                                  .populate('user', 'email username') // Populate user fields needed by frontend
                                  .populate('product', 'name sku')   // Populate product fields needed by frontend
                                  .sort({ createdAt: -1 }); // Sort by newest log first

    res.json(logs); // Send the filtered and populated logs as a JSON response
  } catch (error) {
    console.error('Error fetching movement logs:', error); // Log any errors for debugging
    res.status(500).json({ message: 'Server error fetching movement logs', error: error.message });
  }
});

// --- IMPORTANT NOTE: LOG CREATION LOGIC IS NOT IN THIS FILE ---
// This file is solely for fetching logs. Movement logs are created in other routes
// where inventory changes occur. For example, in your `routes/products.js` file,
// within the `router.post('/')` (Create Product), `router.put('/:id')` (Update Product),
// and `router.delete('/:id')` (Delete Product) routes, you will find or need to add
// `await MovementLog.create({...});` calls.
// Please refer to the complete `products.js` code provided in the previous turn to ensure
// those crucial log creation calls are present in your project.

module.exports = router;