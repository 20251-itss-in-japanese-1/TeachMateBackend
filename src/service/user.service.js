const User = require('../model/User');
const Notification = require('../model/Notification');
const Socket = require('../socket/socket');
const FriendRequest = require('../model/FriendRequest');
class UserService {
	async getMyProfile(userId) {
		const user = await User.findById(userId).select('-password');
		if (!user) {
			throw new Error('User not found');
		}
		return {
			success: true,
			message: 'User profile fetched successfully',
			data: user
		};
	}
	async updateProfile(userId, updateData) {
		if (!userId) {
			throw new Error('Unauthorized');
		}

		const user = await User.findById(userId);
		if (!user) {
			throw new Error('User not found');
		}
		const allowed = ['fullName', 'nationality', 'experience', 'bio', 'specialties_major', 'specialties_subject'];
		for (const key of allowed) {
			if (updateData[key] !== undefined) {
				if (key === 'specialties_major') {
					let sp = updateData.specialties_major;
					if (typeof sp === 'string') {
						sp = sp.split(',').map(s => s.trim()).filter(Boolean);
					}
					if (!Array.isArray(sp)) {
						throw new Error('Invalid specialties format');
					}
					user.specialties_major = sp;
				} else if (key === 'specialties_subject') {
					let sp = updateData.specialties_subject;
					if (typeof sp === 'string') {
						sp = sp.split(',').map(s => s.trim()).filter(Boolean);
					}
					if (!Array.isArray(sp)) {
						throw new Error('Invalid specialties format');
					}
					user.specialties_subject = sp;
				} else {
					user[key] = updateData[key];
				}
			}
		}

		await user.save();

		const safeUser = user.toObject();
		delete safeUser.password;

		return {
			success: true,
			message: 'User profile updated successfully',
			data: safeUser
		};
	}
	async getTeacherProfile(teacherId, requesterId) {
		if (!teacherId) {
			throw new Error('Teacher id is required');
		}
		const teacher = await User.findById(teacherId).select('-password');
		if (!teacher) {
			throw new Error('Teacher not found');
		}
		let isFriend = false;
		if (requesterId && Array.isArray(teacher.friends)) {
			isFriend = teacher.friends.map(String).includes(String(requesterId));
		}
		const profile = {
			id: teacher._id,
			avatar: teacher.avatar || null,
			fullName: teacher.fullName || teacher.name || null,
			nationality: teacher.nationality || null,
			experience: teacher.experience || null, 
			specialties_major: Array.isArray(teacher.specialties_major) ? teacher.specialties_major : (teacher.specialties_major ? [teacher.specialties_major] : []),
			specialties_subject: Array.isArray(teacher.specialties_subject) ? teacher.specialties_subject : (teacher.specialties_subject ? [teacher.specialties_subject] : []),
			interests: Array.isArray(teacher.interests) ? teacher.interests : (teacher.interests ? [teacher.interests] : []),
			bio: teacher.bio || null,
			isFriend
		};

		return {
			success: true,
			message: 'Teacher profile fetched successfully',
			data: profile
		};
	}

	async searchUsers(requesterId, query) {
		if (!requesterId) {
			throw new Error('Unauthorized');
		}
		if (!query || String(query).trim() === '') {
			return { success: true, message: 'No query provided', data: [] };
		}
		const q = String(query).trim();
		const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
		const users = await User.find({
			_id: { $ne: requesterId },
			$or: [{ name: regex }, { email: regex }]
		})
			.select('-password')
			.limit(20)
			.lean();

		return {
			success: true,
			message: 'Search results',
			data: users
		};
	}

