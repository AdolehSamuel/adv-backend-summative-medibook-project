const { createClient } = require('redis');
require('dotenv').config();

function createRedisClient() {
  const client = createClient({
    url: process.env.REDIS_URL,
    disableOfflineQueue: true,
  });

  client.on('error', (error) => {
    console.error('Redis error:', error.message);
  });

  return client;
}

module.exports = { createRedisClient };
