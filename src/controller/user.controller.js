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
}

module.exports = new UserController();