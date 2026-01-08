const chatService = require('../service/chat.service');

class ChatController {
    getorCreateThread = async (req, res) => {
        const userId = req.user && req.user.id;
        const { recipientId } = req.body;
        try {
            const result = await chatService.getorCreateThread({ senderId: userId, recipientId });
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({
                message: error.message,
                success: false
            });
        }
    }
    // Send a text message
    sendTextMessage = async (req, res) => {
        const userId = req.user && req.user.id;
        const { threadId, content, recipientId } = req.body;
        
        try {
            const result = await chatService.sendTextMessage({ threadId, senderId: userId, recipientId, content });
            res.status(201).json(result);
        } catch (error) {
            res.status(400).json({
                message: error.message,
                success: false
            });
        }
    }
    sendMessageFile = async (req, res) => {
        const userId = req.user && req.user.id;
        const { threadId, recipientId, content} = req.body;
        const files = req.files;    
        try {
            if (!files || files.length === 0) {
                console.log('[sendMessageFile] No files received');
                return res.status(400).json({
                    message: 'No files uploaded',
                    success: false
                });
            }
            const result = await chatService.sendMessageWithFile({ threadId, senderId: userId, recipientId, content, files });
            console.log('[sendMessageFile] Success:', result);
            res.status(201).json(result);
        } catch (error) {
            console.error('[sendMessageFile] Error:', error);
            console.error('[sendMessageFile] Error stack:', error.stack);
            res.status(400).json({
                message: error.message,
                success: false
            });
        }
    }
    // Add reaction to a message
    addReaction = async (req, res) => {
        const userId = req.user && req.user.id;
        const { messageId } = req.params;
        const { reaction } = req.body;
        
        try {
            const result = await chatService.addReaction(messageId, userId, reaction);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({
                message: error.message,
                success: false
            });
        }
    }

    // Remove reaction from a message
    removeReaction = async (req, res) => {
        const userId = req.user && req.user.id;
        const { messageId } = req.params;
        const { reaction } = req.body;
        
        try {
            const result = await chatService.removeReaction(messageId, userId, reaction);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({
                message: error.message,
                success: false
            });
        }
    }

    // Get all reactions for a message
    getMessageReactions = async (req, res) => {
        const { messageId } = req.params;
        
        try {
            const result = await chatService.getMessageReactions(messageId);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json({
                message: error.message,
                success: false
            });
        }
    }

    // Delete a message
    deleteMessage = async (req, res) => {
        const userId = req.user && req.user.id;
        const { messageId } = req.params;
        
        try {
            const result = await chatService.deleteMessage(messageId, userId);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({
                message: error.message,
                success: false
            });
        }
    }

    // Mark message(s) as read
    markAsRead = async (req, res) => {
        const userId = req.user && req.user.id;
        const { messageId, threadId } = req.body;
        
        try {
            const result = await chatService.markAsRead(userId, { messageId, threadId });
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({
                message: error.message,
                success: false
            });
        }
    }

    // Get unread message count
    getUnreadCount = async (req, res) => {
        const userId = req.user && req.user.id;
        const { threadId } = req.query;
        
        try {
            const result = await chatService.getUnreadCount(userId, threadId);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({
                message: error.message,
                success: false
            });
        }
    }
}

module.exports = new ChatController();
