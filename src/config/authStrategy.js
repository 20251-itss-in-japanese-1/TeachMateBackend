const passport = require('passport');
const User = require('../model/User');
const Helper = require('../utils/helper');
const { generateToken } = require('../utils/token');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
    try {
        if (!profile || !profile.id) {
            console.error("Google profile invalid:", profile);
            return done(new Error("Invalid Google profile"));
        }
        let existUser = await User.findOne({ googleId: profile.id });
        if (!existUser) {
            // fallback email nếu không có email từ Google
            const email = profile.emails?.[0]?.value || `${profile.id}@google.com`;

            existUser = await User.create({
                googleId: profile.id,
                name: profile.displayName || 'No name',
                email,
                avatarUrl: profile.photos?.[0]?.value || '',
                password: Helper.generateRandomPassword()
            });

            console.log("Created new Google user:", existUser._id);
        } else {
            console.log("Existing Google user:", existUser._id);
        }

        // Tạo JWT token
        const token = generateToken(existUser);

        // ⚡ Gán token trực tiếp vào user object
        existUser.token = token;

        console.log("Google OAuth successful, token generated:", token);
        return done(null, existUser);
    } catch (err) {
        console.error("Error in Google OAuth callback:", err);
        return done(err);
    }
}));

// serialize / deserialize cho session (nếu có dùng session)
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
});

module.exports = passport;
