const mongoose = require('mongoose');
const User = require('../model/User')
const FriendRequest = require('../model/FriendRequest');
const Notification = require('../model/Notification');
const Socket = require('../socket/socket');
const Thread = require('../model/Thread');
class FriendService {
    sendFriendRequest = async (requesterId, targetId) => {
        if (!requesterId) {
            throw new Error('Unauthorized');
        }
        if (!targetId) {
            throw new Error('Target user id is required');
        }
        if (!mongoose.Types.ObjectId.isValid(targetId)) {
            throw new Error('Invalid target id');
        }
        if (String(requesterId) === String(targetId)) {
            throw new Error('Cannot send friend request to yourself');
        }

        const [requester, target] = await Promise.all([
            User.findById(requesterId),
            User.findById(targetId)
        ]);

        if (!requester || !target) {
            throw new Error('User not found');
        }
        if (requester.friends.includes(targetId)){
            throw new Error("Already Friends");
        }
        const existRequest = await FriendRequest.findOne({
            fromUserId: requesterId,
            toUserId: targetId,
            status: 'pending'
        });
        if (existRequest) {
            throw new Error('Friend request already sent');
        }
		const newRequest = await FriendRequest.create({
			fromUserId: requesterId,
			toUserId: targetId,
			status: 'pending'
		});
		const notification = await Notification.create({
			userId: targetId,
			type: 'friend_request',
			title: 'New friend request',
			body: `${requester.name || 'Someone'} sent you a friend request.`,
			refId: newRequest._id,
			refType: 'request'
		});
        const io = Socket.getIO();
        const onlineUsers = Socket.getOnlineUsers();
        const targetSocketId = onlineUsers.get(targetId.toString());
        if (targetSocketId) {
			io.to(targetSocketId).emit('notification:new', notification);
		}
        return { success: true, message: 'Friend request sent' };
    }
    acceptFriendRequest = async (requestId, userId) => {
        const request = await FriendRequest.findById(requestId);
        if (!request) throw new Error('Request not found');
		if (String(request.toUserId) !== String(userId)) throw new Error('Unauthorized');
        if (request.status !== 'pending') {
			throw new Error('Request already processed');
		}
        request.status = 'approved';
		request.decidedAt = new Date();
		await request.save();
        await Promise.all([
			User.findByIdAndUpdate(request.fromUserId, {
				$addToSet: { friends: request.toUserId }
			}),
			User.findByIdAndUpdate(request.toUserId, {
				$addToSet: { friends: request.fromUserId }
			})
		]);
        const notification = await Notification.create({
			userId: request.fromUserId,
			type: 'system',
			title: 'Friend request accepted',
			body: 'Your friend request has been accepted!',
			refId: request._id,
			refType: 'request'
		});
        let thread = await Thread.findOne({
            type: 'direct_stranger',
            memberHash: {
                $in: [
                    `${request.fromUserId}_${request.toUserId}`,
                    `${request.toUserId}_${request.fromUserId}`
                ]
            }
        });
        if (thread) {
            thread.type = 'direct_friend';
            await thread.save();
        }
        return { success: true, message: 'Friend request accepted' };
    }
    rejectFriendRequest = async (requestId, userId) => {
        const request = await FriendRequest.findById(requestId);
		if (!request) throw new Error('Request not found');
		if (String(request.toUserId) !== String(userId)) throw new Error('Unauthorized');

		if (request.status !== 'pending') {
			throw new Error('Request already processed');
		}
        request.status = 'rejected';
        request.decidedAt = new Date();
		await request.save();
        return { success: true, message: 'Friend request rejected' };
    }
    getAllFriends = async (userId) => {
        if (!userId) throw new Error("invalid token");
        const rs = await User.findById(userId).select('friends').populate('friends');
        return {
            success: true,
            message: "Ok",
            data: {
                friends: rs.friends
            }
        }
    }
    friendSuggestions = async(userId, page=1, limit=10) => {
        const user = await User.findById(userId);
        if(!user) {
            throw new Error('User not found');
        }
        const relatedRequests = await FriendRequest.find({
            $or: [{ fromUserId: userId }, { toUserId: userId }],
            status: { $in: ['pending', 'approved'] } 
        }).select('fromUserId toUserId');
        const relatedUserIds = relatedRequests.map(req =>
            req.fromUserId.toString() === userId.toString()
            ? req.toUserId
            : req.fromUserId
        );
        const excludeIds = [...user.friends, user._id, ...relatedUserIds];
        const skip = (page - 1) * limit;
        const query = {
            _id: { $nin: excludeIds },
        };
        const total = await User.countDocuments(query);
        const suggestions = await User.find(query)
            .select('-password')
            .skip(skip) 
            .limit(limit);
        return {
            success: true,
            message: 'Teachers fetched successfully',
            meta: {
                page: page,
                limit: limit,
                total: total,
            },
            data: suggestions
        }
    }
    getFriendRequests = async(userId) => {
        if (!userId) {
            throw new Error('Unauthorized');
        }
        const requests = await FriendRequest.find({toUserId: userId, status: 'pending'}).populate('fromUserId', '-password');
        return {
            success: true,
            message: 'Friend requests fetched successfully',
            data: requests
        }
    }
}


module.exports = new FriendService();