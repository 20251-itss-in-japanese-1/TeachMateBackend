const mongoose = require('mongoose');
const { Schema } = mongoose;

const pollSchema = new Schema({
	groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
	createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	question: { type: String, required: true, maxlength: 100 },
	options: { type: [String], required: true, validate: v => Array.isArray(v) && v.length >= 2 && v.length <= 5 },
	createdAt: { type: Date, required: true, default: Date.now },
	closed: { type: Boolean, required: true, default: false }
}, { versionKey: false });

pollSchema.index({ groupId: 1, createdAt: -1 });

module.exports = mongoose.model('Poll', pollSchema);
