const express = require('express');
const { getProfile, updateProfile } = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

// User profile routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

module.exports = router; 