	async cancelFriendRequest(requesterId, targetId) {
		if (!requesterId) throw new Error('Unauthorized');
		if (!targetId) throw new Error('Target id is required');
		if (!mongoose.Types.ObjectId.isValid(targetId)) throw new Error('Invalid target id');
		if (String(requesterId) === String(targetId)) {
			throw new Error('Cannot cancel friend request to yourself');
		}
		const [requester, target] = await Promise.all([
			User.findById(requesterId),
			User.findById(targetId)
		]);
		if (!requester || !target) {
			throw new Error('User not found');
		}
		const existingRequest = await FriendRequest.findOne({
			fromUserId: requesterId,
			toUserId: targetId,
			status: 'pending'
		});
		if (!existingRequest) {
			throw new Error('No pending friend request found to cancel');
		}
		await FriendRequest.deleteOne({ _id: existingRequest._id });
		return {
			success: true,
			message: 'Friend request cancelled',
		};
	}
	// Thêm: tạo nhóm
	async createGroup(ownerId, name, memberIds = []) {
		if (!ownerId) throw new Error('Unauthorized');
		if (!name || String(name).trim() === '') throw new Error('Group name is required');
		name = String(name).trim();
		if (name.length > 50) throw new Error('Group name must be 50 characters or less');

		// Normalize memberIds into an array of string ids
		let memberArray = [];
		if (Array.isArray(memberIds)) {
			memberArray = memberIds.map(String).filter(Boolean);
		} else if (typeof memberIds === 'string') {
			// Accept JSON array string like '["id1","id2"]' or comma list
			const trimmed = memberIds.trim();
			if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
				try {
					const parsed = JSON.parse(trimmed);
					if (Array.isArray(parsed)) memberArray = parsed.map(String).filter(Boolean);
					else memberArray = [];
				} catch (e) {
					// fallback to comma split
					memberArray = trimmed.split(',').map(s => s.replace(/['"\[\]]/g, '').trim()).filter(Boolean);
				}
			} else {
				memberArray = memberIds.split(',').map(s => s.trim()).filter(Boolean);
			}
		} else if (memberIds && typeof memberIds === 'object') {
			if (memberIds._id) memberArray = [String(memberIds._id)];
			else if (memberIds.id) memberArray = [String(memberIds.id)];
			else memberArray = [];
		} else {
			memberArray = [];
		}

		// remove duplicates and owner
		const uniqIds = Array.from(new Set(memberArray)).filter(id => String(id) !== String(ownerId));

		// keep only syntactically valid ObjectIds for storing in group
		const validIds = uniqIds.filter(id => mongoose.Types.ObjectId.isValid(id));

		// Build final members list including owner (store as ObjectId) - use 'new' here
		const members = [new mongoose.Types.ObjectId(ownerId), ...validIds.map(id => new mongoose.Types.ObjectId(id))];

		const group = await Group.create({
			name,
			owner: new mongoose.Types.ObjectId(ownerId),
			members
		});

		// Find which of the validIds actually exist in DB to send notifications only to them
		const existingUsers = await User.find({ _id: { $in: validIds } }).select('_id name email').lean();
		const existingIds = existingUsers.map(u => String(u._id));

		// Get inviter name once
		const inviter = await User.findById(ownerId).select('name').lean();
		const inviterName = inviter?.name || inviter?.fullName || 'Someone';

		// Notify invited members that exist
		for (const mid of existingIds) {
			try {
				await this.createNotification(mid, {
					type: 'group',
					title: 'Group Invitation',
					message: `${inviterName} has invited you to group "${name}"`,
					data: { groupId: group._id, from: ownerId, refType: 'group', refId: group._id }
				});
			} catch (err) {
				console.warn('Failed to create group invite notification for', mid, err.message);
			}
		}

		return { success: true, message: 'Group created', data: group };
	}

	// Thêm: tham gia nhóm (join)
	async joinGroup(userId, groupId) {
		if (!userId) throw new Error('Unauthorized');
		if (!groupId) throw new Error('Group id is required');
		if (!mongoose.Types.ObjectId.isValid(groupId)) throw new Error('Invalid group id');

		const group = await Group.findById(groupId);
		if (!group) throw new Error('Group not found');

		// Already member?
		if (group.members.map(String).includes(String(userId))) {
			throw new Error('User already a member of the group');
		}

		// push as ObjectId (use new)
		group.members.push(new mongoose.Types.ObjectId(userId));
		await group.save();

		// Notify owner that user joined
		try {
			await this.createNotification(group.owner, {
				type: 'group',
				title: 'Member Joined',
				message: `User đã tham gia nhóm "${group.name}"`,
				data: { groupId: group._id, from: userId, refType: 'group', refId: group._id }
			});
		} catch (err) {
			console.warn('Failed to notify owner about join:', err.message);
		}

		return { success: true, message: 'Joined group', data: group };
	}

	// Thêm: báo cáo user
	async reportUser(reporterId, targetUserId) {
		if (!reporterId) throw new Error('Unauthorized');
		if (!targetUserId) throw new Error('Target user id is required');
		if (!mongoose.Types.ObjectId.isValid(targetUserId)) throw new Error('Invalid target id');

		const [reporter, target] = await Promise.all([
			User.findById(reporterId).select('name email'),
			User.findById(targetUserId).select('name email')
		]);

		if (!reporter) throw new Error('Reporter not found');
		if (!target) throw new Error('Target user not found');

		const report = await Report.create({
			reporter: reporterId,
			targetType: 'user',
			targetId: targetUserId
		});

		// notify admins
		const admins = await User.find({ role: 'admin' }).select('_id name').lean();
		for (const adm of admins) {
			try {
				await this.createNotification(adm._id, {
					type: 'report',
					title: 'New user report',
					message: `${reporter.name || reporter.email} reported user ${target.name || target.email}`,
					data: { reportId: report._id, targetType: 'user', targetId: targetUserId, reporterId }
				});
			} catch (e) {
				console.warn('Failed to notify admin about user report', adm._id, e.message);
			}
		}

		// confirm to reporter
		try {
			await this.createNotification(reporterId, {
				type: 'system',
				title: 'Report submitted',
				message: `Your report against ${target.name || target.email} has been submitted`,
				data: { reportId: report._id }
			});
		} catch (e) {
			console.warn('Failed to notify reporter about report submission', e.message);
		}

		return { success: true, message: 'Report submitted', data: report };
	}

	// Thêm: báo cáo group
	async reportGroup(reporterId, groupId) {
		if (!reporterId) throw new Error('Unauthorized');
		if (!groupId) throw new Error('Group id is required');
		if (!mongoose.Types.ObjectId.isValid(groupId)) throw new Error('Invalid group id');

		const [reporter, group] = await Promise.all([
			User.findById(reporterId).select('name email'),
			Group.findById(groupId).select('name owner').lean()
		]);

		if (!reporter) throw new Error('Reporter not found');
		if (!group) throw new Error('Group not found');

		const report = await Report.create({
			reporter: reporterId,
			targetType: 'group',
			targetId: groupId
		});

		// notify admins
		const admins = await User.find({ role: 'admin' }).select('_id name').lean();
		for (const adm of admins) {
			try {
				await this.createNotification(adm._id, {
					type: 'report',
					title: 'New group report',
					message: `${reporter.name || reporter.email} reported group "${group.name}"`,
					data: { reportId: report._id, targetType: 'group', targetId: groupId, reporterId }
				});
			} catch (e) {
				console.warn('Failed to notify admin about group report', adm._id, e.message);
			}
		}

		// confirm to reporter
		try {
			await this.createNotification(reporterId, {
				type: 'system',
				title: 'Report submitted',
				message: `Your report against group "${group.name}" has been submitted`,
				data: { reportId: report._id }
			});
		} catch (e) {
			console.warn('Failed to notify reporter about report submission', e.message);
		}

		return { success: true, message: 'Report submitted', data: report };
	}

	// Thêm: lấy events của group (sắp tới trước)
	async getGroupEvents(groupId, opts = {}) {
		if (!groupId) throw new Error('Group id is required');
		if (!mongoose.Types.ObjectId.isValid(groupId)) throw new Error('Invalid group id');
		const limit = parseInt(opts.limit, 10) || 50;
		const skip = parseInt(opts.skip, 10) || 0;
		const events = await Event.find({ group: groupId })
			.sort({ startsAt: 1 })
			.skip(skip)
			.limit(limit)
			.lean();
		return { success: true, message: 'Group events fetched', data: events };
	}

	// Thêm: tạo event cho group
	async createEvent(creatorId, groupId, eventData = {}) {
		if (!creatorId) throw new Error('Unauthorized');
		if (!groupId) throw new Error('Group id is required');
		if (!mongoose.Types.ObjectId.isValid(groupId)) throw new Error('Invalid group id');

		const { name, description, startsAt, endsAt, participants = [] } = eventData;
		if (!name || String(name).trim() === '') throw new Error('Event name is required');
		if (!startsAt) throw new Error('Event start time is required');

		const group = await Group.findById(groupId).lean();
		if (!group) throw new Error('Group not found');

		// Ensure creator is a member
		if (!group.members.map(String).includes(String(creatorId))) {
			throw new Error('Only group members can create events');
		}

		// Normalize participants: accept array/string/json; keep only valid ObjectIds
		let partArray = [];
		if (Array.isArray(participants)) partArray = participants.map(String).filter(Boolean);
		else if (typeof participants === 'string') {
			const t = participants.trim();
			if (t.startsWith('[') && t.endsWith(']')) {
				try { const p = JSON.parse(t); if (Array.isArray(p)) partArray = p.map(String).filter(Boolean); } catch (e) { partArray = t.split(',').map(s=>s.trim()).filter(Boolean); }
			} else partArray = participants.split(',').map(s=>s.trim()).filter(Boolean);
		}
		// Filter to group members and valid ids
		const validParticipantIds = Array.from(new Set(partArray)).filter(id => mongoose.Types.ObjectId.isValid(id) && group.members.map(String).includes(String(id)));

		// Build attendees: creator yes, others pending
		const attendees = [ { user: new mongoose.Types.ObjectId(creatorId), status: 'yes' } ];
		for (const pid of validParticipantIds) {
			if (String(pid) === String(creatorId)) continue;
			attendees.push({ user: new mongoose.Types.ObjectId(pid), status: 'pending' });
		}

		const ev = await Event.create({
			group: new mongoose.Types.ObjectId(groupId),
			creator: new mongoose.Types.ObjectId(creatorId),
			name: String(name).trim(),
			description: description || '',
			startsAt: new Date(startsAt),
			endsAt: endsAt ? new Date(endsAt) : undefined,
			attendees
		});

		// Notify group members (except creator)
		const memberIds = group.members.map(String).filter(id => String(id) !== String(creatorId));
		for (const mid of memberIds) {
			try {
				await this.createNotification(mid, {
					type: 'schedule',
					title: 'New group event',
					message: `${group.name || 'Group'}: "${ev.name}" has been created`,
					data: { eventId: ev._id, groupId, from: creatorId, refType: 'group' }
				});
			} catch (err) {
				console.warn('Failed to notify member about event:', mid, err.message);
			}
		}

		return { success: true, message: 'Event created', data: ev };
	}

	// Thêm: chỉnh sửa event
	async editEvent(userId, groupId, eventId, updateData = {}) {
		if (!userId) throw new Error('Unauthorized');
		if (!groupId || !eventId) throw new Error('Invalid params');
		if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(eventId)) throw new Error('Invalid id');

		const event = await Event.findById(eventId);
		if (!event) throw new Error('Event not found');
		if (String(event.group) !== String(groupId)) throw new Error('Event does not belong to the group');

		// Allow only creator or group owner to edit
		const group = await Group.findById(groupId).lean();
		if (!group) throw new Error('Group not found');
		const isGroupOwner = String(group.owner) === String(userId);
		const isCreator = String(event.creator) === String(userId);
		if (!isCreator && !isGroupOwner) throw new Error('Not authorized to edit event');

		// Update allowed fields
		if (updateData.name !== undefined) event.name = String(updateData.name).trim();
		if (updateData.description !== undefined) event.description = updateData.description;
		if (updateData.startsAt !== undefined) event.startsAt = new Date(updateData.startsAt);
		if (updateData.endsAt !== undefined) event.endsAt = updateData.endsAt ? new Date(updateData.endsAt) : undefined;
		event.updatedAt = new Date();

		await event.save();

		// Notify members about update
		const memberIds = (group.members || []).map(String).filter(id => String(id) !== String(userId));
		for (const mid of memberIds) {
			try {
				await this.createNotification(mid, {
					type: 'schedule',
					title: 'Event updated',
					message: `Event "${event.name}" has been updated`,
					data: { eventId: event._id, groupId, from: userId }
				});
			} catch (err) { console.warn('Failed to notify member about event update', mid, err.message); }
		}

		return { success: true, message: 'Event updated', data: event };
	}

	// Thêm: xóa event
	async deleteEvent(userId, groupId, eventId) {
		if (!userId) throw new Error('Unauthorized');
		if (!groupId || !eventId) throw new Error('Invalid params');
		if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(eventId)) throw new Error('Invalid id');

		const event = await Event.findById(eventId);
		if (!event) throw new Error('Event not found');
		if (String(event.group) !== String(groupId)) throw new Error('Event does not belong to the group');

		const group = await Group.findById(groupId).lean();
		if (!group) throw new Error('Group not found');
		const isGroupOwner = String(group.owner) === String(userId);
		const isCreator = String(event.creator) === String(userId);
		if (!isCreator && !isGroupOwner) throw new Error('Not authorized to delete event');

		await Event.deleteOne({ _id: eventId });

		// Notify members about deletion
		const memberIds = (group.members || []).map(String).filter(id => String(id) !== String(userId));
		for (const mid of memberIds) {
			try {
				await this.createNotification(mid, {
					type: 'schedule',
					title: 'Event cancelled',
					message: `Event "${event.name}" was cancelled`,
					data: { eventId, groupId, from: userId }
				});
			} catch (err) { console.warn('Failed to notify member about event deletion', mid, err.message); }
		}

		return { success: true, message: 'Event deleted', data: { id: eventId } };
	}

