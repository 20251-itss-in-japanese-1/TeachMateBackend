const mongoose = require('mongoose');
const { Schema } = mongoose;

const attachmentSchema = new Schema({
	kind: { type: String, required: true, enum: ['image', 'file', 'link'] },
	mime: { type: String },
	url: { type: String }
}, { _id: false });

const messageSchema = new Schema({
	threadId: { type: Schema.Types.ObjectId, ref: 'Thread', required: true },
	senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	content: { type: String, maxlength: 2000 },
	attachments: { type: [attachmentSchema], default: [] },
	reactions: { type: [String], default: [] },
	createdAt: { type: Date, required: true, default: Date.now },
	isSystem: { type: Boolean, default: false },
	visibility: { type: String, enum: ['normal', 'unknown_sender_box'], default: 'normal' }
}, { versionKey: false });

messageSchema.index({ threadId: 1, createdAt: 1 });
messageSchema.index({ senderId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
