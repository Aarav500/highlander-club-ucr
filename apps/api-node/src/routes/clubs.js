const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// GET /api/clubs — List clubs
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const params = [];
    const conditions = [];

    if (category) {
      params.push(category);
      conditions.push(`c.category = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(c.name ILIKE $${params.length} OR c.description ILIKE $${params.length})`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    params.push(req.user.id);
    const userIdx = params.length;

    const result = await pool.query(`
      SELECT c.*, 
             COUNT(DISTINCT f.user_id) as follower_count,
             COUNT(DISTINCT e.id) as event_count,
             EXISTS(SELECT 1 FROM follows WHERE user_id = $${userIdx} AND club_id = c.id) as user_follows
      FROM clubs c
      LEFT JOIN follows f ON f.club_id = c.id
      LEFT JOIN events e ON e.club_id = c.id AND e.status = 'published'
      ${where}
      GROUP BY c.id
      ORDER BY follower_count DESC
    `, params);

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/clubs/:id — Club detail
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const club = await pool.query(`
      SELECT c.*,
             COUNT(DISTINCT f.user_id) as follower_count,
             EXISTS(SELECT 1 FROM follows WHERE user_id = $2 AND club_id = c.id) as user_follows,
             EXISTS(SELECT 1 FROM club_members m WHERE m.user_id = $2 AND m.club_id = c.id AND m.role = 'admin') as is_admin
      FROM clubs c
      LEFT JOIN follows f ON f.club_id = c.id
      WHERE c.id = $1
      GROUP BY c.id
    `, [req.params.id, req.user.id]);

    if (club.rows.length === 0) {
      return res.status(404).json({ error: 'Club not found' });
    }

    // Get upcoming events
    const events = await pool.query(`
      SELECT e.*, COUNT(r.user_id) as rsvp_count
      FROM events e
      LEFT JOIN rsvps r ON r.event_id = e.id
      WHERE e.club_id = $1 AND e.status = 'published' AND e.end_time >= now()
      GROUP BY e.id
      ORDER BY e.start_time ASC
      LIMIT 10
    `, [req.params.id]);

    res.json({ ...club.rows[0], upcoming_events: events.rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/clubs — Create club (creator becomes admin)
// Accepts optional multipart 'logo' field; falls back to JSON logo_url
router.post('/', authenticate, upload.single('logo'), async (req, res, next) => {
  try {
    const { name, description, cover_url, category, instagram } = req.body;
    const logo_url = req.file ? req.file.location : req.body.logo_url;

    if (!name || !category) {
      return res.status(400).json({ error: 'Name and category are required' });
    }

    const result = await pool.query(`
      INSERT INTO clubs (name, description, logo_url, cover_url, category, instagram, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [name, description || null, logo_url || null, cover_url || null, category, instagram || null, req.user.id]);

    // Make creator an admin
    await pool.query(
      'INSERT INTO club_members (user_id, club_id, role) VALUES ($1, $2, $3)',
      [req.user.id, result.rows[0].id, 'admin']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/clubs/:id/follow — Toggle follow
router.post('/:id/follow', authenticate, async (req, res, next) => {
  try {
    const existing = await pool.query(
      'SELECT 1 FROM follows WHERE user_id = $1 AND club_id = $2',
      [req.user.id, req.params.id]
    );

    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM follows WHERE user_id = $1 AND club_id = $2', [req.user.id, req.params.id]);
    } else {
      await pool.query('INSERT INTO follows (user_id, club_id) VALUES ($1, $2)', [req.user.id, req.params.id]);
    }

    const count = await pool.query('SELECT COUNT(*) FROM follows WHERE club_id = $1', [req.params.id]);
    const following = existing.rows.length === 0;

    res.json({ following, follower_count: parseInt(count.rows[0].count) });
  } catch (err) {
    next(err);
  }
});

// GET /api/clubs/:id/dashboard — Officer analytics
router.get('/:id/dashboard', authenticate, async (req, res, next) => {
  try {
    // Check admin
    const admin = await pool.query(
      'SELECT role FROM club_members WHERE user_id = $1 AND club_id = $2 AND role = $3',
      [req.user.id, req.params.id, 'admin']
    );
    if (admin.rows.length === 0) {
      return res.status(403).json({ error: 'Club admin access required' });
    }

    const clubId = req.params.id;

    // Follower count
    const followers = await pool.query('SELECT COUNT(*) FROM follows WHERE club_id = $1', [clubId]);

    // Total events
    const eventCount = await pool.query(
      "SELECT COUNT(*) FROM events WHERE club_id = $1 AND status != 'cancelled'",
      [clubId]
    );

    // Total views across all events
    const totalViews = await pool.query(
      "SELECT COALESCE(SUM(views), 0) as total FROM events WHERE club_id = $1",
      [clubId]
    );

    // Total RSVPs across all events
    const totalRsvps = await pool.query(
      'SELECT COUNT(*) FROM rsvps r JOIN events e ON r.event_id = e.id WHERE e.club_id = $1',
      [clubId]
    );

    // Per-event metrics
    const eventMetrics = await pool.query(`
      SELECT e.id, e.title, e.start_time, e.views,
             COUNT(r.user_id) as rsvp_count
      FROM events e
      LEFT JOIN rsvps r ON r.event_id = e.id
      WHERE e.club_id = $1
      GROUP BY e.id
      ORDER BY e.start_time DESC
      LIMIT 20
    `, [clubId]);

    res.json({
      follower_count: parseInt(followers.rows[0].count),
      event_count: parseInt(eventCount.rows[0].count),
      total_views: parseInt(totalViews.rows[0].total),
      total_rsvps: parseInt(totalRsvps.rows[0].count),
      events: eventMetrics.rows
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
