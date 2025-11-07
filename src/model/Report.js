const mongoose = require('mongoose');
const { Schema } = mongoose;

const reportSchema = new Schema({
	targetType: { type: String, required: true, enum: ['user', 'group'] },
	targetId: { type: Schema.Types.ObjectId, required: true },
	reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	reason: { type: String, maxlength: 300 },
	status: { type: String, required: true, enum: ['pending', 'resolved'], default: 'pending' },
	note: { type: String, maxlength: 300 },
	createdAt: { type: Date, required: true, default: Date.now },
	resolvedAt: { type: Date, default: null },
	resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { versionKey: false });

reportSchema.index({ targetType: 1, targetId: 1 });
reportSchema.index({ reporterId: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
