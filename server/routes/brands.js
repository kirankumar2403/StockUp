const express = require('express');
const router = express.Router();
const Brand = require('../models/Brand');
const { authenticateJWT, authorizeRole } = require('../middleware/auth');

router.get('/', authenticateJWT, async (req, res) => {
  const brands = await Brand.find();
  res.json(brands);
});

router.post('/', authenticateJWT, authorizeRole(['admin', 'staff']), async (req, res) => {
  const brand = new Brand(req.body);
  await brand.save();
  res.status(201).json(brand);
});

router.put('/:id', authenticateJWT, authorizeRole(['admin', 'staff']), async (req, res) => {
  const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(brand);
});

router.delete('/:id', authenticateJWT, authorizeRole(['admin', 'staff']), async (req, res) => {
  await Brand.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

module.exports = router; 