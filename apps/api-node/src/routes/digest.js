const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

// GET /api/digest/weekly — Top 5 events this week by RSVP count
router.get('/weekly', authenticate, async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT e.id, e.title, e.start_time, e.location,
             c.name as club_name,
             COUNT(r.user_id) as rsvp_count
      FROM events e
      JOIN clubs c ON e.club_id = c.id
      LEFT JOIN rsvps r ON r.event_id = e.id
      WHERE e.status = 'published'
        AND e.start_time BETWEEN now() AND now() + INTERVAL '7 days'
      GROUP BY e.id, c.name
      ORDER BY rsvp_count DESC
      LIMIT 5
    `);

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
