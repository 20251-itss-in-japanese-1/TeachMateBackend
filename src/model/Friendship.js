const mongoose = require('mongoose');
const { Schema } = mongoose;

const friendshipSchema = new Schema({
	userA: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	userB: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	createdAt: { type: Date, required: true, default: Date.now }
}, { versionKey: false });

friendshipSchema.index({ userA: 1, userB: 1 }, { unique: true });
friendshipSchema.index({ userB: 1, userA: 1 }, { unique: true });

module.exports = mongoose.model('Friendship', friendshipSchema);
