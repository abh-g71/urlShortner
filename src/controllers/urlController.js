const Url = require("../models/Url");
const Click = require("../models/Click");
const { nanoid } = require("nanoid");
const redisClient = require("../config/redis");

const clickQueue = require("../queues/clickQueue");

const createShortUrl = async (req, res) => {
  try {
    const { url } = req.body;

    // 1. Basic check: Did they send anything?
    if (!url) {
      return res.status(400).json({
        success: false,
        message: "URL is required",
      });
    }

    // 2. Strict Validation: Is it actually a valid URL format?
    try {
      new URL(url); 
    } catch (err) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid URL format. Must include http:// or https://" 
      });
    }

    // Generate a unique short code
    const shortCode = nanoid(6);


    // Save to MongoDB
    const newUrl = await Url.create({
      originalUrl: url,
      shortCode,
    });


    
    // Return the shortened URL
    res.status(201).json({
      success: true,
      message: "Short URL created successfully",
      data: {
        originalUrl: newUrl.originalUrl,
        shortCode: newUrl.shortCode,
        shortUrl: `${req.protocol}://${req.get("host")}/${newUrl.shortCode}`,
      },
    });
  } catch (error) {
    console.error(error);

    // 3. The Collision Edge Case Check (MongoDB Duplicate Key Error)
    if (error.code === 11000) {
      return res.status(500).json({
        success: false,
        message: "Short code collision detected. Please try again.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Add this below your existing createShortUrl function

const redirectUrl = async (req, res) => {
  try {
    const { shortCode } = req.params;

    // 1. Try Redis
    let cachedUrl = null;

    try {
      cachedUrl = await redisClient.get(`url:${shortCode}`);
    } catch (err) {
      console.error("Redis GET error:", err);
    }

    // 2. Cache HIT
    if (cachedUrl) {
      try {
        await clickQueue.add("click", {
          shortCode,
          timestamp: new Date().toISOString(),
          ip: req.ip,
          userAgent: req.get("User-Agent"),
        },
        {
          attempts: 3,
        }
      );
      } catch (err) {
        console.error("Click queue error:", err);
      }

      return res.redirect(302, cachedUrl);
    }

    // 3. Cache MISS → MongoDB
    const urlDocument = await Url.findOne({ shortCode });

    if (!urlDocument) {
      return res.status(404).json({
        success: false,
        message: "Short URL not found",
      });
    }

    // 4. Add analytics job
    try {
      await clickQueue.add("click", {
        shortCode,
        timestamp: new Date().toISOString(),
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      },
    {
      attempts: 3,
    });
    } catch (err) {
      console.error("Click queue error:", err);
    }

    // 5. Store URL in Redis
    try {
      await redisClient.set(
        `url:${shortCode}`,
        urlDocument.originalUrl,
        {
          EX: 3600,
        }
      );
    } catch (err) {
      console.error("Redis SET error:", err);
    }

    // 6. Redirect
    return res.redirect(302, urlDocument.originalUrl);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const { shortCode } = req.params;

    const result = await Click.aggregate([
      {
        $match: { shortCode },
      },
      {
        $count: "totalClicks",
      },
    ]);

    const totalClicks = result.length > 0 ? result[0].totalClicks : 0;

    return res.status(200).json({
      success: true,
      data: {
        shortCode,
        totalClicks,
      },
    });

  } catch (error) {
    console.error("Analytics error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  createShortUrl,
  redirectUrl,
  getAnalytics
};