const express = require('express');
const {
  createEvent,
  listSessions,
  getSessionEvents,
  listPages,
  getClicksForPage,
} = require('../controllers/eventController');

const router = express.Router();

// Event ingestion
router.post('/events', createEvent);

// Sessions
router.get('/sessions', listSessions);
router.get('/sessions/:sessionId/events', getSessionEvents);

// Heatmap support
router.get('/pages', listPages);
router.get('/clicks', getClicksForPage);

module.exports = router;
