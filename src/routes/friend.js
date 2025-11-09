
const express = require('express');
const friendController = require('../controller/friend.controller');
const authMiddleware = require('../middleware/AuthMiddleware');
const router = express.Router();

router.get("/get-all", authMiddleware.isAuth, friendController.getAllFriends);
router.post("/send-request", authMiddleware.isAuth, friendController.sendFriendRequest);
router.post("/accept-request", authMiddleware.isAuth, friendController.acceptFriendRequest);
router.post("/reject-request", authMiddleware.isAuth, friendController.rejectFriendRequest);

module.exports = router;