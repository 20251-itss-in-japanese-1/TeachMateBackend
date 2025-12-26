const express = require('express');
const threadController = require('../controller/thread.controller');
const authMiddleware = require('../middleware/AuthMiddleware');
const router = express.Router();


router.get('/attachments/:threadId', authMiddleware.isAuth, threadController.getThreadAttachments);
router.get('/strangers', authMiddleware.isAuth, threadController.getUserThreadStrangers);
router.get('/group', authMiddleware.isAuth, threadController.getThreadGroup);
router.post('/group', authMiddleware.isAuth, threadController.createThreadGroup);
router.post('/join-group', authMiddleware.isAuth, threadController.joinThreadGroup);
router.post('/:threadId/out', authMiddleware.isAuth, threadController.outThreadGroup);
router.get('/:threadId', authMiddleware.isAuth, threadController.getThreadById);
router.get('/', authMiddleware.isAuth, threadController.getUserThreads);
module.exports = router;
