const Thread = require('../model/Thread');
const Message = require('../model/Message');
const User = require('../model/User');
const Notification = require('../model/Notification');
class ChatService {
    getorCreateThread = async ({senderId, recipientId}) => {
        if (!senderId || !recipientId) throw new Error('Missing senderId or recipientId');
        const ids = [senderId.toString(), recipientId.toString()].sort();
        const memberHash = ids.join('_');
        let thread = await Thread.findOne({
            memberHash,
            type: { $in: ['direct_friend', 'direct_stranger'] }
        })
        .populate('members.userId', 'name avatar');
        if (thread) return {
            success: true,
            message: 'Thread fetched successfully',
            data: thread
        }
        const sender = await User.findById(senderId).select('friends');
        const isFriend = sender && sender.friends.some(f => f.toString() === recipientId.toString());
        const newThread = await Thread.create({
            type: isFriend ? 'direct_friend' : 'direct_stranger',
            memberHash, 
            createdBy: senderId,
            members: [
                { userId: senderId, role: 'member', lastReadAt: new Date() }, 
                { userId: recipientId, role: 'member', lastReadAt: null }
            ]
        });
        const data = await newThread.populate('members.userId', 'name avatar');
        return {
            success: true,
            message: 'Thread created successfully',
            data
        };
    } 

