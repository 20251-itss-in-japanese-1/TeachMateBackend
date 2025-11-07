const mongoose = require('mongoose');
const { Schema } = mongoose;

const groupSchema = new Schema({
	name: { type: String, required: true, maxlength: 100 },
	description: { type: String, maxlength: 300 },
	status: { type: String, required: true, enum: ['active', 'archived', 'disabled'] },
	ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	createdAt: { type: Date, required: true, default: Date.now }
}, { versionKey: false });

groupSchema.index({ ownerId: 1 });
groupSchema.index({ status: 1 });

module.exports = mongoose.model('Group', groupSchema);
