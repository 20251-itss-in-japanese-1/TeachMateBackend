const mongoose = require('mongoose');
const { Schema } = mongoose;

const chatScheduleSchema = new Schema({
	threadId: { type: Schema.Types.ObjectId, ref: 'Thread', required: true },
	createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	title: { type: String, required: true },
	description: { type: String, maxlength: 1000 },
	date: { type: Date, required: true },
	time: { type: String, required: true },
	participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
	status: {
		type: String,
		enum: ['scheduled', 'cancelled', 'done'],
		default: 'scheduled'
	},
	createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

chatScheduleSchema.index({ threadId: 1, date: 1 });
module.exports = mongoose.model('ChatSchedule', chatScheduleSchema);
