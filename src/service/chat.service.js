const Thread = require('../model/Thread');
const Message = require('../model/Message');
const User = require('../model/User');
const Notification = require('../model/Notification');

class ChatService {
    sendTextMessage = async (threadId, senderId, content) => {
        if (!threadId || !senderId) {
            throw new Error('Thread ID and sender ID are required');
        }
        
        if (!content || content.trim().length === 0) {
            throw new Error('Message content cannot be empty');
        }

        if (content.length > 2000) {
            throw new Error('Message content exceeds maximum length of 2000 characters');
        }
        const thread = await Thread.findOne({
            _id: threadId,
            'members.userId': senderId
        });

        if (!thread) {
            throw new Error('Thread not found or you are not a member');
        }
        const sender = await User.findById(senderId);
        if (!sender) {
            throw new Error('Sender not found');
        }
        const newMessage = new Message({
            threadId,
            senderId,
            contentType: 'text',
            content: content.trim(),
            attachments: [],
            reactions: [],
            createdAt: new Date()
        });

        await newMessage.save();
        thread.lastMessage = newMessage._id;
        thread.updatedAt = new Date();
        await thread.save();
        
        // Create notifications for other members
        const otherMembers = thread.members.filter(
            member => member.userId.toString() !== senderId.toString()
        );
        
        const notifications = otherMembers.map(member => ({
            userId: member.userId,
            type: 'message',
            title: `New message from ${sender.name}`,
            body: content.length > 100 ? content.substring(0, 100) + '...' : content,
            refId: thread._id,
            refType: 'thread',
            read: false,
            createdAt: new Date()
        }));
        
        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }
        
        const populatedMessage = await Message.findById(newMessage._id)
            .populate('senderId', 'name avatarUrl email');

        return {
            success: true,
            message: 'Message sent successfully',
            data: populatedMessage
        };
    }
    addReaction = async (messageId, userId, reaction) => {
        if (!messageId || !userId) {
            throw new Error('Message ID and user ID are required');
        }

        if (!reaction || reaction.trim().length === 0) {
            throw new Error('Reaction cannot be empty');
        }
        const message = await Message.findById(messageId);
        if (!message) {
            throw new Error('Message not found');
        }
        const thread = await Thread.findOne({
            _id: message.threadId,
            'members.userId': userId
        });

        if (!thread) {
            throw new Error('You are not a member of this thread');
        }
        const reactionString = `${userId}:${reaction.trim()}`;
        
        if (message.reactions.includes(reactionString)) {
            throw new Error('You have already added this reaction');
        }
        message.reactions.push(reactionString);
        await message.save();

        // Create notification for message sender (if not reacting to own message)
        if (message.senderId.toString() !== userId.toString()) {
            const user = await User.findById(userId);
            await Notification.create({
                userId: message.senderId,
                type: 'message',
                title: `${user.name} reacted to your message`,
                body: `Reacted with ${reaction.trim()}`,
                refId: thread._id,
                refType: 'thread',
                read: false,
                createdAt: new Date()
            });
        }

        return {
            success: true,
            message: 'Reaction added successfully',
            data: {
                messageId: message._id,
                reactions: message.reactions
            }
        };
    }
    removeReaction = async (messageId, userId, reaction) => {
        if (!messageId || !userId) {
            throw new Error('Message ID and user ID are required');
        }

        if (!reaction || reaction.trim().length === 0) {
            throw new Error('Reaction cannot be empty');
        }
        const message = await Message.findById(messageId);
        if (!message) {
            throw new Error('Message not found');
        }
        const thread = await Thread.findOne({
            _id: message.threadId,
            'members.userId': userId
        });

        if (!thread) {
            throw new Error('You are not a member of this thread');
        }
        const reactionString = `${userId}:${reaction.trim()}`;
        const reactionIndex = message.reactions.indexOf(reactionString);

        if (reactionIndex === -1) {
            throw new Error('Reaction not found');
        }

        message.reactions.splice(reactionIndex, 1);
        await message.save();

        return {
            success: true,
            message: 'Reaction removed successfully',
            data: {
                messageId: message._id,
                reactions: message.reactions
            }
        };
    }
    getMessageReactions = async (messageId) => {
        if (!messageId) {
            throw new Error('Message ID is required');
        }

        const message = await Message.findById(messageId);
        if (!message) {
            throw new Error('Message not found');
        }
        const reactionsMap = {};
        for (const reactionStr of message.reactions) {
            const [userId, emoji] = reactionStr.split(':');
            if (!reactionsMap[emoji]) {
                reactionsMap[emoji] = [];
            }
            reactionsMap[emoji].push(userId);
        }
        const groupedReactions = Object.entries(reactionsMap).map(([emoji, userIds]) => ({
            emoji,
            count: userIds.length,
            userIds
        }));

        return {
            success: true,
            message: 'Reactions fetched successfully',
            data: {
                messageId: message._id,
                reactions: groupedReactions
            }
        };
    }
    deleteMessage = async (messageId, userId) => {
        if (!messageId || !userId) {
            throw new Error('Message ID and user ID are required');
        }

        const message = await Message.findById(messageId);
        if (!message) {
            throw new Error('Message not found');
        }
        if (message.senderId.toString() !== userId.toString()) {
            throw new Error('You can only delete your own messages');
        }
        const thread = await Thread.findOne({
            _id: message.threadId,
            'members.userId': userId
        });

        if (!thread) {
            throw new Error('You are not a member of this thread');
        }
        await Message.findByIdAndDelete(messageId);
        if (thread.lastMessage && thread.lastMessage.toString() === messageId.toString()) {
            const lastMessage = await Message.findOne({ threadId: thread._id })
                .sort({ createdAt: -1 });
            thread.lastMessage = lastMessage ? lastMessage._id : null;
            await thread.save();
        }

        return {
            success: true,
            message: 'Message deleted successfully'
        };
    }
}

module.exports = new ChatService();
