const express = require('express');
const scheduleController = require('../controller/schedule.controller');
const authMiddleware = require('../middleware/AuthMiddleware');
const router = express.Router();

// Create a schedule
router.post('/', authMiddleware.isAuth, scheduleController.createSchedule);

// Get all schedules for user (with optional filters)
router.get('/', authMiddleware.isAuth, scheduleController.getUserSchedules);

// Get schedule by ID
router.get('/:scheduleId', authMiddleware.isAuth, scheduleController.getScheduleById);

// Join a schedule
router.post('/:scheduleId/join', authMiddleware.isAuth, scheduleController.joinSchedule);

// Leave a schedule
router.post('/:scheduleId/leave', authMiddleware.isAuth, scheduleController.leaveSchedule);

// Update schedule status
router.patch('/:scheduleId/status', authMiddleware.isAuth, scheduleController.updateScheduleStatus);

module.exports = router;
