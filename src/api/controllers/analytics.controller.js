const { Event, App, sequelize, Sequelize } = require('../../db/models');
const redisClient = require('../../config/redis');
const logger = require('../../utils/logger');
const { Op } = Sequelize;

/**
 * @swagger
 * /api/analytics/events:
 *   get:
 *     summary: Get event analytics for an app
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: appId
 *         schema:
 *           type: string
 *         description: ID of the app to get analytics for
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics (ISO format)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics (ISO format)
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *         description: Type of event to filter by
 *     responses:
 *       200:
 *         description: Event analytics data
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
const getEventAnalytics = async (req, res, next) => {
  try {
    const { appId, startDate, endDate, eventType } = req.query;
    const userId = req.user.id;
    
    // Verify app belongs to user
    const app = await App.findOne({
      where: {
        id: appId,
        userId
      }
    });
    
    if (!app) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this app'
      });
    }
    
    // Build query conditions
    const whereConditions = { appId };
    
    if (startDate && endDate) {
      whereConditions.timestamp = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereConditions.timestamp = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereConditions.timestamp = {
        [Op.lte]: new Date(endDate)
      };
    }
    
    if (eventType) {
      whereConditions.type = eventType;
    }
    
    // Get event count grouped by date and type
    const eventAnalytics = await Event.findAll({
      attributes: [
        [sequelize.fn('date_trunc', 'day', sequelize.col('timestamp')), 'date'],
        'type',
        [sequelize.fn('count', sequelize.col('id')), 'count']
      ],
      where: whereConditions,
      group: [sequelize.fn('date_trunc', 'day', sequelize.col('timestamp')), 'type'],
      order: [[sequelize.fn('date_trunc', 'day', sequelize.col('timestamp')), 'ASC']]
    });
    
    return res.status(200).json({
      success: true,
      data: eventAnalytics
    });
  } catch (error) {
    logger.error('Error fetching event analytics:', error);
    next(error);
  }
};

/**
 * @swagger
 * /api/analytics/summary:
 *   get:
 *     summary: Get analytics summary for an app
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: appId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the app to get summary for
 *     responses:
 *       200:
 *         description: Analytics summary data
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
const getAnalyticsSummary = async (req, res, next) => {
  try {
    const { appId } = req.query;
    const userId = req.user.id;
    
    // Verify app belongs to user
    const app = await App.findOne({
      where: {
        id: appId,
        userId
      }
    });
    
    if (!app) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this app'
      });
    }
    
    // Get today's date
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    
    // Get start of last 30 days
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    last30Days.setHours(0, 0, 0, 0);
    
    // Get total events
    const totalEvents = await Event.count({
      where: { appId }
    });
    
    // Get today's events
    const todayEvents = await Event.count({
      where: {
        appId,
        timestamp: { [Op.gte]: startOfToday }
      }
    });
    
    // Get last 30 days events
    const monthlyEvents = await Event.count({
      where: {
        appId,
        timestamp: { [Op.gte]: last30Days }
      }
    });
    
    // Get event types distribution
    const eventTypes = await Event.findAll({
      attributes: [
        'type',
        [sequelize.fn('count', sequelize.col('id')), 'count']
      ],
      where: { appId },
      group: ['type'],
      order: [[sequelize.fn('count', sequelize.col('id')), 'DESC']]
    });
    
    return res.status(200).json({
      success: true,
      data: {
        totalEvents,
        todayEvents,
        monthlyEvents,
        eventTypes
      }
    });
  } catch (error) {
    logger.error('Error fetching analytics summary:', error);
    next(error);
  }
};

/**
 * @swagger
 * /api/analytics/collect:
 *   post:
 *     summary: Collect analytics event
 *     tags: [Analytics]
 *     security:
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - event
 *               - url
 *               - device
 *               - ipAddress
 *               - timestamp
 *             properties:
 *               event:
 *                 type: string
 *               url:
 *                 type: string
 *               referrer:
 *                 type: string
 *               device:
 *                 type: string
 *               ipAddress:
 *                 type: string
 *               userId:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Event recorded successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid API key
 */
const collectEvent = async (req, res, next) => {
    try {
      const { event, url, referrer, device, ipAddress, timestamp, metadata } = req.body;
      const userId = req.body.userId || null;
      const appId = req.app.id;
      
      
      // Create event record
      const newEvent = await Event.create({
        appId,
        type: event,
        name: event,
        url,
        referrer,
        device,
        ipAddress,
        userId,
        metadata: metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : null,
        timestamp: new Date(timestamp)
      });
      
      return res.status(201).json({
        success: true,
        message: 'Event recorded successfully'
      });
    } catch (error) {
      logger.error('Error collecting event:', error);
      next(error);
    }
  };
