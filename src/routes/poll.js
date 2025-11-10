const express = require('express');
const pollController = require('../controller/poll.controller');
const authMiddleware = require('../middleware/AuthMiddleware');
const router = express.Router();

// Create a poll
router.post('/', authMiddleware.isAuth, pollController.createPoll);

// Get poll by ID
router.get('/:pollId', authMiddleware.isAuth, pollController.getPollById);

// Vote on a poll
router.post('/:pollId/vote', authMiddleware.isAuth, pollController.votePoll);

// Remove vote from a poll
router.delete('/:pollId/vote', authMiddleware.isAuth, pollController.removeVote);

// Close a poll
router.patch('/:pollId/close', authMiddleware.isAuth, pollController.closePoll);

// Get all polls in a thread
router.get('/thread/:threadId', authMiddleware.isAuth, pollController.getThreadPolls);

module.exports = router;
