const express = require('express');
const threadController = require('../controller/thread.controller');
const authMiddleware = require('../middleware/AuthMiddleware');
const router = express.Router();

router.get('/', authMiddleware.isAuth, threadController.getUserThreads);
router.get('/strangers', authMiddleware.isAuth, threadController.getUserThreadStrangers);
router.get('/:threadId', authMiddleware.isAuth, threadController.getThreadById);
router.post('/group', authMiddleware.isAuth, threadController.createThreadGroup);
router.post('/:threadId/out', authMiddleware.isAuth, threadController.outThreadGroup);

module.exports = router;
