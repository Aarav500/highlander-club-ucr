// Attendance Points & Rewards API Routes
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

const POINT_VALUES = {
  rsvp: 5,
  checkin: 20,
  photo_upload: 10,
  first_event: 50,
  streak_weekly: 15,
};

// GET /api/points/me — get my points total + recent history
router.get('/me', authenticate, async (req, res, next) => {
  try {
    // Total points
    const total = await pool.query(
      'SELECT COALESCE(SUM(points), 0) as total FROM user_points WHERE user_id = $1',
      [req.user.id]
    );

    // Recent history
    const history = await pool.query(`
      SELECT p.id, p.points, p.reason, p.created_at,
             e.title as event_title
      FROM user_points p
      LEFT JOIN events e ON p.event_id = e.id
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC
      LIMIT 20
    `, [req.user.id]);

    // Rank
    const rank = await pool.query(`
      SELECT COUNT(*) + 1 as rank FROM (
        SELECT user_id, SUM(points) as total
        FROM user_points
        GROUP BY user_id
        HAVING SUM(points) > (SELECT COALESCE(SUM(points), 0) FROM user_points WHERE user_id = $1)
      ) ranked
    `, [req.user.id]);

    // Level calculation (every 100 points = 1 level)
    const totalPoints = parseInt(total.rows[0].total);
    const level = Math.floor(totalPoints / 100) + 1;
    const levelProgress = totalPoints % 100;

    res.json({
      total_points: totalPoints,
      rank: parseInt(rank.rows[0].rank),
      level,
      level_progress: levelProgress,
      next_level_at: level * 100,
      history: history.rows,
    });
  } catch (err) { next(err); }
});

// POST /api/points/checkin/:eventId — check in at event (earn points)
router.post('/checkin/:eventId', authenticate, async (req, res, next) => {
  try {
    // Check event exists and is happening now (or within 30 min)
    const event = await pool.query(`
      SELECT id, title FROM events WHERE id = $1
        AND start_time <= now() + INTERVAL '30 minutes'
        AND end_time >= now() - INTERVAL '30 minutes'
    `, [req.params.eventId]);

    if (event.rows.length === 0) {
      return res.status(400).json({ error: 'Event not found or not currently happening' });
    }

    // Check if already checked in
    const existing = await pool.query(
      "SELECT id FROM user_points WHERE user_id = $1 AND event_id = $2 AND reason = 'checkin'",
      [req.user.id, req.params.eventId]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Already checked in to this event' });
    }

    // Award check-in points
    await pool.query(
      'INSERT INTO user_points (user_id, event_id, points, reason) VALUES ($1, $2, $3, $4)',
      [req.user.id, req.params.eventId, POINT_VALUES.checkin, 'checkin']
    );

    // Check if this is user's first event ever — bonus points
    const eventCount = await pool.query(
      "SELECT COUNT(*) FROM user_points WHERE user_id = $1 AND reason = 'checkin'",
      [req.user.id]
    );
    if (parseInt(eventCount.rows[0].count) === 1) {
      await pool.query(
        'INSERT INTO user_points (user_id, event_id, points, reason) VALUES ($1, $2, $3, $4)',
        [req.user.id, req.params.eventId, POINT_VALUES.first_event, 'first_event']
      );
    }

    // Get updated total
    const total = await pool.query(
      'SELECT COALESCE(SUM(points), 0) as total FROM user_points WHERE user_id = $1',
      [req.user.id]
    );

    const totalPoints = parseInt(total.rows[0].total);
    res.json({
      message: `+${POINT_VALUES.checkin} points for checking in!`,
      points_earned: POINT_VALUES.checkin,
      total_points: totalPoints,
      level: Math.floor(totalPoints / 100) + 1,
      event_title: event.rows[0].title,
    });
  } catch (err) { next(err); }
});

// GET /api/points/leaderboard — top students
router.get('/leaderboard', authenticate, async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.name, u.avatar_url,
             COALESCE(SUM(p.points), 0) as total_points,
             COUNT(DISTINCT p.event_id) FILTER (WHERE p.reason = 'checkin') as events_attended
      FROM users u
      LEFT JOIN user_points p ON p.user_id = u.id
      GROUP BY u.id
      HAVING COALESCE(SUM(p.points), 0) > 0
      ORDER BY total_points DESC
      LIMIT 50
    `);

    // Add rank and level
    const leaderboard = rows.map((row, i) => ({
      ...row,
      rank: i + 1,
      total_points: parseInt(row.total_points),
      events_attended: parseInt(row.events_attended),
      level: Math.floor(parseInt(row.total_points) / 100) + 1,
    }));

    res.json(leaderboard);
  } catch (err) { next(err); }
});

module.exports = router;