    sendTextMessage = async ({ threadId, senderId, content }) => {
        if (!senderId) throw new Error('Sender ID is required');
        if (!threadId || threadId === 'null') {
            throw new Error('Thread ID is required');
        }
        if (!content || content.trim().length === 0) throw new Error('Message content cannot be empty');
        if (content.length > 2000) throw new Error('Message content exceeds maximum length of 2000 characters');

        const sender = await User.findById(senderId);
        if (!sender) throw new Error('Sender not found');
        const thread = await Thread.findOne({ _id: threadId, 'members.userId': senderId });
        if (!thread) throw new Error('Thread not found or you are not a member');
        const newMessage = await Message.create({
            threadId: thread._id,
            senderId: senderId,
            contentType: 'text',
            content: content.trim(),
            attachments: [],
            reactions: [],
            readBy: [senderId],
            createdAt: new Date()
        });

        thread.lastMessage = newMessage._id;
        thread.updatedAt = new Date();
        const senderMember = thread.members.find(m => m.userId.toString() === senderId.toString());
        if (senderMember) senderMember.lastReadAt = new Date();
        await thread.save();
        const otherMembers = thread.members.filter(m => m.userId.toString() !== senderId.toString());
        const notifications = otherMembers.map(m => ({
            userId: m.userId,
            type: 'message',
            title: `New message from ${sender.name}`,
            body: content.length > 100 ? content.slice(0, 100) + '...' : content,
            refId: thread._id,
            refType: 'thread',
            read: false,
            createdAt: new Date()
        }));

        if (notifications.length) {
            await Notification.insertMany(notifications, { ordered: false }).catch(() => {});
        }

        return {
            success: true,
            message: 'Message sent successfully'
        };
    };
    sendMessageWithFile = async ({ 
        threadId, 
        senderId, 
        content = "", 
        files = [] 
    }) => {        
        if (!senderId) throw new Error("Sender ID is required");
        if (!threadId || threadId === "null") {
            throw new Error("Thread ID is required");
        }

        const sender = await User.findById(senderId);
        if (!sender) throw new Error("Sender not found");
        const thread = await Thread.findOne({ _id: threadId, "members.userId": senderId });
        if (!thread) throw new Error("Thread not found or you are not a member");

        const createdMessages = [];
        if (content && content.trim().length > 0) {
            const textMsg = await Message.create({
                threadId: thread._id,
                senderId,
                contentType: "text",
                content: content.trim(),
                attachments: [],
                readBy: [senderId],
                reactions: [],
                createdAt: new Date()
            });
            createdMessages.push(textMsg);
        }
        for (const f of files) {
            let kind = "file";
            if (f.mimetype.startsWith("image/")) kind = "image";
            
            const fileUrl = f.path || f.secure_url || f.url;
            const fileMsg = await Message.create({
                threadId: thread._id,
                senderId,
                contentType: "file",
                content: "",
                attachments: [
                {
                    kind,
                    mime: f.mimetype,
                    url: fileUrl  
                }
                ],
                readBy: [senderId],
                reactions: [],
                createdAt: new Date()
            });
            console.log(`[sendMessageWithFile] Created message for file:`, fileMsg._id);
            createdMessages.push(fileMsg);
        }

        // Update thread
        if (createdMessages.length > 0) {
            const last = createdMessages[createdMessages.length - 1];
            thread.lastMessage = last._id;
            thread.updatedAt = new Date();

            const senderMember = thread.members.find(
                m => m.userId.toString() === senderId.toString()
            );
            if (senderMember) senderMember.lastReadAt = new Date();
            await thread.save();
        }

        // Create notifications for other members
        const otherMembers = thread.members.filter(
            m => m.userId.toString() !== senderId.toString()
        );

        const notifications = otherMembers.map(m => ({
            userId: m.userId,
            type: "message",
            title: `New message from ${sender.name}`,
            body: content ? content.slice(0, 100) : "Sent an attachment",
            refId: thread._id,
            refType: "thread",
            read: false,
            createdAt: new Date()
        }));

        if (notifications.length) {
            await Notification.insertMany(notifications, { ordered: false }).catch(() => {});
        }

        return {
            success: true,
            message: "Message(s) sent successfully",
            messages: createdMessages
        };
    };


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
        await Message.findByIdAndUpdate(messageId, {
            $addToSet: { deletedFor: userId }
        });
        return {
            success: true,
            message: 'Message deleted successfully'
        };
    }

    markAsRead = async (userId, { messageId = null, threadId = null }) => {
        if (!userId) {
            throw new Error('User ID is required');
        }

        if (!messageId && !threadId) {
            throw new Error('Either message ID or thread ID is required');
        }

        // Mark single message as read
        if (messageId) {
            const message = await Message.findById(messageId);
            if (!message) {
                throw new Error('Message not found');
            }

            // Verify user is a member of the thread
            const thread = await Thread.findOne({
                _id: message.threadId,
                'members.userId': userId
            });

            if (!thread) {
                throw new Error('You are not a member of this thread');
            }

            // Check if user already marked as read
            const alreadyRead = message.readBy.some(
                id => id.toString() === userId.toString()
            );

            if (!alreadyRead) {
                message.readBy.push(userId);
                await message.save();
            }

            // Update lastReadAt in thread
            const member = thread.members.find(
                m => m.userId.toString() === userId.toString()
            );
            if (member) {
                member.lastReadAt = new Date();
                await thread.save();
            }

            return {
                success: true,
                message: 'Message marked as read',
                data: {
                    messageId: message._id,
                    readBy: message.readBy
                }
            };
        }

        // Mark all messages in thread as read
        if (threadId) {
            const thread = await Thread.findOne({
                _id: threadId,
                'members.userId': userId
            });

            if (!thread) {
                throw new Error('Thread not found or you are not a member');
            }

            // Find all unread messages in thread (where user is not in readBy)
            const unreadMessages = await Message.find({
                threadId: threadId,
                readBy: { $nin: [userId] }
            });

            // Add user to readBy for all unread messages
            if (unreadMessages.length > 0) {
                await Message.updateMany(
                    {
                        threadId: threadId,
                        readBy: { $nin: [userId] }
                    },
                    {
                        $addToSet: { readBy: userId }
                    }
                );
            }

            // Update lastReadAt in thread
            const member = thread.members.find(
                m => m.userId.toString() === userId.toString()
            );
            if (member) {
                member.lastReadAt = new Date();
                await thread.save();
            }

            return {
                success: true,
                message: 'All messages marked as read',
                data: {
                    threadId: thread._id,
                    markedCount: unreadMessages.length
                }
            };
        }
    }
    getUnreadCount = async (userId, threadId = null) => {
        if (!userId) {
            throw new Error('User ID is required');
        }

        // Build query
        const query = {
            readBy: { $nin: [userId] },
            senderId: { $ne: userId } // Don't count own messages
        };

        if (threadId) {
            // Verify user is a member of the thread
            const thread = await Thread.findOne({
                _id: threadId,
                'members.userId': userId
            });

            if (!thread) {
                throw new Error('Thread not found or you are not a member');
            }

            query.threadId = threadId;
            const count = await Message.countDocuments(query);

            return {
                success: true,
                message: 'Unread count fetched successfully',
                data: {
                    threadId,
                    unreadCount: count
                }
            };
        }

        // Get unread count per thread
        const userThreads = await Thread.find({
            'members.userId': userId
        }).select('_id');

        const threadIds = userThreads.map(t => t._id);
        query.threadId = { $in: threadIds };

        const unreadByThread = await Message.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$threadId',
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalUnread = unreadByThread.reduce((sum, item) => sum + item.count, 0);

        return {
            success: true,
            message: 'Unread counts fetched successfully',
            data: {
                totalUnread,
                byThread: unreadByThread.map(item => ({
                    threadId: item._id,
                    unreadCount: item.count
                }))
            }
        };
    }
}

module.exports = new ChatService();
