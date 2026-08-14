require("dotenv").config();

const { Worker } = require("bullmq");
const Click = require("../models/Click");
const connectDB = require("../config/db");

const startWorker = async () => {
  await connectDB();

  const clickWorker = new Worker(
    "clickQueue",
    async (job) => {
      console.log("Processing click:", job.data);

      await Click.findOneAndUpdate(
        { clickId: job.data.clickId },
        { $setOnInsert: job.data },
        {
          upsert: true,
          
        }
      );

      console.log("Click saved to MongoDB");
    },
    {
      connection: {
        host: process.env.REDIS_HOST || "localhost",
        port: process.env.REDIS_PORT || 6380,
      },
    }
  );

  clickWorker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
  });

  clickWorker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);
  });

  console.log("Click worker started...");
};

startWorker();