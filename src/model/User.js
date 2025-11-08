const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const { Schema } = mongoose;

const userSchema = new Schema({
	name: { type: String },
	email: { type: String, required: true, unique: true, match: /^[^@\s]+@[^@\s]+\.[^@\s]+$/ },
	password: { type: String, required: true },
	nationality: { type: String, default: 'Japan' },
	avatarUrl: { type: String },
	experience: { type: Number },
	introduction: { type: String },
	specialties: { type: [String], default: [] },
	role: { type: String, enum: ['user', 'admin'], default: 'user' },
	lastActiveAt: { type: Date, default: null },
	friends: [{ type: Schema.Types.ObjectId, ref: 'User' }],
	bio: { type: String, default: '' },
	languages: [{ type: String }],
	yearsExperience: { type: Number, default: 0 },
	rating: { type: Number, default: 0 },
	status: { type: String, enum: ['active','inactive','blocked'], default: 'active' },
	specialties_major: { type: [String], default: [] },
	specialties_subject: { type: [String], default: [] },
	specialties_interest: { type: [String], default: [] },
	googleId: { type: String, default: null },
	facebookId: { type: String, default: null},
}, { timestamps: true, versionKey: false });

userSchema.index({ email: 1 }, { unique: true });

// hash password before save if modified
userSchema.pre('save', async function (next) {
	if (!this.isModified('password')) return next();
	try {
		const saltRounds = 10;
		this.password = await bcrypt.hash(this.password, saltRounds);
		return next();
	} catch (err) {
		return next(err);
	}
});

userSchema.methods.comparePassword = function (plain) {
	return bcrypt.compare(plain, this.password);
};
userSchema.index({ name: 'text', specialties_major: 'text', specialties_subject: 'text', specialties_interest: 'text', bio: 'text' });
module.exports = mongoose.model('User', userSchema);
