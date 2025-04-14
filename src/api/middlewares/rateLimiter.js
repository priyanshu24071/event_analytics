const { RateLimiterRedis } = require('rate-limiter-flexible');
const redisClient = require('../../config/redis');
const config = require('../../config/config');

const rateLimiterRedis = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rate_limit',
  points: 100, // Number of points
  duration: 60, // Per 60 seconds
});

const rateLimiter = async (req, res, next) => {
  try {
    // Use API key or IP as identifier
    const key = req.headers['x-api-key'] || req.ip;
    
    await rateLimiterRedis.consume(key);
    next();
  } catch (error) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later'
    });
  }
};

module.exports = { rateLimiter }; 