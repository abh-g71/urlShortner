const express = require("express");
const router = express.Router();

const {
  createShortUrl,
  redirectUrl,
  getAnalytics,
} = require("../controllers/urlController");

const createUrlLimiter = require("../middlewares/rateLimiter");

router.post("/shorten", createUrlLimiter, createShortUrl);

router.get("/:shortCode", redirectUrl);

router.get("/analytics/:shortCode", getAnalytics);

module.exports = router;
