const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const redisClient = require("../config/redis");

const createUrlLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 10,           // 10 requests per IP
  standardHeaders: true,
  legacyHeaders: false,

  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }),
});

module.exports = createUrlLimiter;