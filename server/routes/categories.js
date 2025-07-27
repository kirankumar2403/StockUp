const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { authenticateJWT, authorizeRole } = require('../middleware/auth');

router.get('/', authenticateJWT, async (req, res) => {
  const categories = await Category.find();
  res.json(categories);
});

router.post('/', authenticateJWT, authorizeRole(['admin', 'staff']), async (req, res) => {
  const category = new Category(req.body);
  await category.save();
  res.status(201).json(category);
});

router.put('/:id', authenticateJWT, authorizeRole(['admin', 'staff']), async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(category);
});

router.delete('/:id', authenticateJWT, authorizeRole(['admin', 'staff']), async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

module.exports = router; 