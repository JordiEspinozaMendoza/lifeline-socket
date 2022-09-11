require('dotenv').config();

module.exports = {
  PORT: process.env.PORT,
  REDIS: {
    HOST: process.env.REDIS_HOST,
    PORT: process.env.REDIS_PORT,
    CADUCIDAD_DEFAULT: 3600,
    URL: process.env.REDIS_URL,
  },
};
