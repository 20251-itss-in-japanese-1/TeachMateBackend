const ChatSchedule = require('../model/ChatSchedule');
const Thread = require('../model/Thread');
const Message = require('../model/Message');
const User = require('../model/User');
const Notification = require('../model/Notification');

class ScheduleService {
    createSchedule = async (threadId, userId, scheduleData) => {
        const { title, description, date, time, participants } = scheduleData;

        if (!threadId || !userId) {
            throw new Error('Thread ID and user ID are required');
        }

        if (!title || title.trim().length === 0) {
            throw new Error('Schedule title is required');
        }

        if (!date) {
            throw new Error('Schedule date is required');
        }

        if (!time) {
            throw new Error('Schedule time is required');
        }
        const thread = await Thread.findOne({
            _id: threadId,
            'members.userId': userId
        });

        if (!thread) {
            throw new Error('Thread not found or you are not a member');
        }
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        let participantIds = [userId]; // Creator is always a participant
        if (participants && Array.isArray(participants) && participants.length > 0) {
            const uniqueParticipants = [...new Set(participants)];
            for (const participantId of uniqueParticipants) {
                const isMember = thread.members.some(
                    member => member.userId.toString() === participantId.toString()
                );
                if (!isMember) {
                    throw new Error(`User ${participantId} is not a member of this thread`);
                }
                if (!participantIds.includes(participantId)) {
                    participantIds.push(participantId);
                }
            }
        }
        const newSchedule = new ChatSchedule({
            threadId,
            createdBy: userId,
            title: title.trim(),
            description: description ? description.trim() : '',
            date: new Date(date),
            time: time.trim(),
            participants: participantIds,
            status: 'scheduled',
            createdAt: new Date()
        });

        await newSchedule.save();
        const scheduleMessage = new Message({
            threadId,
            senderId: userId,
            contentType: 'schedule',
            content: `Schedule: ${title}`,
            scheduleId: newSchedule._id,
            reactions: [],
            createdAt: new Date()
        });

        await scheduleMessage.save();
        thread.lastMessage = scheduleMessage._id;
        thread.updatedAt = new Date();
        await thread.save();
        const populatedSchedule = await ChatSchedule.findById(newSchedule._id)
            .populate('createdBy', 'name avatarUrl email')
            .populate('participants', 'name avatarUrl email');

        const populatedMessage = await Message.findById(scheduleMessage._id)
            .populate('senderId', 'name avatarUrl email');

        // Create notifications for participants (except creator)
        const otherParticipants = participantIds.filter(
            pId => pId.toString() !== userId.toString()
        );
        
        if (otherParticipants.length > 0) {
            const notifications = otherParticipants.map(participantId => ({
                userId: participantId,
                type: 'schedule',
                title: `New schedule: ${title}`,
                body: `${user.name} created a schedule on ${new Date(date).toLocaleDateString()}`,
                refId: newSchedule._id,
                refType: 'schedule',
                read: false,
                createdAt: new Date()
            }));
            
            await Notification.insertMany(notifications);
        }

        return {
            success: true,
            message: 'Schedule created successfully',
            data: {
                schedule: populatedSchedule,
                message: populatedMessage
            }
        };
    }

    /**
     * Join a schedule
     * @param {string} scheduleId - The ID of the schedule
     * @param {string} userId - The ID of the user joining
     * @returns {Object} - Success response with updated schedule
     */
    joinSchedule = async (scheduleId, userId) => {
        if (!scheduleId || !userId) {
            throw new Error('Schedule ID and user ID are required');
        }

        // Find the schedule
        const schedule = await ChatSchedule.findById(scheduleId);
        if (!schedule) {
            throw new Error('Schedule not found');
        }

        // Check if schedule is cancelled
        if (schedule.status === 'cancelled') {
            throw new Error('Cannot join a cancelled schedule');
        }

        // Check if schedule is done
        if (schedule.status === 'done') {
            throw new Error('Cannot join a completed schedule');
        }

        // Verify user is a member of the thread
        const thread = await Thread.findOne({
            _id: schedule.threadId,
            'members.userId': userId
        });

        if (!thread) {
            throw new Error('You are not a member of this thread');
        }

        // Check if user is already a participant
        const isAlreadyParticipant = schedule.participants.some(
            participantId => participantId.toString() === userId.toString()
        );

        if (isAlreadyParticipant) {
            throw new Error('You are already a participant of this schedule');
        }
        schedule.participants.push(userId);
        await schedule.save();
        const populatedSchedule = await ChatSchedule.findById(schedule._id)
            .populate('createdBy', 'name avatarUrl email')
            .populate('participants', 'name avatarUrl email');
        const joiningUser = await User.findById(userId);
        await Notification.create({
            userId: schedule.createdBy,
            type: 'schedule',
            title: `${joiningUser.name} joined your schedule`,
            body: `Schedule: ${schedule.title}`,
            refId: schedule._id,
            refType: 'schedule',
            read: false,
            createdAt: new Date()
        });

        return {
            success: true,
            message: 'Successfully joined the schedule',
            data: populatedSchedule
        };
    }

