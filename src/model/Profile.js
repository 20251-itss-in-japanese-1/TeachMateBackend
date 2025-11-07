const mongoose = require('mongoose');
const { Schema } = mongoose;

const profileSchema = new Schema({
	userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	name: { type: String, required: true, maxlength: 50 },
	nationality: { type: String },
	yearsOfExp: { type: Number, min: 0, max: 60 },
	bio: { type: String, maxlength: 1000 },
	specialties_major: { type: [String], default: [] },
	specialties_subject: { type: [String], default: [] },
	specialties_interest: { type: [String], default: [] },
	avatarUrl: { type: String }
}, { versionKey: false });

profileSchema.index({ userId: 1 }, { unique: true, name: 'uniq_userId' });

module.exports = mongoose.model('Profile', profileSchema);
