const Poll = require('../model/Poll');
const Thread = require('../model/Thread');
const Message = require('../model/Message');
const User = require('../model/User');
const Notification = require('../model/Notification');

class PollService {
    /**
     * Create a poll in a thread
     * @param {string} threadId - The ID of the thread
     * @param {string} userId - The ID of the user creating poll
     * @param {Object} pollData - Poll details (question, options)
     * @returns {Object} - Success response with poll and message data
     */
    createPoll = async (threadId, userId, pollData) => {
        const { question, options } = pollData;

        if (!threadId || !userId) {
            throw new Error('Thread ID and user ID are required');
        }

        if (!question || question.trim().length === 0) {
            throw new Error('Poll question is required');
        }

        if (question.length > 100) {
            throw new Error('Poll question cannot exceed 100 characters');
        }

        if (!options || !Array.isArray(options) || options.length < 2) {
            throw new Error('Poll must have at least 2 options');
        }

        if (options.length > 10) {
            throw new Error('Poll cannot have more than 10 options');
        }

        // Verify thread exists and user is a member
        const thread = await Thread.findOne({
            _id: threadId,
            'members.userId': userId
        });

        if (!thread) {
            throw new Error('Thread not found or you are not a member');
        }

        // Verify user exists
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Validate and format options
        const formattedOptions = options.map(option => {
            const optionText = typeof option === 'string' ? option : option.text;
            if (!optionText || optionText.trim().length === 0) {
                throw new Error('Poll option cannot be empty');
            }
            return {
                text: optionText.trim(),
                votes: 0,
                voters: []
            };
        });

        // Create poll
        const newPoll = new Poll({
            threadId,
            creatorId: userId,
            question: question.trim(),
            options: formattedOptions,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await newPoll.save();

        // Create a message with poll
        const pollMessage = new Message({
            threadId,
            senderId: userId,
            contentType: 'poll',
            content: `📊 Poll: ${question}`,
            pollId: newPoll._id,
            reactions: [],
            createdAt: new Date()
        });

        await pollMessage.save();

        // Update thread's lastMessage
        thread.lastMessage = pollMessage._id;
        thread.updatedAt = new Date();
        await thread.save();

        // Populate poll data
        const populatedPoll = await Poll.findById(newPoll._id)
            .populate('creatorId', 'name avatarUrl email')
            .populate('options.voters', 'name avatarUrl email');

        const populatedMessage = await Message.findById(pollMessage._id)
            .populate('senderId', 'name avatarUrl email');

        // Create notifications for other members
        const otherMembers = thread.members.filter(
            member => member.userId.toString() !== userId.toString()
        );
        
        if (otherMembers.length > 0) {
            const notifications = otherMembers.map(member => ({
                userId: member.userId,
                type: 'message',
                title: `New poll from ${user.name}`,
                body: question.length > 80 ? question.substring(0, 80) + '...' : question,
                refId: thread._id,
                refType: 'thread',
                read: false,
                createdAt: new Date()
            }));
            
            await Notification.insertMany(notifications);
        }

        return {
            success: true,
            message: 'Poll created successfully',
            data: {
                poll: populatedPoll,
                message: populatedMessage
            }
        };
    }

    /**
     * Vote on a poll option
     * @param {string} pollId - The ID of the poll
     * @param {string} userId - The ID of the user voting
     * @param {string} optionId - The ID of the option to vote for
     * @returns {Object} - Success response with updated poll
     */
    votePoll = async (pollId, userId, optionId) => {
        if (!pollId || !userId || !optionId) {
            throw new Error('Poll ID, user ID, and option ID are required');
        }

        // Find the poll
        const poll = await Poll.findById(pollId);
        if (!poll) {
            throw new Error('Poll not found');
        }

        // Check if poll is active
        if (!poll.isActive) {
            throw new Error('This poll is no longer active');
        }

        // Verify user is a member of the thread
        const thread = await Thread.findOne({
            _id: poll.threadId,
            'members.userId': userId
        });

        if (!thread) {
            throw new Error('You are not a member of this thread');
        }

        // Find the option
        const option = poll.options.id(optionId);
        if (!option) {
            throw new Error('Poll option not found');
        }

        // Check if user has already voted
        let hasVoted = false;
        let previousOptionId = null;

        for (const opt of poll.options) {
            const voterIndex = opt.voters.findIndex(
                voterId => voterId.toString() === userId.toString()
            );
            if (voterIndex !== -1) {
                hasVoted = true;
                previousOptionId = opt._id.toString();
                // Remove previous vote
                opt.voters.splice(voterIndex, 1);
                opt.votes = Math.max(0, opt.votes - 1);
            }
        }

        // Add new vote
        option.voters.push(userId);
        option.votes += 1;
        poll.updatedAt = new Date();

        await poll.save();

        // Populate poll data
        const populatedPoll = await Poll.findById(poll._id)
            .populate('creatorId', 'name avatarUrl email')
            .populate('options.voters', 'name avatarUrl email');

        // Create notification for poll creator (if not voting on own poll and first vote)
        if (poll.creatorId.toString() !== userId.toString() && !hasVoted) {
            const voter = await User.findById(userId);
            await Notification.create({
                userId: poll.creatorId,
                type: 'message',
                title: `${voter.name} voted on your poll`,
                body: `Poll: ${poll.question}`,
                refId: thread._id,
                refType: 'thread',
                read: false,
                createdAt: new Date()
            });
        }

        return {
            success: true,
            message: hasVoted ? 'Vote updated successfully' : 'Vote recorded successfully',
            data: populatedPoll
        };
    }

    /**
     * Remove vote from a poll
     * @param {string} pollId - The ID of the poll
     * @param {string} userId - The ID of the user removing vote
     * @returns {Object} - Success response with updated poll
     */
    removeVote = async (pollId, userId) => {
        if (!pollId || !userId) {
            throw new Error('Poll ID and user ID are required');
        }

        const poll = await Poll.findById(pollId);
        if (!poll) {
            throw new Error('Poll not found');
        }

        // Check if poll is active
        if (!poll.isActive) {
            throw new Error('This poll is no longer active');
        }

        // Verify user is a member of the thread
        const thread = await Thread.findOne({
            _id: poll.threadId,
            'members.userId': userId
        });

        if (!thread) {
            throw new Error('You are not a member of this thread');
        }

        // Find and remove user's vote
        let voteRemoved = false;
        for (const option of poll.options) {
            const voterIndex = option.voters.findIndex(
                voterId => voterId.toString() === userId.toString()
            );
            if (voterIndex !== -1) {
                option.voters.splice(voterIndex, 1);
                option.votes = Math.max(0, option.votes - 1);
                voteRemoved = true;
                break;
            }
        }

        if (!voteRemoved) {
            throw new Error('You have not voted on this poll');
        }

        poll.updatedAt = new Date();
        await poll.save();

        // Populate poll data
        const populatedPoll = await Poll.findById(poll._id)
            .populate('creatorId', 'name avatarUrl email')
            .populate('options.voters', 'name avatarUrl email');

        return {
            success: true,
            message: 'Vote removed successfully',
            data: populatedPoll
        };
    }

    /**
     * Close/End a poll
     * @param {string} pollId - The ID of the poll
     * @param {string} userId - The ID of the user closing the poll
     * @returns {Object} - Success response
     */
    closePoll = async (pollId, userId) => {
        if (!pollId || !userId) {
            throw new Error('Poll ID and user ID are required');
        }

        const poll = await Poll.findById(pollId);
        if (!poll) {
            throw new Error('Poll not found');
        }

        // Only creator can close the poll
        if (poll.creatorId.toString() !== userId.toString()) {
            throw new Error('Only the poll creator can close this poll');
        }

        if (!poll.isActive) {
            throw new Error('Poll is already closed');
        }

        poll.isActive = false;
        poll.updatedAt = new Date();
        await poll.save();

        // Get thread for notification
        const thread = await Thread.findById(poll.threadId);
        
        // Create notifications for all members who voted
        const allVoters = new Set();
        poll.options.forEach(option => {
            option.voters.forEach(voterId => {
                if (voterId.toString() !== userId.toString()) {
                    allVoters.add(voterId.toString());
                }
            });
        });

        if (allVoters.size > 0) {
            const creator = await User.findById(userId);
            const notifications = Array.from(allVoters).map(voterId => ({
                userId: voterId,
                type: 'message',
                title: `Poll closed: ${poll.question}`,
                body: `${creator.name} closed the poll`,
                refId: thread._id,
                refType: 'thread',
                read: false,
                createdAt: new Date()
            }));
            
            await Notification.insertMany(notifications);
        }

        const populatedPoll = await Poll.findById(poll._id)
            .populate('creatorId', 'name avatarUrl email')
            .populate('options.voters', 'name avatarUrl email');

        return {
            success: true,
            message: 'Poll closed successfully',
            data: populatedPoll
        };
    }

    /**
     * Get poll by ID
     * @param {string} pollId - The ID of the poll
     * @param {string} userId - The ID of the user requesting
     * @returns {Object} - Success response with poll details
     */
    getPollById = async (pollId, userId) => {
        if (!pollId || !userId) {
            throw new Error('Poll ID and user ID are required');
        }

        const poll = await Poll.findById(pollId)
            .populate('creatorId', 'name avatarUrl email')
            .populate('options.voters', 'name avatarUrl email');

        if (!poll) {
            throw new Error('Poll not found');
        }

        // Verify user has access (is member of the thread)
        const thread = await Thread.findOne({
            _id: poll.threadId,
            'members.userId': userId
        });

        if (!thread) {
            throw new Error('You do not have access to this poll');
        }

        // Add total votes count
        const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);

        // Check if user has voted and which option
        let userVote = null;
        for (const option of poll.options) {
            if (option.voters.some(voter => voter._id.toString() === userId.toString())) {
                userVote = option._id;
                break;
            }
        }

        return {
            success: true,
            message: 'Poll fetched successfully',
            data: {
                ...poll.toObject(),
                totalVotes,
                userVote
            }
        };
    }

    /**
     * Get all polls in a thread
     * @param {string} threadId - The ID of the thread
     * @param {string} userId - The ID of the user requesting
     * @param {Object} filters - Optional filters (isActive)
     * @returns {Object} - Success response with polls
     */
    getThreadPolls = async (threadId, userId, filters = {}) => {
        if (!threadId || !userId) {
            throw new Error('Thread ID and user ID are required');
        }

        // Verify user is a member of the thread
        const thread = await Thread.findOne({
            _id: threadId,
            'members.userId': userId
        });

        if (!thread) {
            throw new Error('Thread not found or you are not a member');
        }

        // Build query
        const query = { threadId };

        // Apply filters
        if (filters.isActive !== undefined) {
            query.isActive = filters.isActive === true || filters.isActive === 'true';
        }

        // Find polls
        const polls = await Poll.find(query)
            .populate('creatorId', 'name avatarUrl email')
            .populate('options.voters', 'name avatarUrl email')
            .sort({ createdAt: -1 });

        // Add total votes and user vote for each poll
        const pollsWithDetails = polls.map(poll => {
            const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
            let userVote = null;
            for (const option of poll.options) {
                if (option.voters.some(voter => voter._id.toString() === userId.toString())) {
                    userVote = option._id;
                    break;
                }
            }
            return {
                ...poll.toObject(),
                totalVotes,
                userVote
            };
        });

        return {
            success: true,
            message: 'Polls fetched successfully',
            data: pollsWithDetails
        };
    }
}

module.exports = new PollService();
