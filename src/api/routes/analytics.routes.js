const express = require('express');
const { collectEvent, getEventSummary, getUserStats } = require('../controllers/analytics.controller');
const { validateApiKey } = require('../middlewares/apiKeyAuth');
const { rateLimiter } = require('../middlewares/rateLimiter');
const { validateCollectEvent, validateEventSummary, validateUserStats } = require('../validations/analytics.validation');
const { authenticate } = require('../middlewares/auth');
const router = express.Router();

// Event Collection
router.post('/collect', validateApiKey,rateLimiter, validateCollectEvent, collectEvent);

// Analytics endpoints
router.get('/event-summary', authenticate, validateEventSummary, getEventSummary);
router.get('/user-stats', authenticate, validateUserStats, getUserStats);

module.exports = router; 