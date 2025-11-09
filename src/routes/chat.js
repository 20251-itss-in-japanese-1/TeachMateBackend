const express = require('express');
const chatController = require('../controller/chat.controller');
const authMiddleware = require('../middleware/AuthMiddleware');
const router = express.Router();

router.post('/message', authMiddleware.isAuth, chatController.sendTextMessage);
router.delete('/message/:messageId', authMiddleware.isAuth, chatController.deleteMessage);
router.post('/message/:messageId/reaction', authMiddleware.isAuth, chatController.addReaction);
router.delete('/message/:messageId/reaction', authMiddleware.isAuth, chatController.removeReaction);
router.get('/message/:messageId/reactions', authMiddleware.isAuth, chatController.getMessageReactions);

module.exports = router;