/**
 * @swagger
 * /api/analytics/event-summary:
 *   get:
 *     summary: Get summary for a specific event type
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: event
 *         schema:
 *           type: string
 *         required: true
 *         description: Type of event to get summary for
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering (ISO format)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering (ISO format)
 *       - in: query
 *         name: app_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the app to get summary for
 *     responses:
 *       200:
 *         description: Event summary data
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
const getEventSummary = async (req, res, next) => {
  try {
    const { event, startDate, endDate, app_id } = req.query;
    const userId = req.user.id;
    
    // Verify app belongs to user
    const app = await App.findOne({
      where: {
        id: app_id,
        userId
      }
    });
    
    if (!app) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this app'
      });
    }
    
    // Build cache key
    const cacheKey = `event_summary:${event}:${app_id}:${startDate || 'all'}:${endDate || 'all'}`;
    
    // Check cache first
    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
      }
    } catch (err) {
      logger.warn('Redis error when getting cache, continuing without cache:', err);
      // Continue without cache if Redis has an error
    }
    
    // Build query conditions
    const whereConditions = { 
      appId: app_id,
      type: event
    };
    
    // Add date filters if provided
    if (startDate && endDate) {
      whereConditions.timestamp = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereConditions.timestamp = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereConditions.timestamp = {
        [Op.lte]: new Date(endDate)
      };
    }
    
    // Get count of events
    const count = await Event.count({
      where: whereConditions
    });
    
    // Get count of unique users
    const uniqueUsers = await Event.count({
      where: whereConditions,
      distinct: true,
      col: 'userId'
    });
    
    // Get device distribution
    const devices = await Event.findAll({
        attributes: [
          'device',
          [sequelize.fn('count', sequelize.col('id')), 'count']
        ],
        where: whereConditions,
        group: ['device']
      });
      
      const deviceData = {};
      devices.forEach(device => {
        // Use a default value if device is undefined
        const deviceName = device.device || 'unknown';
        deviceData[deviceName] = parseInt(device.get('count'));
      });
    
    const result = {
      success: true,
      data: {
        event,
        count,
        uniqueUsers,
        deviceData
      }
    };
    
    // Cache result
    try {
      await redisClient.set(cacheKey, JSON.stringify(result));
      await redisClient.expire(cacheKey, 3600); // Cache for 1 hour
    } catch (err) {
      logger.warn('Redis error when setting cache:', err);
      // Continue without caching if Redis has an error
    }
    
    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error getting event summary:', error);
    next(error);
  }
};

/**
 * @swagger
 * /api/analytics/user-stats:
 *   get:
 *     summary: Get statistics for a specific user
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of user to get stats for
 *     responses:
 *       200:
 *         description: User statistics data
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 */
const getUserStats = async (req, res, next) => {
  try {
    const { userId } = req.query;
    
const allUserEvents = await Event.findAll({
  where: { userId },
  order: [['createdAt', 'DESC']]
});
console.log("All events:", allUserEvents.map(e => ({
  id: e.id,
  type: e.type,
  timestamp: e.timestamp,
  createdAt: e.createdAt,
  metadata: e.metadata ? "has metadata" : "null metadata",
  ipAddress: e.ipAddress
})));
    // Get total events for user
    const totalEvents = await Event.count({
      where: { userId }
    });
    
    if (totalEvents === 0) {
      return res.status(404).json({
        success: false,
        message: 'No data found for this user'
      });
    }
    
    // Get most recent event to extract device details
    const mostRecentEvent = await Event.findOne({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });
    
    // Extract device details and IP from metadata
    const deviceDetails = {
        browser: 'Unknown',
        os: 'Unknown'
      };
      
      // Parse metadata if it exists
      if (mostRecentEvent.metadata) {
        try {
          // If metadata is stored as a string, parse it
          const metadataObj = typeof mostRecentEvent.metadata === 'string' 
            ? JSON.parse(mostRecentEvent.metadata) 
            : mostRecentEvent.metadata;
          
          deviceDetails.browser = metadataObj.browser || 'Unknown';
          deviceDetails.os = metadataObj.os || 'Unknown';
        } catch (err) {
          logger.warn('Error parsing metadata:', err);
        }
      } else if (mostRecentEvent.device) {
        // Fallback to device field if available
        deviceDetails.device = mostRecentEvent.device;
      }
    
    return res.status(200).json({
      success: true,
      data: {
        userId,
        totalEvents,
        deviceDetails,
        ipAddress: mostRecentEvent.ipAddress
      }
    });
  } catch (error) {
    logger.error('Error getting user stats:', error);
    next(error);
  }
};

module.exports = {
  getEventAnalytics,
  getAnalyticsSummary,
  collectEvent,
  getEventSummary,
  getUserStats
}; 