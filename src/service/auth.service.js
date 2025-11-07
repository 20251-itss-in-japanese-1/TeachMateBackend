const User = require('../model/User');
const {generateToken} = require('../utils/token');

class AuthService {
    async register(data) {
        const { name, email, password } = data;
        if(!name || !email || !password) {
            throw new Error('Name, email, and password are required');
        }
        const existingUser = await User.findOne({email});
        if (existingUser) {
            throw new Error('User already exists with this email');
        }
        const newUser = new User({ name, email, password });
        await newUser.save();
        return {
            success: true,
            message: 'User registered successfully',
        };
    }
    async login(data) {
        const { email, password } = data;
        if (!email || !password) {
            throw new Error('Email and password are required');
        }
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error('Invalid email or password');
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch){
            throw new Error('Invalid email or password');
        }
        user.password = undefined;
        const token = generateToken(user);
        return {
            success: true,
            message: 'Login successful',
            data: {
                user: user,
                token: token
            }
        };
    }
}
module.exports = new AuthService();