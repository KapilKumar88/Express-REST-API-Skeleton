const express = require('express');
const router = express.Router();
const authController = require('../controller/auth.controller');
const { loginValidation, registerValidation } = require('../validationSchema/auth-schema');

router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/token', authController.refreshToken);

module.exports = router;
