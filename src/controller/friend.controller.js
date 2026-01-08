const friendService = require('../service/friend.service');
class FriendController {
    sendFriendRequest = async (req, res) => {
        const requesterId = req.user.id;
        const {targetId} = req.body;
        try {
            const result = await friendService.sendFriendRequest(requesterId, targetId);
            console.log(result);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json({
                message: error.message,
                success: false
            });
        }
    }
    acceptFriendRequest = async (req, res) => {
        const {requestId} =  req.body;
        const userId = req.user.id;
        try {
            const result = await friendService.acceptFriendRequest(requestId, userId);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json({
                message: error.message,
                success: false
            });
        }
    }
    rejectFriendRequest = async (req, res) => {
        const {requestId} =  req.body;
        const userId = req.user.id;
        try {
            const result = await friendService.rejectFriendRequest(requestId, userId);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json({
                message: error.message,
                success: false
            });
        }
    }
    getAllFriends = async (req, res) => {
        const userId = req.user.id;
        try {
            const result = await friendService.getAllFriends(userId);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json({
                message: error.message,
                success: false
            });
        }
    }
    friendSuggestions = async (req, res) => {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const teacher_name = req.query.teacher_name || '';
        const nationality = req.query.nationality || '';
        const years_of_experience = req.query.years_of_experience || '';
        const subjects = req.query.subjects || '';
        try {
            const result = await friendService.friendSuggestions(userId, page, limit, teacher_name, nationality, years_of_experience, subjects);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json({
                message: error.message,
                success: false
            });
        }
    }
    getFriendRequests = async (req, res) => {
        const userId = req.user.id;
        try {
            const result = await friendService.getFriendRequests(userId);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json({
                message: error.message,
                success: false
            });
        }
    }
}

module.exports = new FriendController();