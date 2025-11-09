const mongoose = require('mongoose');
const { Schema } = mongoose;

const threadSchema = new Schema({
	type: { type: String, required: true, enum: ['dm', 'group'] },
	dmUserA: { type: Schema.Types.ObjectId, ref: 'User' },
	dmUserB: { type: Schema.Types.ObjectId, ref: 'User' },
	groupId: { type: Schema.Types.ObjectId, ref: 'Group', default: null },
	lastMessageAt: { type: Date },
	lastMessagePreview: { type: String, maxlength: 200 }
}, { versionKey: false });

threadSchema.index(
	{ type: 1, dmUserA: 1, dmUserB: 1 },
	{ unique: true, partialFilterExpression: { type: 'dm' } }
);

threadSchema.index(
	{ type: 1, groupId: 1 },
	{ unique: true, partialFilterExpression: { type: 'group' } }
);

threadSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model('Thread', threadSchema);
