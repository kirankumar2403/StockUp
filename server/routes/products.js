const express = require('express');
const router = express.Router();
const Product = require('../models/Product'); // Path to your Product Mongoose model
const Alert = require('../models/Alert');     // Path to your Alert Mongoose model
const MovementLog = require('../models/MovementLog'); // Path to your MovementLog Mongoose model (assuming you have one)
const { authenticateJWT, authorizeRole } = require('../middleware/auth'); // Path to your auth middleware

// Get all products (with optional filters/search)
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const { category, brand, search } = req.query;
    const query = {};

    if (category) {
      query.category = category;
    }
    if (brand) {
      query.brand = brand;
    }
    if (search) {
      // Case-insensitive search on product name or SKU
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query).populate('category brand').sort({ name: 1 }); // Sort by name ascending
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server error fetching products', error: error.message });
  }
});

// Create product
router.post('/', authenticateJWT, authorizeRole('admin'), async (req, res) => {
  try {
    // Log the incoming request body for debugging
    console.log('Received product creation request body:', req.body);

    const product = new Product(req.body); // Mongoose will apply schema validations here
    await product.save();

    console.log('Product saved successfully:', product);

    // --- CRITICAL: MOVEMENT LOG FOR PRODUCT CREATION ---
    // Log creation of a new product
    await MovementLog.create({
        product: product._id,
        // Assuming req.user is set by authenticateJWT middleware and contains user info
        user: req.user._id,
        action: 'Create', // Action type for product creation
        quantity: product.stock, // Initial stock is the quantity
        oldStock: 0,
        newStock: product.stock,
    });
    console.log(`Movement log created: Product ${product.name} created with initial stock ${product.stock}.`);
    // --- END MOVEMENT LOG FOR PRODUCT CREATION ---


    // Populate category and brand before sending back to the frontend
    // This ensures the frontend receives the full product object with populated references
    const populatedProduct = await Product.findById(product._id).populate('category brand');

    res.status(201).json({ message: 'Product created successfully', product: populatedProduct });

  } catch (error) {
    console.error('Error creating product:', error);

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = {};
      for (let field in error.errors) {
        errors[field] = error.errors[field].message;
      }
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    // Handle duplicate key errors (e.g., if SKU is set as unique in schema)
    if (error.code === 11000) {
      // Attempt to parse the duplicate field from the error message
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ message: `Duplicate value for ${field}: ${error.keyValue[field]}. Please use a unique ${field}.`, errors: { [field]: `This ${field} already exists.` } });
    }

    // Generic server error
    res.status(500).json({ message: 'Server error creating product', error: error.message });
  }
});

// Update product (and check for low stock)
router.put('/:id', authenticateJWT, authorizeRole(['admin', 'staff']), async (req, res) => {
  try {
    const productId = req.params.id;
    const oldProduct = await Product.findById(productId); // Get old product to compare stock

    if (!oldProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      req.body,
      { new: true, runValidators: true } // Return the updated document and run schema validators
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found after update attempt.' });
    }

    // --- CRITICAL: MOVEMENT LOG FOR PRODUCT UPDATE ---
    if (updatedProduct.stock !== oldProduct.stock) { // Log only if stock actually changed
      const quantityChange = updatedProduct.stock - oldProduct.stock;
      let actionType;
      if (quantityChange > 0) {
        actionType = 'Restock';
      } else if (quantityChange < 0) {
        actionType = 'Sale'; // Or 'Remove' if it's not a sale specifically
      } else {
        actionType = 'Adjustment'; // Should not happen if condition is !=
      }

      await MovementLog.create({
        product: updatedProduct._id,
        user: req.user._id, // Assuming req.user._id is available from authenticateJWT
        action: actionType,
        quantity: quantityChange, // Signed quantity change
        oldStock: oldProduct.stock,
        newStock: updatedProduct.stock,
      });
      console.log(`Movement log created: ${actionType} for ${updatedProduct.name}. Quantity: ${quantityChange}`);
    } else {
        console.log(`Product ${updatedProduct.name} updated, but stock quantity did not change. No movement log created for stock.`);
    }
    // --- END MOVEMENT LOG FOR PRODUCT UPDATE ---


    // --- Alert Creation/Emission Logic ---
    // Only check for low stock if stock actually changed and dropped to or below threshold
    // Use `updatedProduct.threshold` as per your frontend and schema
    if (updatedProduct.stock <= updatedProduct.threshold && oldProduct.stock > updatedProduct.stock) {
        let existingAlert = await Alert.findOne({ product: updatedProduct._id, resolved: false });

        if (!existingAlert) {
            // Create the alert in the database
            const newAlert = await Alert.create({
                product: updatedProduct._id,
                type: 'low_stock', // Ensure this matches your Alert schema enum
                message: `Low stock for ${updatedProduct.name}. Current stock: ${updatedProduct.stock}, Threshold: ${updatedProduct.threshold}`
            });

            // IMPORTANT: Populate the product field on the new alert before emitting
            // This is crucial because your frontend's AlertsContent expects `alert.product.name`
            const populatedAlert = await Alert.findById(newAlert._id).populate('product');

            // Get the Socket.IO instance from the app
            const io = req.app.get('io');
            if (io) {
                // Emit the real-time alert event
                io.emit('low_stock_alert', populatedAlert);
                console.log('Low stock alert created and emitted via socket:', populatedAlert);
            } else {
                console.warn('Socket.IO instance (io) not available on req.app.get("io"). Real-time alerts may not work.');
            }
        } else {
            console.log('Low stock alert already exists for this product and is unresolved, not creating a new one.');
        }
    }
    // --- End Alert Logic ---

    // Populate category and brand before sending the updated product back to the frontend
    const populatedProductResponse = await Product.findById(updatedProduct._id).populate('category brand');
    res.json({ message: 'Product updated successfully', product: populatedProductResponse });

  } catch (error) {
    console.error('Error updating product:', error);
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = {};
      for (let field in error.errors) {
        errors[field] = error.errors[field].message;
      }
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    // Handle CastError (e.g., invalid ID format in URL param)
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid Product ID provided.', error: error.message });
    }
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ message: `Duplicate value for ${field}: ${error.keyValue[field]}. Please use a unique ${field}.`, errors: { [field]: `This ${field} already exists.` } });
    }
    res.status(500).json({ message: 'Server error updating product', error: error.message });
  }
});

