const express = require('express');
const passport = require('passport');
const { register, getApiKey, revokeApiKey, regenerateApiKey } = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

// Google Auth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
  // Generate JWT and redirect to frontend with token
  const token = req.user.generateJWT();
  res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
});

// API Key Management
router.post('/register', authenticate, register);
router.get('/api-key', authenticate, getApiKey);
router.post('/revoke', authenticate, revokeApiKey);
router.post('/regenerate', authenticate, regenerateApiKey);

router.get('/test', authenticate, (req, res) => {
  res.json({ message: 'Authentication successful', user: req.user });
});

module.exports = router; 