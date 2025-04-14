const Redis = require('redis');
const config = require('./config');
const logger = require('../utils/logger');

const redisClient = Redis.createClient({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password
});

redisClient.on('error', (err) => {
  logger.error('Redis error:', err);
});

redisClient.on('connect', () => {
  logger.info('Connected to Redis');
});

module.exports = redisClient; 