const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const { Schema } = mongoose;

const userSchema = new Schema({
	name: { type: String },
	email: { type: String, required: true, unique: true, match: /^[^@\s]+@[^@\s]+\.[^@\s]+$/ },
	password: { type: String, required: true },
	nationality: { type: String, default: 'Japan' },
	avatarUrl: { type: String, default: 'https://scontent.fhan14-2.fna.fbcdn.net/v/t39.30808-1/484113772_656763590187686_8399675708789287895_n.jpg?stp=dst-jpg_s200x200_tt6&_nc_cat=100&ccb=1-7&_nc_sid=e99d92&_nc_eui2=AeFvSxX1SPZNWmioN2-e3RaMqPPO7rqt-Iio887uuq34iJWuNg3JBRvgO431BplySN7Mn9_rvB8wgl9BTO4V0Rqk&_nc_ohc=_q0prxSR-h0Q7kNvwGrMz-Y&_nc_oc=AdnAORFf-UDV7LMllZ-jEQzHdddd8XzkuiWkrPvYD4MgNy5ap0YP5M4PrbgXMJylQS8&_nc_zt=24&_nc_ht=scontent.fhan14-2.fna&_nc_gid=_ALYYEqVQFEJfIZQQPTdFQ&oh=00_AfggDSUGQGA8sdrHvTmXgyGlH4jCswU9c8Ab89fWCmIMhw&oe=691A1791' },
	experience: { type: Number, default: 0 },
	introduction: { type: String, default: '' },
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
	friends: [{ type: Schema.Types.ObjectId, ref: 'User' }, { default: [] }],
	googleId: { type: String, default: null },
	facebookId: { type: String, default: null},
}, { timestamps: true, versionKey: false });


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
