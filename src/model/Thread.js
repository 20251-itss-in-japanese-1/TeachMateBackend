const mongoose = require('mongoose');
const { Schema } = mongoose;

const threadSchema = new Schema({
	type: {
		type: String,
		enum: ['direct_friend', 'direct_stranger', 'group'],
		required: true
	},
	name: { type: String, default: null },
	avatar: { type: String, default: null },
    members: [
		{
			userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
			role: { type: String, enum: ['member', 'admin'], default: 'member' },
			lastReadAt: { type: Date, default: null }
		}
	],
	memberHash: { type: String, unique: true, sparse: true },
    lastMessage: {
		type: Schema.Types.ObjectId,
		ref: 'Message',
		default: null
	},
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { versionKey: false, timestamps: true });

threadSchema.index({ type: 1 });
threadSchema.index({ 'members.userId': 1 });
threadSchema.pre('validate', function (next) {
	if (this.type.startsWith('direct') && this.members?.length === 2) {
		const ids = this.members.map(m => m.userId.toString()).sort();
		this.memberHash = ids.join('_');
	}
	next();
});

module.exports = mongoose.model('Thread', threadSchema);
