const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: String,
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    nationality: String,
    avatarUrl: String,
    experience: Number,
    introduction: String,
    specialties: [String],
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true})

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});
userSchema.methods.comparePassword = function (password) {
    return bcrypt.compare(password, this.password);
}
module.exports = mongoose.model('User', userSchema);