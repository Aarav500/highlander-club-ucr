const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

// GET /api/users/me — Current user profile
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await pool.query(
      'SELECT id, email, name, avatar_url, verified, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get followed clubs count
    const followCount = await pool.query('SELECT COUNT(*) FROM follows WHERE user_id = $1', [req.user.id]);

    // Get RSVP count
    const rsvpCount = await pool.query('SELECT COUNT(*) FROM rsvps WHERE user_id = $1', [req.user.id]);

    // Get friend count
    const friendCount = await pool.query('SELECT COUNT(*) FROM friendships WHERE user_id = $1', [req.user.id]);

    res.json({
      ...user.rows[0],
      following_count: parseInt(followCount.rows[0].count),
      rsvp_count: parseInt(rsvpCount.rows[0].count),
      friend_count: parseInt(friendCount.rows[0].count)
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/me — Update profile
router.put('/me', authenticate, async (req, res, next) => {
  try {
    const { name, avatar_url } = req.body;

    const result = await pool.query(`
      UPDATE users SET
        name = COALESCE($2, name),
        avatar_url = COALESCE($3, avatar_url)
      WHERE id = $1
      RETURNING id, email, name, avatar_url, verified
    `, [req.user.id, name, avatar_url]);

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /api/users/me/feed — Personalized feed (followed clubs first, then popular)
router.get('/me/feed', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(`
      SELECT e.*, c.name as club_name, c.logo_url as club_logo,
             COUNT(r.user_id) as rsvp_count,
             EXISTS(SELECT 1 FROM rsvps WHERE user_id = $1 AND event_id = e.id) as user_rsvped,
             EXISTS(SELECT 1 FROM follows WHERE user_id = $1 AND club_id = e.club_id) as from_followed_club,
             (SELECT COUNT(*) FROM rsvps r2 JOIN friendships f ON f.friend_id = r2.user_id WHERE f.user_id = $1 AND r2.event_id = e.id) as friends_going
      FROM events e
      JOIN clubs c ON e.club_id = c.id
      LEFT JOIN rsvps r ON r.event_id = e.id
      WHERE e.status = 'published' AND e.end_time >= now()
      GROUP BY e.id, c.name, c.logo_url
      ORDER BY
        EXISTS(SELECT 1 FROM follows WHERE user_id = $1 AND club_id = e.club_id) DESC,
        e.start_time ASC
      LIMIT $2 OFFSET $3
    `, [req.user.id, limit, offset]);

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/users/me/friends-activity — Events friends RSVP'd to
router.get('/me/friends-activity', authenticate, async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT e.id, e.title, e.image_url, e.start_time, e.location,
             c.name as club_name, c.logo_url as club_logo,
             COUNT(DISTINCT r.user_id) as friends_going,
             array_agg(DISTINCT u.name) as friend_names
      FROM events e
      JOIN clubs c ON e.club_id = c.id
      JOIN rsvps r ON r.event_id = e.id
      JOIN friendships f ON f.friend_id = r.user_id AND f.user_id = $1
      JOIN users u ON u.id = r.user_id
      WHERE e.status = 'published' AND e.end_time >= now()
      GROUP BY e.id, e.title, e.image_url, e.start_time, e.location, c.name, c.logo_url
      ORDER BY friends_going DESC, e.start_time ASC
      LIMIT 20
    `, [req.user.id]);

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/users/me/friends — Add friend by email
router.post('/me/friends', authenticate, async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: 'Email is required' });

    const friend = await pool.query('SELECT id, name, email FROM users WHERE email = $1', [email]);
    if (friend.rows.length === 0) {
      return res.status(404).json({ error: 'User not found. They need to sign up first.' });
    }

    if (friend.rows[0].id === req.user.id) {
      return res.status(400).json({ error: 'You cannot add yourself as a friend' });
    }

    // Bidirectional friendship
    await pool.query(`
      INSERT INTO friendships (user_id, friend_id) VALUES ($1, $2), ($2, $1)
      ON CONFLICT DO NOTHING
    `, [req.user.id, friend.rows[0].id]);

    res.json({ ok: true, friend: { id: friend.rows[0].id, name: friend.rows[0].name } });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/me/friends — List friends
router.get('/me/friends', authenticate, async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.avatar_url
      FROM friendships f
      JOIN users u ON f.friend_id = u.id
      WHERE f.user_id = $1
      ORDER BY u.name ASC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
