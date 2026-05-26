const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const userAuth = require('../middleware/userAuth');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/profile', userAuth, userController.getProfile);

module.exports = router;