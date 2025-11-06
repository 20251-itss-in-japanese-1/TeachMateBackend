const mongoose = require('mongoose');
const { Schema } = mongoose;

const groupMemberSchema = new Schema({
	groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
	userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	role: { type: String, required: true, enum: ['admin', 'member'] },
	joinedAt: { type: Date, required: true, default: Date.now },
	status: { type: String, required: true, enum: ['active', 'left', 'removed'] }
}, { versionKey: false });

groupMemberSchema.index({ groupId: 1, userId: 1 }, { unique: true });
groupMemberSchema.index({ userId: 1 });

module.exports = mongoose.model('GroupMember', groupMemberSchema);
