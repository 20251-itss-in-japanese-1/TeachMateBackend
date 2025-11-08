const userService = require("../service/user.service");

class UserController {
    getMyProfile = async (req, res) => {
        const userId = req.user.id;
        try {
            const result = await userService.getMyProfile(userId);
            console.log(result);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json({
                message: error.message,
                success: false
            });
        }
    }

    updateProfile = async (req, res) => {
        const userId = req.user && req.user.id;
        try {
            const result = await userService.updateProfile(userId, req.body);
            console.log(result);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json({
                message: error.message,
                success: false
            });
        }
    }

    viewTeacherProfile = async (req, res) => {
        const teacherId = req.params && req.params.id;
        const requesterId = req.user && req.user.id;
        try {
            const result = await userService.getTeacherProfile(teacherId, requesterId);
            console.log(result);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json({
                message: error.message,
                success: false
            });
        }
    }

    searchUsers = async (req, res) => {
        const requesterId = req.user && req.user.id;
        const query = req.query.q || req.query.query || req.query.qry || '';
        try {
            const result = await userService.searchUsers(requesterId, query);
            console.log(result);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json({
                message: error.message,
                success: false
            });
        }
    }

    sendFriendRequest = async (req, res) => {
        const requesterId = req.user && req.user.id;
        const targetId = req.params && req.params.id;
        try {
            const result = await userService.sendFriendRequest(requesterId, targetId);
            console.log(result);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json({
                message: error.message,
                success: false
            });
        }
    }

    // Thêm: hủy (rút) lời mời kết bạn đã gửi
    cancelFriendRequest = async (req, res) => {
        const requesterId = req.user && req.user.id;
        const targetId = req.params && req.params.id;
        try {
            const result = await userService.cancelFriendRequest(requesterId, targetId);
            console.log(result);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json({
                message: error.message,
                success: false
            });
        }
    }

    // Thêm: lấy thông báo của user
    getNotifications = async (req, res) => {
        const userId = req.user && req.user.id;
        const limit = req.query.limit || undefined;
        const skip = req.query.skip || undefined;
        try {
            const result = await userService.getNotifications(userId, { limit, skip });
            console.log(result);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json({ message: error.message, success: false });
        }
    }

    // Thêm: đánh dấu 1 thông báo đã đọc
    markNotificationRead = async (req, res) => {
        const userId = req.user && req.user.id;
        const notificationId = req.params && req.params.id;
        try {
            const result = await userService.markNotificationRead(userId, notificationId);
            console.log(result);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json({ message: error.message, success: false });
        }
    }

    // Thêm: xóa 1 thông báo
    deleteNotification = async (req, res) => {
        const userId = req.user && req.user.id;
        const notificationId = req.params && req.params.id;
        try {
            const result = await userService.deleteNotification(userId, notificationId);
            console.log(result);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json({ message: error.message, success: false });
        }
    }

    createGroup = async (req, res) => {
        const ownerId = req.user && req.user.id;
        const { name, members } = req.body; // members: array of user ids
        try {
            const result = await userService.createGroup(ownerId, name, members);
            console.log(result);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ message: error.message, success: false });
        }
    }

    joinGroup = async (req, res) => {
        const userId = req.user && req.user.id;
        const groupId = req.params && req.params.id;
        try {
            const result = await userService.joinGroup(userId, groupId);
            console.log(result);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ message: error.message, success: false });
        }
    }

    reportUser = async (req, res) => {
        const reporterId = req.user && req.user.id;
        const targetUserId = req.params && req.params.id;
        try {
            const result = await userService.reportUser(reporterId, targetUserId);
            console.log(result);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ message: error.message, success: false });
        }
    }

    reportGroup = async (req, res) => {
        const reporterId = req.user && req.user.id;
        const groupId = req.params && req.params.id;
        try {
            const result = await userService.reportGroup(reporterId, groupId);
            console.log(result);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ message: error.message, success: false });
        }
    }

    // POST /api/users/groups/:id/events
    createGroupEvent = async (req, res) => {
        const creatorId = req.user && req.user.id;
        const groupId = req.params && req.params.id;
        const payload = req.body || {};
        try {
            const result = await userService.createEvent(creatorId, groupId, payload);
            console.log(result);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ message: error.message, success: false });
        }
    }

    // GET /api/users/groups/:id/events
    getGroupEvents = async (req, res) => {
        const groupId = req.params && req.params.id;
        const opts = { limit: req.query.limit, skip: req.query.skip };
        try {
            const result = await userService.getGroupEvents(groupId, opts);
            console.log(result);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ message: error.message, success: false });
        }
    }

    // PUT /api/users/groups/:groupId/events/:eventId
    editGroupEvent = async (req, res) => {
        const userId = req.user && req.user.id;
        const groupId = req.params && req.params.groupId;
        const eventId = req.params && req.params.eventId;
        const payload = req.body || {};
        try {
            const result = await userService.editEvent(userId, groupId, eventId, payload);
            console.log(result);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ message: error.message, success: false });
        }
    }

    // DELETE /api/users/groups/:groupId/events/:eventId
    deleteGroupEvent = async (req, res) => {
        const userId = req.user && req.user.id;
        const groupId = req.params && req.params.groupId;
        const eventId = req.params && req.params.eventId;
        try {
            const result = await userService.deleteEvent(userId, groupId, eventId);
            console.log(result);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ message: error.message, success: false });
        }
    }

    // POST /api/users/groups/:groupId/events/:eventId/rsvp  body: { status: 'yes'|'no'|'maybe' }
    rsvpEvent = async (req, res) => {
        const userId = req.user && req.user.id;
        const groupId = req.params && req.params.groupId;
        const eventId = req.params && req.params.eventId;
        const { status } = req.body || {};
        try {
            const result = await userService.rsvpEvent(userId, groupId, eventId, status);
            console.log(result);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ message: error.message, success: false });
        }
    }
}

module.exports = new UserController();