// Delete product
router.delete('/:id', authenticateJWT, authorizeRole(['admin', 'staff']), async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    // Optional: Also delete any associated alerts for this product
    await Alert.deleteMany({ product: req.params.id });
    console.log(`Product ${req.params.id} and associated alerts deleted.`);

    // --- CRITICAL: MOVEMENT LOG FOR PRODUCT DELETION ---
    // Log product deletion
    await MovementLog.create({
        product: product._id, // Log the ID of the deleted product
        user: req.user._id,
        action: 'Delete',
        quantity: -product.stock, // Negative stock represents removal from inventory
        oldStock: product.stock,
        newStock: 0,
    });
    console.log(`Movement log created: Product ${product.name} deleted.`);
    // --- END MOVEMENT LOG FOR PRODUCT DELETION ---

    res.status(204).end(); // 204 No Content for successful deletion
  } catch (error) {
    console.error('Error deleting product:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid Product ID provided.', error: error.message });
    }
    res.status(500).json({ message: 'Server error deleting product', error: error.message });
  }
});

// Inventory summary for reports
router.get('/summary', authenticateJWT, async (req, res) => {
  try {
    const products = await Product.find();
    // Use 'threshold' for low stock count, consistent with frontend and alert logic
    const totalProducts = products.length;
    const lowStockCount = products.filter(p => p.stock <= p.threshold).length;
    // Ensure 'price' field exists in Product model for inventory value calculation
    const inventoryValue = products.reduce((sum, p) => sum + (p.stock * (p.price || 0)), 0);
    res.json({ totalProducts, lowStockCount, inventoryValue });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ message: 'Server error fetching summary', error: error.message });
  }
});

// Stock trends (dummy: last 7 days, sum of stock)
router.get('/stock-trends', authenticateJWT, async (req, res) => {
  try {
    // In a real app, you'd aggregate MovementLog by date
    // Or track daily snapshots of total stock.
    const days = 7;
    const today = new Date();
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      // Dummy data for stock trends
      data.push({ date: d.toISOString().slice(0, 10), stock: Math.floor(Math.random() * 100) + 50 });
    }
    res.json(data);
  } catch (error) {
    console.error('Error fetching stock trends:', error);
    res.status(500).json({ message: 'Server error fetching stock trends', error: error.message });
  }
});

// Top-selling products (dummy: random)
router.get('/top-selling', authenticateJWT, async (req, res) => {
  try {
    // In a real app, you'd aggregate MovementLog for 'Sale' actions
    // Or use a dedicated sales collection.
    const products = await Product.find().limit(10); // Get up to 10 products
    const top = products.map(p => ({ name: p.name, sold: Math.floor(Math.random() * 50) + 10 })); // Dummy sales count
    // Sort by sold count for a more realistic "top-selling" list
    top.sort((a, b) => b.sold - a.sold);
    res.json(top.slice(0, 5)); // Return top 5
  } catch (error) {
    console.error('Error fetching top-selling products:', error);
    res.status(500).json({ message: 'Server error fetching top-selling products', error: error.message });
  }
});

module.exports = router;