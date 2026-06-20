const mongoose = require('mongoose');

const { Schema } = mongoose;

const eventSchema = new Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      enum: ['page_view', 'click'],
      index: true,
    },
    pageUrl: {
      type: String,
      required: true,
      index: true,
    },
    // Client-reported time the event occurred. Stored separately from
    // Mongo's own createdAt so the dashboard can sort/display using the
    // browser's notion of "when it happened".
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    // Only present for click events.
    x: { type: Number },
    y: { type: Number },
    // Viewport size at the time of the click/page_view, useful for
    // normalizing heatmap coordinates across different screen sizes.
    viewportWidth: { type: Number },
    viewportHeight: { type: Number },
    referrer: { type: String },
    userAgent: { type: String },
  },
  {
    timestamps: true, // adds createdAt / updatedAt (server receipt time)
  }
);

// Common query patterns: events for a session in order, and clicks for a page.
eventSchema.index({ sessionId: 1, timestamp: 1 });
eventSchema.index({ eventType: 1, pageUrl: 1 });

module.exports = mongoose.model('Event', eventSchema);
