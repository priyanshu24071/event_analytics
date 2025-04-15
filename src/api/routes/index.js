const express = require('express');
const authRoutes = require('./auth.routes');
const appRoutes = require('./app.routes');
const analyticsRoutes = require('./analytics.routes');
const userRoutes = require('./user.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/apps', appRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/user', userRoutes);

module.exports = router; 