const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate, optionalAuth, requireClubAdmin, ADMIN_ROLES } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// GET /api/events — Feed with filters (only published) — public, personalized if authed
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { category, club_id, date, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    const conditions = ["e.status = 'published'"];

    if (category) {
      params.push(category);
      conditions.push(`e.category = $${params.length}`);
    }
    if (club_id) {
      params.push(club_id);
      conditions.push(`e.club_id = $${params.length}`);
    }
    if (date) {
      params.push(date);
      conditions.push(`DATE(e.start_time) = $${params.length}`);
    }

    const userId = req.user?.id || null;
    params.push(userId, limit, offset);
    const userIdx = params.length - 2;
    const limitIdx = params.length - 1;
    const offsetIdx = params.length;

    const query = `
      SELECT e.*, c.name as club_name, c.logo_url as club_logo,
             COUNT(r.user_id) as rsvp_count,
             CASE WHEN $${userIdx}::int IS NOT NULL
               THEN EXISTS(SELECT 1 FROM rsvps WHERE user_id = $${userIdx} AND event_id = e.id)
               ELSE false END as user_rsvped
      FROM events e
      JOIN clubs c ON e.club_id = c.id
      LEFT JOIN rsvps r ON r.event_id = e.id
      WHERE ${conditions.join(' AND ')}
      GROUP BY e.id, c.name, c.logo_url
      ORDER BY e.start_time ASC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/events/happening-now
router.get('/happening-now', authenticate, async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT e.*, c.name as club_name, c.logo_url as club_logo,
             COUNT(r.user_id) as rsvp_count
      FROM events e
      JOIN clubs c ON e.club_id = c.id
      LEFT JOIN rsvps r ON r.event_id = e.id
      WHERE e.status = 'published'
        AND e.start_time <= now()
        AND e.end_time >= now()
      GROUP BY e.id, c.name, c.logo_url
      ORDER BY e.start_time ASC
    `);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/events/recommended — AI-powered personalized recommendations
router.get('/recommended', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Strategy: collaborative filtering + category affinity
    // 1. Find events RSVP'd by users who like similar events
    // 2. Boost events from followed clubs
    // 3. Boost events matching user's preferred categories
    // 4. Exclude events user already RSVP'd to
    const result = await pool.query(`
      WITH user_categories AS (
        -- Categories the user has RSVP'd to before
        SELECT DISTINCT e.category, COUNT(*) as affinity
        FROM rsvps r
        JOIN events e ON r.event_id = e.id
        WHERE r.user_id = $1
        GROUP BY e.category
      ),
      similar_users AS (
        -- Users who RSVP'd to the same events as me
        SELECT r2.user_id
        FROM rsvps r1
        JOIN rsvps r2 ON r1.event_id = r2.event_id AND r2.user_id != $1
        WHERE r1.user_id = $1
        GROUP BY r2.user_id
        HAVING COUNT(*) >= 1
      ),
      scored_events AS (
        SELECT e.*, c.name as club_name, c.logo_url as club_logo,
               COUNT(DISTINCT r.user_id) as rsvp_count,
               -- Scoring: category affinity (0-3) + followed club (0-2) + similar user RSVPs (0-5)
               COALESCE(uc.affinity, 0) * 3 +
               CASE WHEN EXISTS(SELECT 1 FROM follows WHERE user_id = $1 AND club_id = e.club_id) THEN 2 ELSE 0 END +
               COUNT(DISTINCT CASE WHEN r.user_id IN (SELECT user_id FROM similar_users) THEN r.user_id END) * 1 +
               COUNT(DISTINCT r.user_id) * 0.1
               as recommendation_score
        FROM events e
        JOIN clubs c ON e.club_id = c.id
        LEFT JOIN rsvps r ON r.event_id = e.id
        LEFT JOIN user_categories uc ON uc.category = e.category
        WHERE e.status = 'published'
          AND e.end_time >= now()
          AND NOT EXISTS(SELECT 1 FROM rsvps WHERE user_id = $1 AND event_id = e.id)
        GROUP BY e.id, c.name, c.logo_url, uc.affinity
      )
      SELECT *, ROUND(recommendation_score::numeric, 1) as score
      FROM scored_events
      ORDER BY recommendation_score DESC, start_time ASC
      LIMIT 10
    `, [userId]);

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/events/:id — Event detail (increments views)
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    // Increment views
    await pool.query('UPDATE events SET views = views + 1 WHERE id = $1', [req.params.id]);

    const result = await pool.query(`
      SELECT e.*, c.name as club_name, c.logo_url as club_logo, c.id as club_id,
             COUNT(r.user_id) as rsvp_count,
             EXISTS(SELECT 1 FROM rsvps WHERE user_id = $2 AND event_id = e.id) as user_rsvped,
             EXISTS(SELECT 1 FROM club_members m WHERE m.user_id = $2 AND m.club_id = c.id AND m.role IN ('president','vice_president','officer')) as is_admin
      FROM events e
      JOIN clubs c ON e.club_id = c.id
      LEFT JOIN rsvps r ON r.event_id = e.id
      WHERE e.id = $1
      GROUP BY e.id, c.name, c.logo_url, c.id
    `, [req.params.id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /api/events/:id/attendees
router.get('/:id/attendees', authenticate, async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.avatar_url, r.created_at as rsvped_at
      FROM rsvps r
      JOIN users u ON r.user_id = u.id
      WHERE r.event_id = $1
      ORDER BY r.created_at DESC
    `, [req.params.id]);

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/events/:id/friends — Friends who RSVP'd
router.get('/:id/friends', authenticate, async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.avatar_url
      FROM rsvps r
      JOIN users u ON r.user_id = u.id
      JOIN friendships f ON f.friend_id = r.user_id AND f.user_id = $2
      WHERE r.event_id = $1
    `, [req.params.id, req.user.id]);

    res.json({ friends: result.rows, count: result.rows.length });
  } catch (err) {
    next(err);
  }
});

