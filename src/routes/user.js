const express = require('express');
const router = express.Router();
const userController = require('../controller/usercontroller');
const auth = require('../middleware/AuthMiddleware')

// View own profile
// GET /profile
router.get('/profile', auth.isUser, userController.viewProfile);

// Edit own profile
// PUT /profile
router.put('/profile', auth, userController.editProfile);

// Public view of other user's profile
// GET /users/:id/profile
router.get('/users/:id/profile', userController.viewProfile);

// Public view of teacher profile (shows relationship flags if requester is authenticated)
// GET /teachers/:id/profile
router.get('/teachers/:id/profile', userController.viewTeacherProfile);

// Allow editing via /users/:id/profile (protected and restricted in controller)
router.put('/users/:id/profile', auth, userController.editProfile);

module.exports = router;
