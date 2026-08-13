const express = require('express');
const router = express.Router();



// Import the controller
const {
  createShortUrl,
  redirectUrl,
  getAnalytics
} = require('../controllers/urlController');

// Define the route
router.post('/shorten', createShortUrl);

router.get('/analytics/:shortCode', getAnalytics);

router.get('/:shortCode', redirectUrl);



// Export the router
module.exports = router;