const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

// POST /api/notifications/register — Store Expo push token
router.post('/register', authenticate, async (req, res, next) => {
  try {
    const { push_token } = req.body;

    if (!push_token) {
      return res.status(400).json({ error: 'push_token is required' });
    }

    await pool.query(
      'UPDATE users SET push_token = $1 WHERE id = $2',
      [push_token, req.user.id]
    );

    res.json({ ok: true, message: 'Push token registered' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
