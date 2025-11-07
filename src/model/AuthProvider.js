const mongoose = require('mongoose');
const { Schema } = mongoose;

const authProviderSchema = new Schema({
	userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	provider: { type: String, required: true, enum: ['google', 'facebook'] },
	providerUid: { type: String, required: true },
	linkedAt: { type: Date, required: true, default: Date.now }
}, { versionKey: false });

authProviderSchema.index({ userId: 1 });
authProviderSchema.index({ provider: 1, providerUid: 1 }, { unique: true });

module.exports = mongoose.model('AuthProvider', authProviderSchema);
