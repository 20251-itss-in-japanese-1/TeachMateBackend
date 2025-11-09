const chatService = require('../service/chat.service');

class ChatController {
    // Send a text message
    sendTextMessage = async (req, res) => {
        const userId = req.user && req.user.id;
        const { threadId, content } = req.body;
        
        try {
            const result = await chatService.sendTextMessage(threadId, userId, content);
            res.status(201).json(result);
        } catch (error) {
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
}

module.exports = new ChatController();
