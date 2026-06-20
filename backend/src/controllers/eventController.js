const Event = require('../models/Event');

const ALLOWED_EVENT_TYPES = ['page_view', 'click'];

async function createEvent(req, res) {
  try {
    const payload = Array.isArray(req.body) ? req.body : [req.body];

    if (payload.length === 0) {
      return res.status(400).json({ error: 'Request body must contain at least one event.' });
    }

    const docs = [];
    for (const raw of payload) {
      const { sessionId, eventType, pageUrl, timestamp, x, y, viewportWidth, viewportHeight, referrer } = raw || {};

      if (!sessionId || typeof sessionId !== 'string') {
        return res.status(400).json({ error: 'sessionId is required for every event.' });
      }
      if (!eventType || !ALLOWED_EVENT_TYPES.includes(eventType)) {
        return res.status(400).json({ error: `eventType must be one of: ${ALLOWED_EVENT_TYPES.join(', ')}` });
      }
      if (!pageUrl || typeof pageUrl !== 'string') {
        return res.status(400).json({ error: 'pageUrl is required for every event.' });
      }
      if (eventType === 'click' && (typeof x !== 'number' || typeof y !== 'number')) {
        return res.status(400).json({ error: 'click events require numeric x and y coordinates.' });
      }

      docs.push({
        sessionId,
        eventType,
        pageUrl,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        x: typeof x === 'number' ? x : undefined,
        y: typeof y === 'number' ? y : undefined,
        viewportWidth: typeof viewportWidth === 'number' ? viewportWidth : undefined,
        viewportHeight: typeof viewportHeight === 'number' ? viewportHeight : undefined,
        referrer: typeof referrer === 'string' ? referrer : undefined,
        userAgent: req.headers['user-agent'],
      });
    }

    const inserted = await Event.insertMany(docs, { ordered: true });
    return res.status(201).json({ inserted: inserted.length });
  } catch (err) {
    console.error('[createEvent]', err);
    return res.status(500).json({ error: 'Failed to store event(s).' });
  }
}

/**
 * GET /api/sessions
 * Return all sessions with aggregate stats: total event count, first/last
 * seen timestamps, and the page the session started on.
 */
async function listSessions(req, res) {
  try {
    const sessions = await Event.aggregate([
      {
        $group: {
          _id: '$sessionId',
          eventCount: { $sum: 1 },
          firstSeen: { $min: '$timestamp' },
          lastSeen: { $max: '$timestamp' },
          pages: { $addToSet: '$pageUrl' },
        },
      },
      { $sort: { lastSeen: -1 } },
      {
        $project: {
          _id: 0,
          sessionId: '$_id',
          eventCount: 1,
          firstSeen: 1,
          lastSeen: 1,
          pageCount: { $size: '$pages' },
        },
      },
    ]);

    return res.json({ sessions });
  } catch (err) {
    console.error('[listSessions]', err);
    return res.status(500).json({ error: 'Failed to fetch sessions.' });
  }
}

/**
 * GET /api/sessions/:sessionId/events
 * Return the ordered list of events for a session (the user journey).
 */
async function getSessionEvents(req, res) {
  try {
    const { sessionId } = req.params;
    const events = await Event.find({ sessionId }).sort({ timestamp: 1, _id: 1 }).lean();

    if (events.length === 0) {
      return res.status(404).json({ error: 'No events found for this session.' });
    }

    return res.json({ sessionId, events });
  } catch (err) {
    console.error('[getSessionEvents]', err);
    return res.status(500).json({ error: 'Failed to fetch session events.' });
  }
}

/**
 * GET /api/pages
 * Return the distinct list of page URLs that have recorded events, so the
 * dashboard can populate a page selector for the heatmap view.
 */
async function listPages(req, res) {
  try {
    const pages = await Event.distinct('pageUrl');
    return res.json({ pages });
  } catch (err) {
    console.error('[listPages]', err);
    return res.status(500).json({ error: 'Failed to fetch pages.' });
  }
}

/**
 * GET /api/clicks?pageUrl=...
 * Return all click events for a given page, for heatmap rendering.
 */
async function getClicksForPage(req, res) {
  try {
    const { pageUrl } = req.query;
    if (!pageUrl) {
      return res.status(400).json({ error: 'pageUrl query parameter is required.' });
    }

    const clicks = await Event.find(
      { eventType: 'click', pageUrl },
      { x: 1, y: 1, viewportWidth: 1, viewportHeight: 1, timestamp: 1, sessionId: 1, _id: 0 }
    )
      .sort({ timestamp: 1 })
      .lean();

    return res.json({ pageUrl, count: clicks.length, clicks });
  } catch (err) {
    console.error('[getClicksForPage]', err);
    return res.status(500).json({ error: 'Failed to fetch click data.' });
  }
}

module.exports = {
  createEvent,
  listSessions,
  getSessionEvents,
  listPages,
  getClicksForPage,
};
