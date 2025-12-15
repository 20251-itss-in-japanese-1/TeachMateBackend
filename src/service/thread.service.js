const Thread = require('../model/Thread');
const Message = require('../model/Message');
const Poll = require('../model/Poll');
const ChatSchedule = require('../model/ChatSchedule');
const mongoose = require('mongoose');
class ThreadService {
    getUserThreads = async (userId) => {
        if (!userId) {
            throw new Error('Unauthorized');
        }

        const threads = await Thread.find({
            'members.userId': userId,
            type: { $in: ['direct_friend', 'group', 'direct_stranger'] }
        })
        .sort({ updatedAt: -1 })
        .populate({
            path: 'lastMessage',
            select: 'content contentType createdAt senderId readBy',
            populate: {
                path: 'senderId',
                select: 'name avatarUrl'
            }
        })
        .populate('createdBy', 'name avatar email avatarUrl')
        .populate('members.userId', 'name avatar email avatarUrl')
        .lean();

        // Add unread count for each thread
        const threadsWithUnread = await Promise.all(
            threads.map(async (thread) => {
                const unreadCount = await Message.countDocuments({
                    threadId: thread._id,
                    readBy: { $nin: [userId] },
                    senderId: { $ne: userId }
                });

                // Check if last message is read by current user
                let isLastMessageRead = true;
                if (thread.lastMessage) {
                    isLastMessageRead = thread.lastMessage.readBy?.some(
                        id => id.toString() === userId.toString()
                    ) || thread.lastMessage.senderId._id.toString() === userId.toString();
                }

                return {
                    ...thread,
                    unreadCount,
                    isLastMessageRead
                };
            })
        );

        return {
            success: true,
            message: 'Threads fetched successfully',
            data: threadsWithUnread
        };
    };
    getUserThreadStrangers = async (userId) => {
        if(!userId) {
            throw new Error('Unauthorized');
        }
        
        const threads = await Thread.find({ 
            'members.userId': userId,  
            type: 'direct_stranger' 
        })
        .sort({ updatedAt: -1 })
        .populate({
            path: 'lastMessage',
            select: 'content contentType createdAt senderId readBy',
            populate: {
                path: 'senderId',
                select: 'name avatarUrl'
            }
        })
        .populate('createdBy', 'name avatar email avatarUrl')
        .populate('members.userId', 'name avatar email avatarUrl')
        .lean();

        // Add unread count for each thread
        const threadsWithUnread = await Promise.all(
            threads.map(async (thread) => {
                const unreadCount = await Message.countDocuments({
                    threadId: thread._id,
                    readBy: { $nin: [userId] },
                    senderId: { $ne: userId }
                });

                // Check if last message is read by current user
                let isLastMessageRead = true;
                if (thread.lastMessage) {
                    isLastMessageRead = thread.lastMessage.readBy?.some(
                        id => id.toString() === userId.toString()
                    ) || thread.lastMessage.senderId._id.toString() === userId.toString();
                }

                return {
                    ...thread,
                    unreadCount,
                    isLastMessageRead
                };
            })
        );

        return {
            success: true,
            message: 'Stranger Threads fetched successfully',
            data: threadsWithUnread
        };
    }
    getThreadById = async (threadId, userId) => {
        if(!userId) {
            throw new Error('Unauthorized');
        }
        const thread = await Thread.findOne({
            _id: threadId,
            'members.userId': userId
        })
        .populate('members.userId', 'name avatarUrl email')
        .lean();
        
        if (!thread) throw new Error('Thread not found or access denied');
        await Message.updateMany(
            {
                threadId: threadId,
                senderId: { $ne: userId },
                readBy: { $nin: [userId] }
            },
            {
                $addToSet: { readBy: userId }
            }
        );
        await Thread.updateOne(
            { _id: threadId, 'members.userId': userId },
            { $set: { 'members.$.lastReadAt': new Date() } }
        );
        
        let messages = await Message.find({
                threadId,
                deletedFor: { $ne: userId }
            })
            .sort({ createdAt: 1 }) // cũ → mới
            .populate('senderId', 'name avatar avatarUrl email')
            .populate('readBy', 'name avatarUrl')
            .lean(); 
            
        const scheduleIds = messages.filter(m => m.contentType === 'schedule').map(m => m.scheduleId).filter(Boolean);
        const pollIds = messages.filter(m => m.contentType === 'poll').map(m => m.pollId).filter(Boolean);
        
        const schedules = await ChatSchedule.find({ _id: { $in: scheduleIds } }).lean();
        const polls = await Poll.find({ _id: { $in: pollIds } }).lean();
        
        const scheduleMap = Object.fromEntries(schedules.map(s => [s._id.toString(), s]));
        const pollMap = Object.fromEntries(polls.map(p => [p._id.toString(), p]));
        
        messages = messages.map(m => {
            if (m.contentType === 'schedule' && m.scheduleId) {
                m.schedule = scheduleMap[m.scheduleId.toString()] || null;
            }
            if (m.contentType === 'poll' && m.pollId) {
                m.poll = pollMap[m.pollId.toString()] || null;
            }
            if (m.senderId._id.toString() !== userId.toString()) {
                if (!m.readBy.some(reader => reader._id.toString() === userId.toString())) {
                    m.readBy.push({ _id: userId, name: '', avatarUrl: '' });
                }
                m.isReadByMe = true;
            } else {
                m.isReadByMe = m.readBy.some(reader => reader._id.toString() === userId.toString());
            }
            return m;
        });
        const threadInfo = {
            _id: thread._id,
            name: thread.name,
            avatar: thread.avatar,
            type: thread.type,
            members: thread.members.map(m => ({
                userId: m.userId._id,
                name: m.userId.name,
                avatarUrl: m.userId.avatarUrl,
                email: m.userId.email,
                role: m.role
            }))
        };
        
        return {
            success: true,
            message: 'Thread fetched successfully',
            data: {
                thread: threadInfo,
                messages
            }
        };
    }
    createThreadGroup = async (userId, name, memberIds) => {
        console.log('[ThreadService] createThreadGroup called with:', { userId, name, memberIds });
        if (!userId) {
            throw new Error('Unauthorized');
        }
        if (!name || !memberIds) {
            throw new Error('Invalid input data');
        }
        const members = memberIds.map(id => ({ userId: id, role: 'member' }));
        members.push({ userId, role: 'admin' });
        const newThread = new Thread({
            name,
            members,
            type: 'group',
            createdBy: userId,
        });
        await newThread.save();
        return {
            success: true,
            message: 'Group thread created successfully',
            data: newThread
        };
    }
    outThreadGroup = async (threadId, userId) => {
        if (!userId) {
            throw new Error('Unauthorized');
        }
        const thread = await Thread.findById(threadId);
        if (!thread) {
            throw new Error('Thread not found');
        }
        const isMember = thread.members.some(m => m.userId.toString() === userId.toString());
        if (!isMember) {
            throw new Error('You are not a member of this thread');
        }
        thread.members = thread.members.filter(m => m.userId.toString() !== userId.toString());
        await thread.save();
        return {
            success: true,
            message: 'You have left the group thread successfully',
            data: null
        };
    }
    getAttachmenThread = async (userId, threadId) => {
        if (!userId) {
            throw new Error('Unauthorized');
        }
        if (!mongoose.Types.ObjectId.isValid(threadId)) {
            throw new Error('Invalid threadId');
        }
        const thread = await Thread.findOne({
            _id: threadId,
            'members.userId': userId
        }).lean();
        if (!thread) {
            throw new Error('Thread not found or access denied');
        }
        const messages = await Message.find({ threadId }, { attachments: 1, _id: 0 }).lean();
        const result = {
            link: [],
            image: [],
            file: []
        };
        messages.forEach(msg => {
            (msg.attachments || []).forEach(att => {
                if (att.kind === 'link') result.link.push(att);
                else if (att.kind === 'image') result.image.push(att);
                else if (att.kind === 'file') result.file.push(att);
            });
        });
        return {
            success: true,
            message: 'Attachments fetched successfully',
            data: result
        };
    }
}
module.exports = new ThreadService();