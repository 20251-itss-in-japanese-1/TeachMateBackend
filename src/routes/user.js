
const express = require('express');
const userController = require('../controller/user.controller');
const router = express.Router();
const authMiddleware = require('../middleware/AuthMiddleware');
router.get("/me", authMiddleware.isAuth, userController.getMyProfile);

module.exports = router;