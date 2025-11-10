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
            const result = await threadService.getUserThreadStraqngers(userId);
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
}

module.exports = new ThreadController();   