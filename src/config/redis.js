const Redis = require('redis');
const config = require('./config');

const redisClient = Redis.createClient({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

redisClient.on('connect', () => {
  console.info('Connected to Redis');
});

module.exports = redisClient; 