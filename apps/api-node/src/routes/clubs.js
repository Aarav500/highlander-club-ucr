const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate, optionalAuth, requireClubRole, requireClubAdmin, requireClubPresident, ROLE_HIERARCHY, ADMIN_ROLES } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// ═══════════════════════════════════════════════════════════════════════════════
// CLUB ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/clubs — List clubs — public, personalized if authed
router.get('/', optionalAuth, async (req, res, next) => {
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

    const userId = req.user?.id || null;
    params.push(userId);
    const userIdx = params.length;

    const result = await pool.query(`
      SELECT c.*,
             COUNT(DISTINCT f.user_id) as follower_count,
             COUNT(DISTINCT e.id) as event_count,
             CASE WHEN $${userIdx}::int IS NOT NULL
               THEN EXISTS(SELECT 1 FROM follows WHERE user_id = $${userIdx} AND club_id = c.id)
               ELSE false END as user_follows,
             CASE WHEN $${userIdx}::int IS NOT NULL
               THEN (SELECT role FROM club_members WHERE user_id = $${userIdx} AND club_id = c.id)
               ELSE NULL END as user_role
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
             (SELECT role FROM club_members m WHERE m.user_id = $2 AND m.club_id = c.id) as user_role
      FROM clubs c
      LEFT JOIN follows f ON f.club_id = c.id
      WHERE c.id = $1
      GROUP BY c.id
    `, [req.params.id, req.user.id]);

    if (club.rows.length === 0) {
      return res.status(404).json({ error: 'Club not found' });
    }

    // Determine admin access (officer+)
    const userRole = club.rows[0].user_role;
    const isAdmin = userRole && ADMIN_ROLES.includes(userRole);

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

    res.json({ ...club.rows[0], is_admin: isAdmin, upcoming_events: events.rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/clubs — Create club (creator becomes president)
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

    // Make creator the president
    await pool.query(
      'INSERT INTO club_members (user_id, club_id, role) VALUES ($1, $2, $3)',
      [req.user.id, result.rows[0].id, 'president']
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
router.get('/:id/dashboard', authenticate, requireClubRole('officer'), async (req, res, next) => {
  try {
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

    // Total members
    const memberCount = await pool.query('SELECT COUNT(*) FROM club_members WHERE club_id = $1', [clubId]);

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
      member_count: parseInt(memberCount.rows[0].count),
      your_role: req.clubRole,
      events: eventMetrics.rows
    });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// STAFF MANAGEMENT ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/clubs/:id/staff — List all staff/members with roles
router.get('/:id/staff', authenticate, async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.email, u.name, u.display_name, u.avatar_url, u.ucr_netid,
             cm.role, cm.joined_at
      FROM club_members cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.club_id = $1
      ORDER BY 
        CASE cm.role 
          WHEN 'president' THEN 1
          WHEN 'vice_president' THEN 2
          WHEN 'officer' THEN 3
          WHEN 'moderator' THEN 4
          WHEN 'member' THEN 5
        END ASC,
        cm.joined_at ASC
    `, [req.params.id]);

    // Check requesting user's role
    const userRole = await pool.query(
      'SELECT role FROM club_members WHERE user_id = $1 AND club_id = $2',
      [req.user.id, req.params.id]
    );

    res.json({
      staff: result.rows,
      your_role: userRole.rows[0]?.role || null,
      total: result.rows.length,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/clubs/:id/staff/invite — Invite a @ucr.edu user to a staff role
router.post('/:id/staff/invite', authenticate, requireClubRole('vice_president'), async (req, res, next) => {
  try {
    const { email, role } = req.body;
    const clubId = req.params.id;

    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role are required' });
    }

    if (!email.endsWith('@ucr.edu')) {
      return res.status(400).json({ error: 'Only @ucr.edu emails can be invited' });
    }

    const validRoles = ['vice_president', 'officer', 'moderator'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Role must be one of: ${validRoles.join(', ')}` });
    }

    // Can't invite someone to a role higher than yours
    const inviterLevel = ROLE_HIERARCHY[req.clubRole] || 0;
    const inviteeLevel = ROLE_HIERARCHY[role] || 0;
    if (inviteeLevel >= inviterLevel) {
      return res.status(403).json({ error: 'Cannot invite someone to a role equal to or higher than yours' });
    }

    // Check if already a member
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      const existingMember = await pool.query(
        'SELECT role FROM club_members WHERE user_id = $1 AND club_id = $2',
        [existingUser.rows[0].id, clubId]
      );
      if (existingMember.rows.length > 0) {
        return res.status(409).json({ error: 'This user is already a club member', current_role: existingMember.rows[0].role });
      }
    }

    // Check for existing pending invite
    const existingInvite = await pool.query(
      "SELECT id FROM club_staff_invites WHERE club_id = $1 AND invited_email = $2 AND status = 'pending'",
      [clubId, email]
    );
    if (existingInvite.rows.length > 0) {
      return res.status(409).json({ error: 'A pending invitation already exists for this email' });
    }

    // Create invitation
    const invite = await pool.query(
      `INSERT INTO club_staff_invites (club_id, invited_email, role, invited_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [clubId, email, role, req.user.id]
    );

    // If the user already exists, immediately accept the invite
    if (existingUser.rows.length > 0) {
      await pool.query(
        'INSERT INTO club_members (user_id, club_id, role) VALUES ($1, $2, $3) ON CONFLICT (user_id, club_id) DO UPDATE SET role = $3',
        [existingUser.rows[0].id, clubId, role]
      );
      await pool.query("UPDATE club_staff_invites SET status = 'accepted' WHERE id = $1", [invite.rows[0].id]);
      return res.status(201).json({ ...invite.rows[0], status: 'accepted', message: 'User exists — added to club immediately' });
    }

    res.status(201).json({ ...invite.rows[0], message: 'Invitation created. Will be accepted when user signs up.' });
  } catch (err) {
    next(err);
  }
});

// GET /api/clubs/:id/staff/invites — List pending invitations
router.get('/:id/staff/invites', authenticate, requireClubRole('officer'), async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT si.*, u.name as invited_by_name, u.email as invited_by_email
      FROM club_staff_invites si
      LEFT JOIN users u ON si.invited_by = u.id
      WHERE si.club_id = $1
      ORDER BY si.created_at DESC
    `, [req.params.id]);

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// PUT /api/clubs/:id/staff/:userId — Change a staff member's role
router.put('/:id/staff/:userId', authenticate, requireClubRole('vice_president'), async (req, res, next) => {
  try {
    const { role } = req.body;
    const clubId = req.params.id;
    const targetUserId = req.params.userId;

    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }

    const validRoles = ['vice_president', 'officer', 'moderator', 'member'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Role must be one of: ${validRoles.join(', ')}` });
    }

    // Can't change your own role
    if (targetUserId === req.user.id) {
      return res.status(400).json({ error: 'Cannot change your own role. Use the transfer endpoint instead.' });
    }

    // Check target's current role
    const target = await pool.query(
      'SELECT role FROM club_members WHERE user_id = $1 AND club_id = $2',
      [targetUserId, clubId]
    );
    if (target.rows.length === 0) {
      return res.status(404).json({ error: 'User is not a member of this club' });
    }

    // Can't modify someone with equal or higher role
    const targetLevel = ROLE_HIERARCHY[target.rows[0].role] || 0;
    const myLevel = ROLE_HIERARCHY[req.clubRole] || 0;
    if (targetLevel >= myLevel) {
      return res.status(403).json({ error: 'Cannot modify someone with equal or higher role' });
    }

    // Can't promote to equal or higher than your role
    const newLevel = ROLE_HIERARCHY[role] || 0;
    if (newLevel >= myLevel) {
      return res.status(403).json({ error: 'Cannot promote someone to your level or higher' });
    }

    // Can't change the president's role
    if (target.rows[0].role === 'president') {
      return res.status(403).json({ error: 'Cannot change the president\'s role. Use the transfer endpoint.' });
    }

    await pool.query(
      'UPDATE club_members SET role = $1 WHERE user_id = $2 AND club_id = $3',
      [role, targetUserId, clubId]
    );

    res.json({ ok: true, user_id: targetUserId, new_role: role });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/clubs/:id/staff/:userId — Remove a staff member
router.delete('/:id/staff/:userId', authenticate, requireClubRole('vice_president'), async (req, res, next) => {
  try {
    const clubId = req.params.id;
    const targetUserId = req.params.userId;

    // Can't remove yourself
    if (targetUserId === req.user.id) {
      return res.status(400).json({ error: 'Cannot remove yourself' });
    }

    // Check target's current role
    const target = await pool.query(
      'SELECT role FROM club_members WHERE user_id = $1 AND club_id = $2',
      [targetUserId, clubId]
    );
    if (target.rows.length === 0) {
      return res.status(404).json({ error: 'User is not a member of this club' });
    }

    // Can't remove someone with equal or higher role
    const targetLevel = ROLE_HIERARCHY[target.rows[0].role] || 0;
    const myLevel = ROLE_HIERARCHY[req.clubRole] || 0;
    if (targetLevel >= myLevel) {
      return res.status(403).json({ error: 'Cannot remove someone with equal or higher role' });
    }

    // Can't remove the president
    if (target.rows[0].role === 'president') {
      return res.status(403).json({ error: 'Cannot remove the president' });
    }

    await pool.query('DELETE FROM club_members WHERE user_id = $1 AND club_id = $2', [targetUserId, clubId]);

    res.json({ ok: true, message: 'Staff member removed' });
  } catch (err) {
    next(err);
  }
});

// POST /api/clubs/:id/transfer — Transfer presidency
router.post('/:id/transfer', authenticate, requireClubRole('president'), async (req, res, next) => {
  try {
    const { user_id } = req.body;
    const clubId = req.params.id;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id of new president is required' });
    }

    // Verify target is a club member
    const target = await pool.query(
      'SELECT role FROM club_members WHERE user_id = $1 AND club_id = $2',
      [user_id, clubId]
    );
    if (target.rows.length === 0) {
      return res.status(404).json({ error: 'Target user is not a member of this club' });
    }

    // Transfer: current president → vice_president, target → president
    await pool.query('BEGIN');
    await pool.query(
      'UPDATE club_members SET role = $1 WHERE user_id = $2 AND club_id = $3',
      ['vice_president', req.user.id, clubId]
    );
    await pool.query(
      'UPDATE club_members SET role = $1 WHERE user_id = $2 AND club_id = $3',
      ['president', user_id, clubId]
    );
    await pool.query('COMMIT');

    res.json({ ok: true, message: 'Presidency transferred', new_president: user_id });
  } catch (err) {
    await pool.query('ROLLBACK').catch(() => {});
    next(err);
  }
});

module.exports = router;
