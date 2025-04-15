const { RateLimiterRedis } = require('rate-limiter-flexible');
const redisClient = require('../../config/redis');
const config = require('../../config/config');
const logger = require('../../utils/logger');

let rateLimiter;

try {
  if (redisClient && redisClient.isReady) {
    rateLimiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rate_limit',
      points: 100, // Number of points
      duration: 60, // Per 60 seconds
    });
  }
} catch (err) {
  logger.warn('Rate limiter could not be initialized:', err);
}

// Export middleware
const rateLimiterMiddleware = async (req, res, next) => {
  // Skip rate limiting if Redis is not available
  if (!rateLimiter) {
    logger.warn('Rate limiting skipped - Redis not available');
    return next();
  }

  try {
    // Use API key or IP as identifier
    const key = req.headers['x-api-key'] || req.ip;
    
    await rateLimiter.consume(key);
    next();
  } catch (error) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later'
    });
  }
};

module.exports = { rateLimiter: rateLimiterMiddleware }; 