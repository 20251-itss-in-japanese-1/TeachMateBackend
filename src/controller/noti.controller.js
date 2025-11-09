const notiService = require('../service/noti.service');
class NotiController {
    getNotifications = async (req, res) => {
        const userId = req.user.id;
        try {
            const result = await notiService.getUserNoti(userId);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json({
                message: error.message,
                success: false
            });
        }
    }
    readAllNotifications = async (req, res) => {
        const userId = req.user.id;
        try {
            const result = await notiService.readAllNoti(userId);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json({
                message: error.message,
                success: false
            });
        }
    }
    readSingleNotification = async (req, res) => {
        const userId = req.user.id;
        const {notiId} = req.body;
        try {
            const result = await notiService.readSingleNoti(userId, notiId);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json({
                message: error.message,
                success: false
            });
        }
    }
}

module.exports = new NotiController();