const express = require('express');
const chatController = require('../controller/chat.controller');
const authMiddleware = require('../middleware/AuthMiddleware');
const fileUpload = require('../config/uploadFile');
const router = express.Router();


router.post('/message', authMiddleware.isAuth, chatController.sendTextMessage);
router.post('/message/file', authMiddleware.isAuth, fileUpload.array('files', 10), chatController.sendMessageFile);
// Delete a message
router.delete('/message/:messageId', authMiddleware.isAuth, chatController.deleteMessage);

// Add reaction to a message
router.post('/message/:messageId/reaction', authMiddleware.isAuth, chatController.addReaction);

// Remove reaction from a message
router.delete('/message/:messageId/reaction', authMiddleware.isAuth, chatController.removeReaction);

// Get all reactions for a message
router.get('/message/:messageId/reactions', authMiddleware.isAuth, chatController.getMessageReactions);

// Mark message(s) as read
router.post('/read', authMiddleware.isAuth, chatController.markAsRead);

// Get unread message count
router.get('/unread', authMiddleware.isAuth, chatController.getUnreadCount);

module.exports = router;
