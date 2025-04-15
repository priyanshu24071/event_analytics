const { createClient } = require('redis');
const logger = require('../utils/logger');

// Create a mock redis client that does nothing
const createMockRedisClient = () => {
  return {
    on: () => {},
    connect: async () => {},
    get: async () => null,
    set: async () => {},
    expire: async () => {},
    isReady: false
  };
};

let redisClient;

try {
  redisClient = createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379
    }
  });

  redisClient.on('error', (err) => {
    logger.error('Redis Client Error', err);
  });

  // Initialize connection
  (async () => {
    try {
      await redisClient.connect();
      logger.info('Redis connected successfully');
    } catch (err) {
      logger.error('Error connecting to Redis - switching to mock client:', err);
      redisClient = createMockRedisClient();
    }
  })();
} catch (err) {
  logger.error('Failed to create Redis client - using mock client instead:', err);
  redisClient = createMockRedisClient();
}

module.exports = redisClient; 