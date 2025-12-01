const User = require('../model/User');
const Report = require('../model/Report');
const Notification = require('../model/Notification');
class UserService {
	getMyProfile = async (userId) => {
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
	updateProfile = async (userId, updateData) => {
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
	report = async (reporterId, targetUserId, reason, targetType) => {
		if (!reporterId) {
			throw new Error('Unauthorized');
		}
		if (!targetUserId) {
			throw new Error('Target user ID is required');
		}
		if (!reason || String(reason).trim() === '') {
			throw new Error('Reason for report is required');
		}

		const report = new Report({
			targetType: targetType || 'user',
			targetId: targetUserId,
			reporterId,
			reason: String(reason).trim()
		});
		await report.save();
		const notification = new Notification({
			userId: targetUserId,
			type: 'system',
			title: 'Profile reported',
			body: `Your profile has been reported for the following reason: ${reason}`,
			refId: report._id,
			refType: 'report',
			read: false
		});
		await notification.save();
		return {
			success: true,
			message: 'Report submitted successfully',
		};
	}
}

module.exports = new UserService();