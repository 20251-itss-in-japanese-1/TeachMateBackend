const mongoose = require('mongoose');
const { Schema } = mongoose;

const friendRequestSchema = new Schema({
	fromUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	toUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	status: { type: String, required: true, enum: ['pending', 'approved', 'rejected'] },
	createdAt: { type: Date, required: true, default: Date.now },
	decidedAt: { type: Date, default: null }
}, { versionKey: false });

friendRequestSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true });
friendRequestSchema.index({ toUserId: 1, status: 1 });

module.exports = mongoose.model('FriendRequest', friendRequestSchema);
