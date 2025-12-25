const threadService = require('../service/thread.service');

class ThreadController {
    getUserThreads = async (req, res) => {
        const userId = req.user && req.user.id;
        try {
            const result = await threadService.getUserThreads(userId);
            res.status(200).json(result);  
        } catch (error) {
            res.status(404).json({
                message: error.message,
                success: false
            });
        }
    }

    getUserThreadStrangers = async (req, res) => {
        const userId = req.user && req.user.id;
        try {
            const result = await threadService.getUserThreadStrangers(userId);
            res.status(200).json(result);  
        } catch (error) {
            res.status(404).json({
                message: error.message,
                success: false
            });
        }
    }

    getThreadById = async (req, res) => {
        const userId = req.user && req.user.id;
        const { threadId } = req.params;
        try {
            const result = await threadService.getThreadById(threadId, userId);
            res.status(200).json(result);  
        } catch (error) {
            res.status(404).json({
                message: error.message,
                success: false
            });
        }
    }
    createThreadGroup = async (req, res) => {
        const userId = req.user && req.user.id;
        const { name, memberIds } = req.body;
        try {
            const result = await threadService.createThreadGroup(userId, name, memberIds);
            res.status(201).json(result);  
        } catch (error) {
            res.status(400).json({
                message: error.message,
                success: false
            });
        }
    }
    outThreadGroup = async (req, res) => {
        const userId = req.user && req.user.id;
        const { threadId } = req.params;
        try {
            const result = await threadService.outThreadGroup(threadId, userId);
            res.status(200).json(result);  
        } catch (error) {
            res.status(400).json({
                message: error.message,
                success: false
            });
        }
    }
    getThreadAttachments = async (req, res) => {
        const userId = req.user && req.user.id;
        const { threadId } = req.params;
        try {
            const result = await threadService.getAttachmenThread(userId, threadId);
            res.status(200).json(result);  
        } catch (error) {
            res.status(400).json({
                message: error.message,
                success: false
            });
        }
    }
    getThreadGroup = async (req, res) => {
        const userId = req.user && req.user.id;
        try {
            const result = await threadService.getThreadGroup(userId);
            res.status(200).json(result);  
        } catch (error) {
            res.status(400).json({
                message: error.message,
                success: false
            });
        }
    }
}

module.exports = new ThreadController();   