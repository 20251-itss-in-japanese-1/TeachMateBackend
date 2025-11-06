const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const { Schema } = mongoose;

const userSchema = new Schema({
	// basic profile
	name: { type: String },
	email: { type: String, required: true, unique: true, match: /^[^@\s]+@[^@\s]+\.[^@\s]+$/ },
	// password stored hashed
	password: { type: String, required: true },
	nationality: { type: String },
	avatarUrl: { type: String },
	experience: { type: Number },
	introduction: { type: String },
	specialties: { type: [String], default: [] },
	// role only — no locale field
	role: { type: String, enum: ['user', 'admin'], default: 'user' },
	lastActiveAt: { type: Date, default: null },

	// new: list of friend user ids
	friends: [{ type: Schema.Types.ObjectId, ref: 'User' }]
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

module.exports = mongoose.model('User', userSchema);
