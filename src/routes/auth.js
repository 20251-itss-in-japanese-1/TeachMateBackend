const express = require('express');
const router = express.Router();
const userController = require('../controller/usercontroller');

// POST /auth/register
router.post('/register', userController.register);

// POST /auth/login
router.post('/login', userController.login);

// (optional) additional auth endpoints can be added here

module.exports = router;
