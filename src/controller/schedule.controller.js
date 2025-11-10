const scheduleService = require('../service/schedule.service');

class ScheduleController {
    createSchedule = async (req, res) => {
        const userId = req.user && req.user.id;
        const { threadId, title, description, date, time, participants } = req.body;
        
        try {
            const result = await scheduleService.createSchedule(threadId, userId, {
                title,
                description,
                date,
                time,
                participants
            });
            res.status(201).json(result);
        } catch (error) {
            res.status(400).json({
                message: error.message,
                success: false
            });
        }
    }

    // Join a schedule
    joinSchedule = async (req, res) => {
        const userId = req.user && req.user.id;
        const { scheduleId } = req.params;
        
        try {
            const result = await scheduleService.joinSchedule(scheduleId, userId);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({
                message: error.message,
                success: false
            });
        }
    }

    // Get all schedules that user is participating in
    getUserSchedules = async (req, res) => {
        const userId = req.user && req.user.id;
        const { status, threadId, upcoming } = req.query;
        
        try {
            const filters = {};
            if (status) filters.status = status;
            if (threadId) filters.threadId = threadId;
            if (upcoming) filters.upcoming = upcoming;
            
            const result = await scheduleService.getUserSchedules(userId, filters);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json({
                message: error.message,
                success: false
            });
        }
    }

    // Update schedule status
    updateScheduleStatus = async (req, res) => {
        const userId = req.user && req.user.id;
        const { scheduleId } = req.params;
        const { status } = req.body;
        
        try {
            const result = await scheduleService.updateScheduleStatus(scheduleId, userId, status);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({
                message: error.message,
                success: false
            });
        }
    }

    // Leave a schedule
    leaveSchedule = async (req, res) => {
        const userId = req.user && req.user.id;
        const { scheduleId } = req.params;
        
        try {
            const result = await scheduleService.leaveSchedule(scheduleId, userId);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({
                message: error.message,
                success: false
            });
        }
    }

    // Get schedule by ID
    getScheduleById = async (req, res) => {
        const userId = req.user && req.user.id;
        const { scheduleId } = req.params;
        
        try {
            const result = await scheduleService.getScheduleById(scheduleId, userId);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json({
                message: error.message,
                success: false
            });
        }
    }
}

module.exports = new ScheduleController();
