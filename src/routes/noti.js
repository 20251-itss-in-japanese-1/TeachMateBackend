
const express = require('express');
const notiController = require('../controller/noti.controller');
const authMiddleware = require('../middleware/AuthMiddleware');
const router = express.Router();

router.get("/get-all", authMiddleware.isAuth, notiController.getNotifications);
router.post("/read", authMiddleware.isAuth, notiController.readSingleNotification);
router.post("/read-all", authMiddleware.isAuth, notiController.readAllNotifications);
module.exports = router;