	// Thêm: RSVP (join/leave) event
	async rsvpEvent(userId, groupId, eventId, status) {
		if (!userId) throw new Error('Unauthorized');
		if (!groupId || !eventId) throw new Error('Invalid params');
		if (!['yes','no','maybe'].includes(status)) throw new Error('Invalid status');
		if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(eventId)) throw new Error('Invalid id');

		const group = await Group.findById(groupId).lean();
		if (!group) throw new Error('Group not found');
		if (!group.members.map(String).includes(String(userId))) throw new Error('Only group members can RSVP');

		const event = await Event.findById(eventId);
		if (!event) throw new Error('Event not found');

		// find attendee entry
		const idx = (event.attendees || []).findIndex(a => String(a.user) === String(userId));
		if (idx >= 0) {
			event.attendees[idx].status = status;
		} else {
			event.attendees.push({ user: new mongoose.Types.ObjectId(userId), status });
		}
		event.updatedAt = new Date();
		await event.save();

		// Notify event creator about RSVP
		try {
			await this.createNotification(event.creator, {
				type: 'schedule',
				title: 'Event RSVP',
				message: `User responded "${status}" to event "${event.name}"`,
				data: { eventId, groupId, from: userId }
			});
		} catch (err) { console.warn('Failed to notify creator about rsvp', err.message); }

		return { success: true, message: 'RSVP recorded', data: event };
	}
}

module.exports = new UserService();