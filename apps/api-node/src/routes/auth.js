const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const pool = require('../db/pool');
const { generateToken } = require('../middleware/auth');

// Rate limit login: 5 requests per minute per IP
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts. Please try again in a minute.' }
});

// POST /api/auth/login — Send verification code to @ucr.edu email
router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!email.endsWith('@ucr.edu')) {
      return res.status(400).json({ error: 'Only @ucr.edu email addresses are allowed' });
    }

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate old codes for this email
    await pool.query(
      'UPDATE login_codes SET used = true WHERE email = $1 AND used = false',
      [email]
    );

    // Store new code
    await pool.query(
      'INSERT INTO login_codes (email, code, expires_at) VALUES ($1, $2, $3)',
      [email, code, expiresAt]
    );

    // In production, send email via nodemailer
    // For dev, log the code
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send email via nodemailer/SES
      console.log(`📧 Verification code sent to ${email}`);
    } else {
      console.log(`🔑 Dev mode — verification code for ${email}: ${code}`);
    }

    res.json({ message: 'Verification code sent to your @ucr.edu email' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/verify — Verify code and return JWT
router.post('/verify', async (req, res, next) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    // Find valid code
    const result = await pool.query(
      `SELECT id FROM login_codes 
       WHERE email = $1 AND code = $2 AND used = false AND expires_at > now()
       ORDER BY created_at DESC LIMIT 1`,
      [email, code]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired code' });
    }

    // Mark code as used
    await pool.query('UPDATE login_codes SET used = true WHERE id = $1', [result.rows[0].id]);

    // Find or create user
    let user;
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (existing.rows.length > 0) {
      user = existing.rows[0];
      if (!user.verified) {
        await pool.query('UPDATE users SET verified = true WHERE id = $1', [user.id]);
        user.verified = true;
      }
    } else {
      // Create new user with name from email prefix
      const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const created = await pool.query(
        'INSERT INTO users (email, name, verified) VALUES ($1, $2, true) RETURNING *',
        [email, name]
      );
      user = created.rows[0];
    }

    const token = generateToken(user);

    res.json({
      user: { id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url },
      token
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout — Invalidate token (client-side only for JWT)
router.post('/logout', (req, res) => {
  // JWT is stateless; client removes the token
  res.json({ ok: true, message: 'Logged out successfully' });
});

// POST /api/auth/dev-login — DEV ONLY: bypass email verification for testing
if (process.env.NODE_ENV !== 'production') {
  router.post('/dev-login', async (req, res, next) => {
    try {
      const { email } = req.body;
      if (!email || !email.endsWith('@ucr.edu')) {
        return res.status(400).json({ error: 'Valid @ucr.edu email required' });
      }
      // Find or create user
      let user;
      const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        user = existing.rows[0];
      } else {
        const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const created = await pool.query('INSERT INTO users (email, name, verified) VALUES ($1, $2, true) RETURNING *', [email, name]);
        user = created.rows[0];
      }
      const token = generateToken(user);
      console.log('🔓 Dev login for:', email);
      res.json({ user: { id: user.id, email: user.email, name: user.name }, token });
    } catch (err) { next(err); }
  });
}

module.exports = router;
