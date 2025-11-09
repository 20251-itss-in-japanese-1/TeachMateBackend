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
}

module.exports = new UserController();