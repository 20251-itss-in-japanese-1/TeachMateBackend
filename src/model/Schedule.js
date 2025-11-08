const mongoose = require('mongoose');
const { Schema } = mongoose;

const scheduleSchema = new Schema({
	scope: { type: String, required: true, enum: ['dm', 'group'] },
	threadId: { type: Schema.Types.ObjectId, ref: 'Thread', required: true },
	title: { type: String, required: true, maxlength: 100 },
	startAt: { type: Date, required: true },
	description: { type: String, maxlength: 300 },
	createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	attendees: { type: [Schema.Types.ObjectId], default: [] },
	status: { type: String, required: true, enum: ['scheduled', 'canceled'] },
	createdAt: { type: Date, required: true, default: Date.now }
}, { versionKey: false });

scheduleSchema.index({ threadId: 1, startAt: 1 });
scheduleSchema.index({ createdBy: 1, startAt: -1 });

module.exports = mongoose.model('Schedule', scheduleSchema);
