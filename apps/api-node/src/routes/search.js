const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

// GET /api/search?q=keyword&type=events|clubs|all
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { q, type = 'all' } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const searchTerm = `%${q.trim()}%`;
    const results = {};

    if (type === 'all' || type === 'events') {
      const events = await pool.query(`
        SELECT e.id, e.title, e.description, e.image_url, e.start_time, e.location, e.category,
               c.name as club_name, c.logo_url as club_logo,
               COUNT(r.user_id) as rsvp_count
        FROM events e
        JOIN clubs c ON e.club_id = c.id
        LEFT JOIN rsvps r ON r.event_id = e.id
        WHERE e.status = 'published'
          AND e.end_time >= now()
          AND (e.title ILIKE $1 OR e.description ILIKE $1 OR e.location ILIKE $1)
        GROUP BY e.id, c.name, c.logo_url
        ORDER BY e.start_time ASC
        LIMIT 20
      `, [searchTerm]);

      results.events = events.rows;
    }

    if (type === 'all' || type === 'clubs') {
      const clubs = await pool.query(`
        SELECT c.id, c.name, c.description, c.logo_url, c.category,
               COUNT(DISTINCT f.user_id) as follower_count
        FROM clubs c
        LEFT JOIN follows f ON f.club_id = c.id
        WHERE c.name ILIKE $1 OR c.description ILIKE $1
        GROUP BY c.id
        ORDER BY follower_count DESC
        LIMIT 20
      `, [searchTerm]);

      results.clubs = clubs.rows;
    }

    res.json(results);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
