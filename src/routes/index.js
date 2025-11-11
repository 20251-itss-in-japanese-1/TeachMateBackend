
const express = require('express');
const authRoutes = require('./auth');
const userRoutes = require('./user');
const friendRoutes = require('./friend');
const notiRoutes = require('./noti');
const threadRoutes = require('./thread');
const chatRoutes = require('./chat');
const scheduleRoutes = require('./schedule');
const pollRoutes = require('./poll');
const router = express.Router();
const base = process.env.BASE_URL || '/api/v1';
router.use(`${base}/auth`, authRoutes);
router.use(`${base}/user`, userRoutes);
router.use(`${base}/friend`, friendRoutes)
router.use(`${base}/noti`, notiRoutes);
router.use(`${base}/thread`, threadRoutes);
router.use(`${base}/chat`, chatRoutes);
router.use(`${base}/schedule`, scheduleRoutes);
router.use(`${base}/poll`, pollRoutes);
module.exports = router;