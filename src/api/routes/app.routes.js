const express = require('express');
const { getUserApps, getAppById, updateApp, deleteApp } = require('../controllers/app.controller');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

// App management routes
router.get('/', authenticate, getUserApps);
router.get('/:id', authenticate, getAppById);
router.put('/:id', authenticate, updateApp);
router.delete('/:id', authenticate, deleteApp);

module.exports = router; 