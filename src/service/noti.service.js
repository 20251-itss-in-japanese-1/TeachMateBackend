const User = require('../model/User');
const Notification = require('../model/Notification');

class NotiService {
    getUserNoti = async (userId) => {
        if (!userId){
            throw new Error('Unauthorized');
        }
        const user = await User.findById(userId);
        if (!user){
            throw new Error('User not found');
        }
        const notifications = await Notification.find({userId: userId}).sort({createdAt: -1});
        return {
            success: true,
            message: 'Notifications fetched successfully',
            data: notifications
        };
    }
    getNotiNotRead = async (userId) => {
        if (!userId){
            throw new Error('Unauthorized');
        }
        const user = await User.findById(userId);
        if (!user){
            throw new Error('User not found');
        }
        const countNotRead = await Notification.countDocuments({userId: userId, read: false});
        return {
            success: true,
            message: 'Count of unread notifications fetched successfully',
            data: {
                count: countNotRead
            }
        };
    }
    readAllNoti = async (userId) => {
        if (!userId){
            throw new Error('Unauthorized');
        }
        const user = await User.findById(userId);
        if (!user){
            throw new Error('User not found');
        }
        await Notification.updateMany({userId: userId, read: false}, {read: true});
        return {
            success: true,
            message: 'All notifications marked as read',
        };
    }
    readSingleNoti = async (userId, notiId) => {
        if (!userId){
            throw new Error('Unauthorized');
        }
        const user = await User.findById(userId);
        if (!user){
            throw new Error('User not found');
        }
        const notification = await Notification.findOne({_id: notiId, userId: userId});
        if (!notification){
            throw new Error('Notification not found');
        }
        notification.read = true;
        await notification.save();
        return {
            success: true,
            message: 'Notification marked as read',
        };
    }
}
module.exports = new NotiService();