const Thread = require('../model/Thread');
const Message = require('../model/Message');
const Poll = require('../model/Poll');
const ChatSchedule = require('../model/ChatSchedule');
class ThreadService {
    getUserThreads = async (userId) => {
        if(!userId) {
            throw new Error('Unauthorized');
        }
        const threads = await Thread.find({ participants: userId, type: { $in: ['direct_friend', 'group'] }}).sort({ updatedAt: -1 });
        return {
            success: true,
            message: 'Threads fetched successfully',
            data: threads
        }
    }
    getUserThreadStraqngers = async (userId) => {
        if(!userId) {
            throw new Error('Unauthorized');
        }
        const threads = await Thread.find({ participants: userId,  type: 'direct_stranger' }).sort({ updatedAt: -1 });
        return {
            success: true,
            message: 'Stranger Threads fetched successfully',
            data: threads
        }
    }
    getThreadById = async (threadId, userId) => {
        if(!userId) {
            throw new Error('Unauthorized');
        }
        const thread = await Thread.findOne({
            _id: threadId,
            'members.userId': userId
        })
        .populate('lastMessage')
        .populate('members.userId', 'name avatar');
        if (!thread) throw new Error('Thread not found or access denied');
        let messages = await Message.find({ threadId })
            .sort({ createdAt: 1 }) // cũ → mới
            .populate('senderId', 'name avatar')
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
            return m;
        });
        return {
            success: true,
            message: 'Thread fetched successfully',
            data: {
                thread,
                messages
            }
        };
    }
}
module.exports = new ThreadService();