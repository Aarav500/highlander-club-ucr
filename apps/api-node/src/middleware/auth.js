const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}

const JWT_SECRET = process.env.JWT_SECRET || 'highlander-events-dev-secret';

// ─── Role hierarchy (higher index = more permissions) ───────────────────────
const ROLE_HIERARCHY = {
  member: 0,
  moderator: 1,
  officer: 2,
  vice_president: 3,
  president: 4,
};

// Roles that can perform admin-level actions (create events, manage settings)
const ADMIN_ROLES = ['president', 'vice_president', 'officer'];

// Roles that can manage staff (invite, change roles)
const STAFF_MANAGEMENT_ROLES = ['president', 'vice_president'];

// ─── Verify JWT token — attaches user to req.user ───────────────────────────
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

// ─── Check if user has a specific role (or higher) in a club ────────────────
// Usage: requireClubRole('officer') — requires officer, VP, or president
function requireClubRole(minimumRole = 'officer', clubIdParam = 'id') {
  const minLevel = ROLE_HIERARCHY[minimumRole] || 0;

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

      if (result.rows.length === 0) {
        return res.status(403).json({ error: 'You are not a member of this club' });
      }

      const userRole = result.rows[0].role;
      const userLevel = ROLE_HIERARCHY[userRole] || 0;

      if (userLevel < minLevel) {
        return res.status(403).json({ 
          error: `Requires ${minimumRole} or higher role`,
          your_role: userRole
        });
      }

      // Attach the user's club role for downstream use
      req.clubRole = userRole;
      req.clubRoleLevel = userLevel;
      next();
    } catch (err) {
      next(err);
    }
  };
}

// ─── Legacy compatibility: Check if user is admin of a specific club ────────
// Now checks for officer+ (president, vice_president, officer)
function requireClubAdmin(clubIdParam = 'id') {
  return requireClubRole('officer', clubIdParam);
}

// ─── Check if user is president of a club ───────────────────────────────────
function requireClubPresident(clubIdParam = 'id') {
  return requireClubRole('president', clubIdParam);
}

// ─── Generate JWT for a user ────────────────────────────────────────────────
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name || user.display_name },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

module.exports = { 
  authenticate, 
  requireClubRole,
  requireClubAdmin, 
  requireClubPresident,
  generateToken, 
  JWT_SECRET,
  ROLE_HIERARCHY,
  ADMIN_ROLES,
  STAFF_MANAGEMENT_ROLES,
};
