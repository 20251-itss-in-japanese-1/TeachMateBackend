const express = require('express');
const threadController = require('../controller/thread.controller');
const authMiddleware = require('../middleware/AuthMiddleware');
const router = express.Router();

// Get user threads (friends and groups)
router.get('/', authMiddleware.isAuth, threadController.getUserThreads);

// Get user stranger threads
router.get('/strangers', authMiddleware.isAuth, threadController.getUserThreadStrangers);

// Get thread by ID with messages
router.get('/:threadId', authMiddleware.isAuth, threadController.getThreadById);

module.exports = router;
