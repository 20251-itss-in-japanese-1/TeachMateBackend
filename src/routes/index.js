
const express = require('express');
const authRoutes = require('./auth');
const userRoutes = require('./user');
const friendRoutes = require('./friend');
const router = express.Router();
const base = process.env.BASE_URL || '/api/v1';
router.use(`${base}/auth`, authRoutes);
router.use(`${base}/user`, userRoutes);
router.use(`${base}/friend`, friendRoutes)
module.exports = router;