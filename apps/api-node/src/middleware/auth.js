const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}

const JWT_SECRET = process.env.JWT_SECRET || 'highlander-events-dev-secret';

// Verify JWT token — attaches user to req.user
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Check if user is admin of a specific club
// Usage: requireClubAdmin('club_id_param_name')
function requireClubAdmin(clubIdParam = 'id') {
  return async (req, res, next) => {
    const clubId = req.params[clubIdParam] || req.body.club_id;

    if (!clubId) {
      return res.status(400).json({ error: 'Club ID required' });
    }

    try {
      const result = await pool.query(
        'SELECT role FROM club_members WHERE user_id = $1 AND club_id = $2',
        [req.user.id, clubId]
      );

      if (result.rows.length === 0 || result.rows[0].role !== 'admin') {
        return res.status(403).json({ error: 'Club admin access required' });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

// Generate JWT for a user
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

module.exports = { authenticate, requireClubAdmin, generateToken, JWT_SECRET };
