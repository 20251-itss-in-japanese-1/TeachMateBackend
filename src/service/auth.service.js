const User = require('../model/User');
const {generateToken} = require('../utils/token');
const jwt = require('jsonwebtoken');
class AuthService {
    register = async (data) => {
        const { name, email, password, nationality } = data;
        if(!name || !email || !password || !nationality) {
            throw new Error('Name, email, nationality and password are required');
        }
        const existingUser = await User.findOne({email});
        if (existingUser) {
            throw new Error('User already exists with this email');
        }
        const newUser = new User({ name, email, password, nationality});
        await newUser.save();
        return {
            success: true,
            message: 'User registered successfully',
        };
    }
    login = async (data) => {
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
                token: token
            }
        };
    }
    logout = async () => {
            res.clearCookie('token', {
            httpOnly: true,
            secure: true,     // true nếu đang chạy HTTPS
            sameSite: 'None', // để FE khác domain vẫn xóa được cookie
        });

        return {
            success: true,
            message: 'Logout successful',
        };
    }
}
module.exports = new AuthService();