// POST /api/events — Create event (club admin only)
// Accepts optional multipart 'image' field; falls back to JSON image_url
router.post('/', authenticate, upload.single('image'), async (req, res, next) => {
  try {
    const { club_id, title, description, video_url, location, lat, lng, category, status, max_attendees, start_time, end_time } = req.body;
    const image_url = req.file ? req.file.location : req.body.image_url;

    if (!club_id || !title || !category || !start_time || !end_time) {
      return res.status(400).json({ error: 'club_id, title, category, start_time, and end_time are required' });
    }

    // Check admin
    const admin = await pool.query(
      "SELECT role FROM club_members WHERE user_id = $1 AND club_id = $2 AND role IN ('president','vice_president','officer')",
      [req.user.id, club_id]
    );
    if (admin.rows.length === 0) {
      return res.status(403).json({ error: 'Club admin access required' });
    }

    const result = await pool.query(`
      INSERT INTO events (club_id, title, description, image_url, video_url, location, lat, lng, category, status, max_attendees, start_time, end_time)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [club_id, title, description || null, image_url || null, video_url || null, location || null, lat || null, lng || null, category, status || 'published', max_attendees || null, start_time, end_time]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/events/:id — Update event (club admin only)
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const event = await pool.query('SELECT club_id FROM events WHERE id = $1', [req.params.id]);
    if (event.rows.length === 0) return res.status(404).json({ error: 'Event not found' });

    const admin = await pool.query(
      "SELECT role FROM club_members WHERE user_id = $1 AND club_id = $2 AND role IN ('president','vice_president','officer')",
      [req.user.id, event.rows[0].club_id]
    );
    if (admin.rows.length === 0) return res.status(403).json({ error: 'Club admin access required' });

    const { title, description, image_url, video_url, location, lat, lng, category, status, max_attendees, start_time, end_time } = req.body;

    const result = await pool.query(`
      UPDATE events SET
        title = COALESCE($2, title), description = COALESCE($3, description),
        image_url = COALESCE($4, image_url), video_url = COALESCE($5, video_url),
        location = COALESCE($6, location), lat = COALESCE($7, lat), lng = COALESCE($8, lng),
        category = COALESCE($9, category), status = COALESCE($10, status),
        max_attendees = COALESCE($11, max_attendees),
        start_time = COALESCE($12, start_time), end_time = COALESCE($13, end_time)
      WHERE id = $1
      RETURNING *
    `, [req.params.id, title, description, image_url, video_url, location, lat, lng, category, status, max_attendees, start_time, end_time]);

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/events/:id — Soft delete (set status='cancelled')
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const event = await pool.query('SELECT club_id FROM events WHERE id = $1', [req.params.id]);
    if (event.rows.length === 0) return res.status(404).json({ error: 'Event not found' });

    const admin = await pool.query(
      "SELECT role FROM club_members WHERE user_id = $1 AND club_id = $2 AND role IN ('president','vice_president','officer')",
      [req.user.id, event.rows[0].club_id]
    );
    if (admin.rows.length === 0) return res.status(403).json({ error: 'Club admin access required' });

    await pool.query("UPDATE events SET status = 'cancelled' WHERE id = $1", [req.params.id]);
    res.json({ ok: true, message: 'Event cancelled' });
  } catch (err) {
    next(err);
  }
});

// POST /api/events/:id/rsvp — Toggle RSVP
router.post('/:id/rsvp', authenticate, async (req, res, next) => {
  try {
    const eventId = req.params.id;

    // Check if already RSVP'd
    const existing = await pool.query(
      'SELECT 1 FROM rsvps WHERE user_id = $1 AND event_id = $2',
      [req.user.id, eventId]
    );

    if (existing.rows.length > 0) {
      // Un-RSVP
      await pool.query('DELETE FROM rsvps WHERE user_id = $1 AND event_id = $2', [req.user.id, eventId]);
    } else {
      // Check max_attendees
      const event = await pool.query('SELECT max_attendees FROM events WHERE id = $1', [eventId]);
      if (event.rows.length === 0) return res.status(404).json({ error: 'Event not found' });

      if (event.rows[0].max_attendees) {
        const count = await pool.query('SELECT COUNT(*) FROM rsvps WHERE event_id = $1', [eventId]);
        if (parseInt(count.rows[0].count) >= event.rows[0].max_attendees) {
          return res.status(409).json({ error: 'Event is full', max_attendees: event.rows[0].max_attendees });
        }
      }

      await pool.query('INSERT INTO rsvps (user_id, event_id) VALUES ($1, $2)', [req.user.id, eventId]);
    }

    // Return updated count
    const count = await pool.query('SELECT COUNT(*) FROM rsvps WHERE event_id = $1', [eventId]);
    const rsvped = existing.rows.length === 0; // toggled to RSVP'd

    res.json({ rsvped, rsvp_count: parseInt(count.rows[0].count) });
  } catch (err) {
    next(err);
  }
});

// GET /api/events/:id/photos — Event photo gallery
router.get('/:id/photos', authenticate, async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.photo_url, p.created_at, u.name as uploader_name, u.avatar_url as uploader_avatar
      FROM event_photos p
      JOIN users u ON p.user_id = u.id
      WHERE p.event_id = $1
      ORDER BY p.created_at DESC
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/events/:id/photos — Upload a photo to the gallery
router.post('/:id/photos', authenticate, async (req, res, next) => {
  try {
    const { photo_url } = req.body;
    if (!photo_url) return res.status(400).json({ error: 'photo_url is required' });

    const event = await pool.query('SELECT id FROM events WHERE id = $1', [req.params.id]);
    if (event.rows.length === 0) return res.status(404).json({ error: 'Event not found' });

    const result = await pool.query(`
      INSERT INTO event_photos (event_id, user_id, photo_url)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [req.params.id, req.user.id, photo_url]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/events/:id/photos/:photoId — Admin deletes a photo
router.delete('/:id/photos/:photoId', authenticate, async (req, res, next) => {
  try {
    const event = await pool.query('SELECT club_id FROM events WHERE id = $1', [req.params.id]);
    if (event.rows.length === 0) return res.status(404).json({ error: 'Event not found' });

    const admin = await pool.query(
      "SELECT role FROM club_members WHERE user_id = $1 AND club_id = $2 AND role IN ('president','vice_president','officer')",
      [req.user.id, event.rows[0].club_id]
    );
    if (admin.rows.length === 0) return res.status(403).json({ error: 'Club admin access required' });

    await pool.query('DELETE FROM event_photos WHERE id = $1 AND event_id = $2', [req.params.photoId, req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