    /**
     * Get all schedules that a user is participating in
     * @param {string} userId - The ID of the user
     * @param {Object} filters - Optional filters (status, threadId, upcoming)
     * @returns {Object} - Success response with schedules
     */
    getUserSchedules = async (userId, filters = {}) => {
        if (!userId) {
            throw new Error('User ID is required');
        }

        // Verify user exists
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Build query: when threadId is provided, return schedules of that thread
        // (visible to any thread member), otherwise return schedules the user
        // participates in.
        let query = {};

        if (filters.threadId) {
            const thread = await Thread.findOne({
                _id: filters.threadId,
                'members.userId': userId
            });

            if (!thread) {
                throw new Error('Thread not found or you are not a member');
            }

            query = { threadId: filters.threadId };
        } else {
            query = { participants: userId };
        }

        // Apply filters
        if (filters.status) {
            query.status = filters.status;
        }

        if (filters.upcoming === true || filters.upcoming === 'true') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            query.date = { $gte: today };
            query.status = 'scheduled';
        }

        // Find schedules
        const schedules = await ChatSchedule.find(query)
            .populate('createdBy', 'name avatarUrl email')
            .populate('participants', 'name avatarUrl email')
            .populate('threadId', 'name type avatar')
            .sort({ date: 1, time: 1 }); // Sort by date and time ascending

        return {
            success: true,
            message: 'Schedules fetched successfully',
            data: schedules
        };
    }

    /**
     * Update schedule status
     * @param {string} scheduleId - The ID of the schedule
     * @param {string} userId - The ID of the user
     * @param {string} status - New status (cancelled, done)
     * @returns {Object} - Success response
     */
    updateScheduleStatus = async (scheduleId, userId, status) => {
        if (!scheduleId || !userId) {
            throw new Error('Schedule ID and user ID are required');
        }

        if (!['cancelled', 'done', 'scheduled'].includes(status)) {
            throw new Error('Invalid status. Must be: scheduled, cancelled, or done');
        }

        const schedule = await ChatSchedule.findById(scheduleId);
        if (!schedule) {
            throw new Error('Schedule not found');
        }

        // Only creator can update status
        if (schedule.createdBy.toString() !== userId.toString()) {
            throw new Error('Only the schedule creator can update its status');
        }

        schedule.status = status;
        await schedule.save();

        const populatedSchedule = await ChatSchedule.findById(schedule._id)
            .populate('createdBy', 'name avatarUrl email')
            .populate('participants', 'name avatarUrl email');

        // Create notifications for all participants (except creator)
        const otherParticipants = schedule.participants.filter(
            pId => pId.toString() !== userId.toString()
        );
        
        if (otherParticipants.length > 0) {
            const creator = await User.findById(userId);
            let notificationTitle = '';
            let notificationBody = '';
            
            if (status === 'cancelled') {
                notificationTitle = `Schedule cancelled`;
                notificationBody = `${creator.name} cancelled the schedule: ${schedule.title}`;
            } else if (status === 'done') {
                notificationTitle = `Schedule completed`;
                notificationBody = `${creator.name} marked the schedule as done: ${schedule.title}`;
            }
            
            if (notificationTitle) {
                const notifications = otherParticipants.map(participantId => ({
                    userId: participantId,
                    type: 'schedule',
                    title: notificationTitle,
                    body: notificationBody,
                    refId: schedule._id,
                    refType: 'schedule',
                    read: false,
                    createdAt: new Date()
                }));
                
                await Notification.insertMany(notifications);
            }
        }

        return {
            success: true,
            message: 'Schedule status updated successfully',
            data: populatedSchedule
        };
    }

    /**
     * Leave a schedule
     * @param {string} scheduleId - The ID of the schedule
     * @param {string} userId - The ID of the user leaving
     * @returns {Object} - Success response
     */
    leaveSchedule = async (scheduleId, userId) => {
        if (!scheduleId || !userId) {
            throw new Error('Schedule ID and user ID are required');
        }

        const schedule = await ChatSchedule.findById(scheduleId);
        if (!schedule) {
            throw new Error('Schedule not found');
        }

        // Creator cannot leave their own schedule
        if (schedule.createdBy.toString() === userId.toString()) {
            throw new Error('Schedule creator cannot leave. Please cancel the schedule instead');
        }

        // Check if user is a participant
        const participantIndex = schedule.participants.findIndex(
            participantId => participantId.toString() === userId.toString()
        );

        if (participantIndex === -1) {
            throw new Error('You are not a participant of this schedule');
        }

        // Remove user from participants
        schedule.participants.splice(participantIndex, 1);
        await schedule.save();

        // Create notification for schedule creator
        const leavingUser = await User.findById(userId);
        await Notification.create({
            userId: schedule.createdBy,
            type: 'schedule',
            title: `${leavingUser.name} left your schedule`,
            body: `Schedule: ${schedule.title}`,
            refId: schedule._id,
            refType: 'schedule',
            read: false,
            createdAt: new Date()
        });

        return {
            success: true,
            message: 'Successfully left the schedule'
        };
    }

    /**
     * Get schedule by ID
     * @param {string} scheduleId - The ID of the schedule
     * @param {string} userId - The ID of the user requesting
     * @returns {Object} - Success response with schedule details
     */
    getScheduleById = async (scheduleId, userId) => {
        if (!scheduleId || !userId) {
            throw new Error('Schedule ID and user ID are required');
        }

        const schedule = await ChatSchedule.findById(scheduleId)
            .populate('createdBy', 'name avatarUrl email')
            .populate('participants', 'name avatarUrl email')
            .populate('threadId', 'name type avatar');

        if (!schedule) {
            throw new Error('Schedule not found');
        }

        // Verify user has access (is member of the thread)
        const thread = await Thread.findOne({
            _id: schedule.threadId,
            'members.userId': userId
        });

        if (!thread) {
            throw new Error('You do not have access to this schedule');
        }

        return {
            success: true,
            message: 'Schedule fetched successfully',
            data: schedule
        };
    }
}

module.exports = new ScheduleService();