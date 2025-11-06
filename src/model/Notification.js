const mongoose = require('mongoose');
const { Schema } = mongoose;

const notificationSchema = new Schema({
	userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	type: { type: String, required: true, enum: ['friend_request', 'message', 'schedule', 'system', 'group'] },
	title: { type: String, required: true, maxlength: 140 },
	body: { type: String, maxlength: 500 },
	refId: { type: Schema.Types.ObjectId },
	refType: { type: String, enum: ['request', 'thread', 'group', 'schedule', 'report'] },
	read: { type: Boolean, required: true, default: false },
	createdAt: { type: Date, required: true, default: Date.now }
}, { versionKey: false });

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
