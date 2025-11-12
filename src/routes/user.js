const express = require('express');
const userController = require('../controller/user.controller');
const router = express.Router();
const authMiddleware = require('../middleware/AuthMiddleware');
router.get("/me", authMiddleware.isAuth, userController.getMyProfile);
router.post("/me/edit", authMiddleware.isAuth, userController.updateProfile); 
router.get('/teacher/:id', authMiddleware.isAuth, userController.viewTeacherProfile);
router.get('/search', authMiddleware.isAuth, userController.searchUsers);
router.post('/report', authMiddleware.isAuth, userController.report);
module.exports = router;

