const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert'); // Path to your Alert Mongoose model
const Product = require('../models/Product'); // Needed for PO generation context if not populated
const { authenticateJWT, authorizeRole } = require('../middleware/auth'); // Path to your auth middleware

// Get all alerts
router.get('/', authenticateJWT, async (req, res) => {
  try {
    // By default, fetch only unresolved alerts. You can add a query parameter (e.g., /api/alerts?resolved=true)
    // if you want to allow fetching resolved alerts as well.
    const filter = { resolved: false };
    if (req.query.resolved === 'true') {
      filter.resolved = true;
    } else if (req.query.resolved === 'all') {
      delete filter.resolved; // Remove filter to get all alerts
    }

    const alerts = await Alert.find(filter)
                                .populate('product') // Populate product details for frontend display
                                .sort({ createdAt: -1 }); // Show newest alerts first

    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ message: 'Server error fetching alerts', error: error.message });
  }
});

// Resolve an alert
router.put('/:id/resolve', authenticateJWT, authorizeRole('admin'), async (req, res) => {
  try {
    const alertId = req.params.id;
    const alert = await Alert.findByIdAndUpdate(
      alertId,
      { resolved: true },
      { new: true, runValidators: true } // Return the updated document and run schema validators
    ).populate('product'); // Populate product for the response

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found.' });
    }
    res.json({ message: 'Alert resolved successfully.', alert });
  } catch (error) {
    console.error('Error resolving alert:', error);
    // Mongoose CastError (e.g., invalid ID format) or other database errors
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid Alert ID provided.', error: error.message });
    }
    // Handle other validation errors if any on the Alert model itself
    if (error.name === 'ValidationError') {
        const errors = {};
        for (let field in error.errors) {
            errors[field] = error.errors[field].message;
        }
        return res.status(400).json({ message: 'Validation failed during alert resolution.', errors });
    }
    res.status(500).json({ message: 'Server error resolving alert.', error: error.message });
  }
});

// Generate Purchase Order for an alert
router.put('/:id/generate-po', authenticateJWT, authorizeRole('admin'), async (req, res) => {
  try {
    const alertId = req.params.id;
    const alert = await Alert.findById(alertId).populate('product'); // Populate product to get details for PO

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found.' });
    }

    if (alert.poGenerated) {
      return res.status(409).json({ message: 'Purchase Order already generated for this alert.' });
    }

    // --- Placeholder for actual PO generation logic ---
    console.log(`\n--- PO GENERATION INITIATED ---`);
    console.log(`Alert ID: ${alert._id}`);
    console.log(`Product: ${alert.product?.name || 'N/A'}`);
    console.log(`SKU: ${alert.product?.sku || 'N/A'}`);
    console.log(`Current Stock: ${alert.product?.stock || 'N/A'}`);
    console.log(`Threshold: ${alert.product?.threshold || 'N/A'}`);
    console.log(`Message: ${alert.message}`);
    console.log(`--- END PO GENERATION --- \n`);

    // In a real application, this would involve:
    // 1. Creating a formal Purchase Order record in your DB (e.g., in a new 'PurchaseOrder' model).
    //    Example: await PurchaseOrder.create({ alert: alert._id, product: alert.product._id, quantity: /* calculated quantity */, status: 'pending' });
    // 2. Possibly sending an email to a supplier or procurement team.
    // 3. Integrating with an external system (e.g., ERP, inventory management software).

    // Update alert status to mark PO as generated
    alert.poGenerated = true;
    // Optionally, you might automatically resolve the alert after PO generation if that fits your workflow:
    // alert.resolved = true;
    await alert.save();

    // Re-fetch the alert to ensure the latest status is returned in the response
    const updatedAlert = await Alert.findById(alert._id).populate('product');

    res.json({ message: 'Purchase Order generated successfully.', alert: updatedAlert });
  } catch (error) {
    console.error('Error generating PO:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid Alert ID provided.', error: error.message });
    }
    // Handle other validation errors if any on the Alert model itself
    if (error.name === 'ValidationError') {
        const errors = {};
        for (let field in error.errors) {
            errors[field] = error.errors[field].message;
        }
        return res.status(400).json({ message: 'Validation failed during PO generation.', errors });
    }
    res.status(500).json({ message: 'Server error generating PO.', error: error.message });
  }
});

module.exports = router;