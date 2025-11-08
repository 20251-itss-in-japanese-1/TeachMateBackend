const mongoose = require('mongoose');
const { Schema } = mongoose;

const mediaAssetSchema = new Schema({
	ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	messageId: { type: Schema.Types.ObjectId, ref: 'Message' },
	kind: { type: String, required: true, enum: ['image', 'file', 'link'] },
	mime: { type: String },
	urlOrGridFsId: { type: String },
	size: { type: Number, max: 20971520 },
	createdAt: { type: Date, required: true, default: Date.now }
}, { versionKey: false });

mediaAssetSchema.index({ messageId: 1 });
mediaAssetSchema.index({ ownerId: 1, createdAt: -1 });

module.exports = mongoose.model('MediaAsset', mediaAssetSchema);
