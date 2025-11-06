const express = require('express');
const authRoutes = require('./auth');
const router = express.Router();
const base = process.env.BASE_URL || '/api/v1';
router.use(`${base}/auth`, authRoutes);

module.exports = router;