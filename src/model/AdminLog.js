const mongoose = require('mongoose');
const { Schema } = mongoose;

const adminLogSchema = new Schema({
	adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	action: { type: String, required: true },
	meta: { type: Schema.Types.Mixed },
	createdAt: { type: Date, required: true, default: Date.now }
}, { versionKey: false });

adminLogSchema.index({ adminId: 1, createdAt: -1 });

module.exports = mongoose.model('AdminLog', adminLogSchema);
