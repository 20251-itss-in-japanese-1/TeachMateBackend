const express = require('express');
const userController = require('../controller/user.controller');
const router = express.Router();
const authMiddleware = require('../middleware/AuthMiddleware');
router.get("/me", authMiddleware.isAuth, userController.getMyProfile);
router.post("/me/edit", authMiddleware.isAuth, userController.updateProfile); 
router.get('/teacher/:id', authMiddleware.isAuth, userController.viewTeacherProfile);
router.get('/search', authMiddleware.isAuth, userController.searchUsers);



// notifications routes
router.get('/notifications', authMiddleware.isAuth, userController.getNotifications);
router.put('/notifications/:id/read', authMiddleware.isAuth, userController.markNotificationRead);
router.delete('/notifications/:id', authMiddleware.isAuth, userController.deleteNotification);

// Thêm: group routes
// POST /api/users/groups  { name: string, members: [userId] }
router.post('/groups', authMiddleware.isAuth, userController.createGroup);

// POST /api/users/groups/:id/join  (user joins group)
router.post('/groups/:id/join', authMiddleware.isAuth, userController.joinGroup);

// Report user
router.post('/report/user/:id', authMiddleware.isAuth, userController.reportUser);

// Report group
router.post('/report/groups/:id', authMiddleware.isAuth, userController.reportGroup);

// Groups events
// Create event
router.post('/groups/:id/events', authMiddleware.isAuth, userController.createGroupEvent);

// Get events for group
router.get('/groups/:id/events', authMiddleware.isAuth, userController.getGroupEvents);

// Edit event
router.put('/groups/:groupId/events/:eventId', authMiddleware.isAuth, userController.editGroupEvent);

// Delete event
router.delete('/groups/:groupId/events/:eventId', authMiddleware.isAuth, userController.deleteGroupEvent);

// RSVP event
router.post('/groups/:groupId/events/:eventId/rsvp', authMiddleware.isAuth, userController.rsvpEvent);

module.exports = router;

