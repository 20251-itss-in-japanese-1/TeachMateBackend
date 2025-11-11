
const express = require('express');
const authController = require('../controller/auth.controller');
const authMiddleware = require('../middleware/AuthMiddleware');
const router = express.Router();
const passport = require('passport');
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authMiddleware.isAuth, authController.logout);
router.get("/google", passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'consent'}));
router.get(
  "/google/callback",
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    if (!req.user) return res.redirect('/login');
    const token = req.user.token;
    console.log("Google OAuth token:", token);

    res.redirect(`http://localhost:3001/?token=${token}`);
  }
);


module.exports = router;