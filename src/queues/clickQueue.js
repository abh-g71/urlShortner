const { Queue } = require("bullmq");


const clickQueue = new Queue("clickQueue", {
  connection: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6380,
  },
});


module.exports = clickQueue;