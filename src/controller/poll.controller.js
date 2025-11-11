const pollService = require('../service/poll.service');

class PollController {
    // Create a poll in a thread
    createPoll = async (req, res) => {
        const userId = req.user && req.user.id;
        const { threadId, question, options } = req.body;
        
        try {
            const result = await pollService.createPoll(threadId, userId, {
                question,
                options
            });
            res.status(201).json(result);
        } catch (error) {
            res.status(400).json({
                message: error.message,
                success: false
            });
        }
    }

    // Vote on a poll
    votePoll = async (req, res) => {
        const userId = req.user && req.user.id;
        const { pollId } = req.params;
        const { optionId } = req.body;
        
        try {
            const result = await pollService.votePoll(pollId, userId, optionId);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({
                message: error.message,
                success: false
            });
        }
    }

    // Remove vote from a poll
    removeVote = async (req, res) => {
        const userId = req.user && req.user.id;
        const { pollId } = req.params;
        
        try {
            const result = await pollService.removeVote(pollId, userId);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({
                message: error.message,
                success: false
            });
        }
    }

    // Close a poll
    closePoll = async (req, res) => {
        const userId = req.user && req.user.id;
        const { pollId } = req.params;
        
        try {
            const result = await pollService.closePoll(pollId, userId);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({
                message: error.message,
                success: false
            });
        }
    }

    // Get poll by ID
    getPollById = async (req, res) => {
        const userId = req.user && req.user.id;
        const { pollId } = req.params;
        
        try {
            const result = await pollService.getPollById(pollId, userId);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json({
                message: error.message,
                success: false
            });
        }
    }

    // Get all polls in a thread
    getThreadPolls = async (req, res) => {
        const userId = req.user && req.user.id;
        const { threadId } = req.params;
        const { isActive } = req.query;
        
        try {
            const filters = {};
            if (isActive !== undefined) {
                filters.isActive = isActive;
            }
            
            const result = await pollService.getThreadPolls(threadId, userId, filters);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json({
                message: error.message,
                success: false
            });
        }
    }
}

module.exports = new PollController();
