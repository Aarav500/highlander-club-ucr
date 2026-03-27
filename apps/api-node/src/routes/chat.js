// Club Chat API Routes
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

// GET /api/clubs/:id/messages — paginated chat history
router.get('/:id/messages', authenticate, async (req, res, next) => {
  try {
    const { before, limit = 50 } = req.query;
    const params = [req.params.id, limit];

    let query = `
      SELECT m.id, m.content, m.created_at,
             u.id as user_id, u.name as user_name, u.avatar_url
      FROM club_messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.club_id = $1
    `;

    if (before) {
      params.push(before);
      query += ` AND m.created_at < $${params.length}`;
    }

    query += ` ORDER BY m.created_at DESC LIMIT $2`;

    const { rows } = await pool.query(query, params);
    res.json(rows.reverse()); // chronological order
  } catch (err) { next(err); }
});

// POST /api/clubs/:id/messages — send message (must follow the club)
router.post('/:id/messages', authenticate, async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required' });
    }
    if (content.length > 1000) {
      return res.status(400).json({ error: 'Message too long (max 1000 chars)' });
    }

    // Check the club exists
    const club = await pool.query('SELECT id FROM clubs WHERE id = $1', [req.params.id]);
    if (club.rows.length === 0) return res.status(404).json({ error: 'Club not found' });

    const { rows } = await pool.query(`
      INSERT INTO club_messages (club_id, user_id, content)
      VALUES ($1, $2, $3)
      RETURNING id, content, created_at
    `, [req.params.id, req.user.id, content.trim()]);

    // Return with user info
    const user = await pool.query('SELECT name, avatar_url FROM users WHERE id = $1', [req.user.id]);
    res.status(201).json({
      ...rows[0],
      user_id: req.user.id,
      user_name: user.rows[0]?.name,
      avatar_url: user.rows[0]?.avatar_url,
    });
  } catch (err) { next(err); }
});

// DELETE /api/clubs/:id/messages/:msgId — admin delete
router.delete('/:id/messages/:msgId', authenticate, async (req, res, next) => {
  try {
    // Check admin
    const admin = await pool.query(
      'SELECT role FROM club_members WHERE user_id = $1 AND club_id = $2 AND role = $3',
      [req.user.id, req.params.id, 'admin']
    );

    // Allow admin or message author to delete
    const msg = await pool.query('SELECT user_id FROM club_messages WHERE id = $1', [req.params.msgId]);
    if (msg.rows.length === 0) return res.status(404).json({ error: 'Message not found' });

    if (admin.rows.length === 0 && msg.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    await pool.query('DELETE FROM club_messages WHERE id = $1', [req.params.msgId]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
