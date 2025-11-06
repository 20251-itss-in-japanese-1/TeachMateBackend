const mongoose = require('mongoose');
const { User, Profile, FriendRequest } = require('../model'); // removed Friendship
const { isValidObjectId, normalizeSpecialties } = require('../utils/validators');

const MSG = {
	en: {
		notFound: 'Profile not found',
		invalidId: 'Invalid user id',
		serverError: 'Server error'
	}
};

class UserService {
	constructor() {
		// ...existing code...
	}

	async getProfile(input) {
		const L = 'en';
		const userId = input && (input.userId || input.id);

		if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
			throw { status: 400, message: MSG[L].invalidId };
		}
		const oid = mongoose.Types.ObjectId(userId);

		try {
			const [profile, user] = await Promise.all([
				Profile.findOne({ userId: oid }).lean().exec(),
				User.findById(oid).lean().exec()
			]);

			if (!profile && !user) {
				throw { status: 404, message: MSG[L].notFound };
			}

			const result = {
				userId: oid.toString(),
				name: (profile && profile.name) || (user && user.name) || null,
				nationality: (profile && profile.nationality) || (user && user.nationality) || null,
				yearsOfExp: (profile && profile.yearsOfExp) != null ? profile.yearsOfExp : (user && user.experience) || null,
				bio: (profile && profile.bio) || (user && (user.introduction || user.bio)) || null,
				specialties: [].concat(
					(profile && profile.specialties_major) || [],
					(profile && profile.specialties_subject) || [],
					(profile && profile.specialties_interest) || [],
					(user && user.specialties) || []
				).filter(Boolean),
				avatarUrl: (profile && profile.avatarUrl) || (user && user.avatarUrl) || null,
				createdAt: (profile && profile.createdAt) || (user && user.createdAt) || null
			};

			result.specialties = Array.from(new Set(result.specialties));

			return result;
		} catch (err) {
			if (err && err.status) throw err;
			console.error('getProfile service error', err);
			throw { status: 500, message: MSG[L].serverError };
		}
	}

	// Add: updateProfile
	// input: { userId, payload }
	async updateProfile(input) {
		const L = 'en';
		const userId = input && input.userId;
		const payload = input && input.payload;

		if (!isValidObjectId(userId)) {
			throw { status: 400, message: MSG[L].invalidId };
		}
		const oid = mongoose.Types.ObjectId(userId);

		try {
			// Prepare updates for User and Profile
			const userUpdates = {};
			const profileUpdates = {};

			// Map common fields
			if (payload.name != null) {
				userUpdates.name = payload.name;
				profileUpdates.name = payload.name;
			}
			if (payload.nationality != null) {
				userUpdates.nationality = payload.nationality;
				profileUpdates.nationality = payload.nationality;
			}
			// yearsOfExp (Profile) vs experience (User)
			if (payload.yearsOfExp != null) {
				profileUpdates.yearsOfExp = payload.yearsOfExp;
			}
			if (payload.experience != null) {
				userUpdates.experience = payload.experience;
			}
			// bio/introduction
			if (payload.bio != null) {
				profileUpdates.bio = payload.bio;
			}
			if (payload.introduction != null) {
				userUpdates.introduction = payload.introduction;
			}
			// avatarUrl
			if (payload.avatarUrl != null) {
				userUpdates.avatarUrl = payload.avatarUrl;
				profileUpdates.avatarUrl = payload.avatarUrl;
			}
			// specialties - normalize and store to both sides (profile -> specialties_major)
			if (payload.specialties != null) {
				const normalized = normalizeSpecialties(payload.specialties);
				userUpdates.specialties = normalized;
				profileUpdates.specialties_major = normalized;
			}

			// Perform updates concurrently
			const ops = [];
			if (Object.keys(userUpdates).length > 0) {
				ops.push(
					User.findByIdAndUpdate(oid, { $set: userUpdates }, { new: true }).exec()
				);
			}
			// Upsert profile
			if (Object.keys(profileUpdates).length > 0) {
				ops.push(
					Profile.findOneAndUpdate(
						{ userId: oid },
						{ $set: profileUpdates },
						{ upsert: true, new: true, setDefaultsOnInsert: true }
					).exec()
				);
			}

			await Promise.all(ops);

			// Return merged profile using existing logic
			return await this.getProfile({ userId: oid.toString() });
		} catch (err) {
			if (err && err.status) throw err;
			console.error('updateProfile service error', err);
			throw { status: 500, message: MSG[L].serverError };
		}
	}

	// Add: getTeacherProfile
	// input: { viewerId, teacherId }
	async getTeacherProfile(input) {
		const viewerId = input && input.viewerId;
		const teacherId = input && (input.teacherId || input.userId || input.id);

		if (!teacherId || !isValidObjectId(teacherId)) {
			throw { status: 400, message: 'Invalid teacher id' };
		}
		const tOid = mongoose.Types.ObjectId(teacherId);

		try {
			// include friends array from user document
			const [profile, user] = await Promise.all([
				Profile.findOne({ userId: tOid }).lean().exec(),
				User.findById(tOid).lean().exec()
			]);

			if (!profile && !user) {
				throw { status: 404, message: 'Profile not found' };
			}

			const specialties_major = (profile && profile.specialties_major) || [];
			const subjects = (profile && profile.specialties_subject) || [];
			const interests = (profile && profile.specialties_interest) || [];
			const combinedSpecialties = Array.from(new Set([].concat(specialties_major || [], (user && user.specialties) || [])));

			const result = {
				userId: tOid.toString(),
				avatarUrl: (profile && profile.avatarUrl) || (user && user.avatarUrl) || null,
				name: (profile && profile.name) || (user && user.name) || null,
				nationality: (profile && profile.nationality) || (user && user.nationality) || null,
				yearsOfExp: (profile && profile.yearsOfExp) != null ? profile.yearsOfExp : (user && user.experience) || null,
				specialties: combinedSpecialties,
				subjects: Array.from(new Set(subjects || [])),
				interests: Array.from(new Set(interests || [])),
				bio: (profile && profile.bio) || (user && (user.introduction || user.bio)) || null,
				createdAt: (profile && profile.createdAt) || (user && user.createdAt) || null,
				// relationship flags - default false, may be set below
				isFriend: false,
				friendRequestSent: false,
				friendRequestReceived: false,
				canSendFriendRequest: false
			};

			// If viewer present and valid and not the same user, determine relationship by checking user's friends array
			if (viewerId && isValidObjectId(viewerId) && String(viewerId) !== String(teacherId)) {
				const vOid = mongoose.Types.ObjectId(viewerId);

				// check teacher's friends array for viewer
				if (user && Array.isArray(user.friends) && user.friends.map(String).includes(String(vOid))) {
					result.isFriend = true;
					result.canSendFriendRequest = false;
				} else {
					// check existing friend requests between viewer and teacher
					const fr = await FriendRequest.findOne({
						$or: [
							{ fromUserId: vOid, toUserId: tOid },
							{ fromUserId: tOid, toUserId: vOid }
						]
					}).lean().exec();

					if (fr) {
						if (String(fr.fromUserId) === String(vOid) && fr.status === 'pending') {
							result.friendRequestSent = true;
						}
						if (String(fr.toUserId) === String(vOid) && fr.status === 'pending') {
							result.friendRequestReceived = true;
						}
						result.canSendFriendRequest = false;
					} else {
						// no friendship and no pending requests => can send
						result.canSendFriendRequest = true;
					}
				}
			}

			return result;
		} catch (err) {
			if (err && err.status) throw err;
			console.error('getTeacherProfile service error', err);
			throw { status: 500, message: 'Server error' };
		}
	}
}

module.exports = new UserService();
