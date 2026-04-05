const express = require('express');
const router = express.Router();
const https = require('https');
const { URL } = require('url');
const rateLimit = require('express-rate-limit');
const xml2js = require('xml2js');
const pool = require('../db/pool');
const { generateToken } = require('../middleware/auth');

// ─── Configuration ──────────────────────────────────────────────────────────
const CAS_BASE_URL = process.env.CAS_BASE_URL || 'https://cas.ucr.edu/cas';
const CAS_LOGIN_URL = `${CAS_BASE_URL}/login`;
const CAS_VALIDATE_URL = `${CAS_BASE_URL}/p3/serviceValidate`;
const CAS_LOGOUT_URL = `${CAS_BASE_URL}/logout`;

// Service URL = where CAS redirects back with the ticket
// IMPORTANT: platform must be included so the callback knows which redirect to use
const getServiceUrl = (req) => {
  const baseUrl = process.env.API_BASE_URL
    || `${req.protocol}://${req.get('host')}`;
  const platform = req.query.platform || 'web';
  return `${baseUrl}/api/auth/cas/callback?platform=${platform}`;
};

// Where to send the user after successful login
const getAppRedirectUrl = () => {
  return process.env.APP_URL || `http://localhost:${process.env.PORT || 3001}`;
};

// Rate limits
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Please try again in a minute.' }
});

// ═══════════════════════════════════════════════════════════════════════════════
// CAS AUTHENTICATION (Primary — UCR SSO)
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/auth/cas/login — Redirect user to UCR CAS login page
router.get('/cas/login', (req, res) => {
  const serviceUrl = getServiceUrl(req);
  const redirectTo = req.query.redirect || '';
  // Encode the service URL so CAS knows where to send the ticket
  const casLoginUrl = `${CAS_LOGIN_URL}?service=${encodeURIComponent(serviceUrl)}`;
  
  // Store the redirect target in a cookie so we can use it after CAS callback
  if (redirectTo) {
    res.cookie('cas_redirect', redirectTo, { httpOnly: true, maxAge: 5 * 60 * 1000 });
  }
  
  res.redirect(casLoginUrl);
});

// GET /api/auth/cas/callback — CAS redirects here with ?ticket=ST-xxxxx
router.get('/cas/callback', async (req, res, next) => {
  try {
    const { ticket } = req.query;

    if (!ticket) {
      return res.status(400).json({ error: 'No CAS ticket provided' });
    }

    const serviceUrl = getServiceUrl(req);

    // Validate the ticket with CAS server
    const casResponse = await validateCASTicket(ticket, serviceUrl);

    if (!casResponse.success) {
      console.error('CAS validation failed:', casResponse.error);
      return res.status(401).json({ error: 'CAS authentication failed', details: casResponse.error });
    }

    const netid = casResponse.netid;
    const email = `${netid}@ucr.edu`;

    // Log the CAS session
    await pool.query(
      'INSERT INTO cas_sessions (ticket, netid, ip_address) VALUES ($1, $2, $3) ON CONFLICT (ticket) DO NOTHING',
      [ticket, netid, req.ip]
    ).catch(() => {}); // Non-critical

    // Find or create user
    let user;
    const existing = await pool.query(
      'SELECT * FROM users WHERE ucr_netid = $1 OR email = $2',
      [netid, email]
    );

    if (existing.rows.length > 0) {
      user = existing.rows[0];
      // Update CAS fields if not set
      if (!user.ucr_netid || user.auth_provider !== 'cas') {
        await pool.query(
          'UPDATE users SET ucr_netid = $1, auth_provider = $2, verified = true WHERE id = $3',
          [netid, 'cas', user.id]
        );
      }
    } else {
      // Create new user — derive display name from NetID
      const displayName = netid
        .replace(/[._]/g, ' ')
        .replace(/\d+$/, '')
        .replace(/\b\w/g, c => c.toUpperCase())
        .trim() || netid;

      const created = await pool.query(
        `INSERT INTO users (email, name, display_name, ucr_netid, auth_provider, verified)
         VALUES ($1, $2, $3, $4, 'cas', true) RETURNING *`,
        [email, displayName, displayName, netid]
      );
      user = created.rows[0];
    }

    // Check for pending staff invitations
    await acceptPendingInvites(user);

    const token = generateToken(user);

    // For web: redirect to app with token in URL fragment
    // For mobile: the app handles the deep link
    const appRedirect = req.cookies?.cas_redirect || getAppRedirectUrl();
    const platform = req.query.platform || 'web';

    if (platform === 'mobile') {
      // Deep link back to mobile app
      const deepLink = `unipulse://auth/callback?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify({ id: user.id, email: user.email, name: user.name || user.display_name }))}`;
      res.redirect(deepLink);
    } else {
      // Web: redirect to /auth/callback with token as query param
      res.clearCookie('cas_redirect');
      res.redirect(`${appRedirect}/auth/callback?token=${encodeURIComponent(token)}`);
    }
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/cas/logout — CAS single sign-out
router.get('/cas/logout', (req, res) => {
  const casLogoutUrl = `${CAS_LOGOUT_URL}?service=${encodeURIComponent(getAppRedirectUrl())}`;
  res.redirect(casLogoutUrl);
});

// ─── CAS Ticket Validation ──────────────────────────────────────────────────
function validateCASTicket(ticket, serviceUrl) {
  return new Promise((resolve) => {
    const validateUrl = `${CAS_VALIDATE_URL}?ticket=${encodeURIComponent(ticket)}&service=${encodeURIComponent(serviceUrl)}`;
    const urlObj = new URL(validateUrl);

    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: { 'Accept': 'application/xml' },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', async () => {
        try {
          const result = await xml2js.parseStringPromise(data, { 
            tagNameProcessors: [xml2js.processors.stripPrefix],
            explicitArray: false 
          });

          const serviceResponse = result.serviceResponse;

          if (serviceResponse.authenticationSuccess) {
            const success = serviceResponse.authenticationSuccess;
            resolve({
              success: true,
              netid: success.user,
              attributes: success.attributes || {},
            });
          } else if (serviceResponse.authenticationFailure) {
            const failure = serviceResponse.authenticationFailure;
            resolve({
              success: false,
              error: failure._ || failure.$.code || 'Unknown CAS error',
            });
          } else {
            resolve({ success: false, error: 'Unexpected CAS response format' });
          }
        } catch (parseErr) {
          resolve({ success: false, error: `XML parse error: ${parseErr.message}` });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ success: false, error: `CAS connection error: ${err.message}` });
    });

    req.end();
  });
}

// ─── Accept pending staff invitations for a newly authenticated user ────────
async function acceptPendingInvites(user) {
  try {
    const invites = await pool.query(
      `SELECT * FROM club_staff_invites 
       WHERE invited_email = $1 AND status = 'pending' AND expires_at > now()`,
      [user.email]
    );

    for (const invite of invites.rows) {
      // Add as club member with the invited role
      await pool.query(
        `INSERT INTO club_members (user_id, club_id, role) VALUES ($1, $2, $3)
         ON CONFLICT (user_id, club_id) DO UPDATE SET role = $3`,
        [user.id, invite.club_id, invite.role]
      );
      // Mark invite as accepted
      await pool.query(
        "UPDATE club_staff_invites SET status = 'accepted' WHERE id = $1",
        [invite.id]
      );
    }
  } catch (err) {
    console.error('Error processing pending invites:', err.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL-CODE AUTHENTICATION (Fallback for development / pre-CAS registration)
// ═══════════════════════════════════════════════════════════════════════════════

// Shared handler for sending an email verification code
async function sendLoginCode(req, res, next) {
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
    if (process.env.SMTP_HOST) {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"UniPulse" <noreply@unipulse.app>',
        to: email,
        subject: 'Your UniPulse verification code',
        html: `
          <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:20px;">
            <h2 style="color:#2D6CC0;">UniPulse</h2>
            <p>Your verification code is:</p>
            <div style="background:#f4f4f4;padding:16px;text-align:center;font-size:32px;font-weight:bold;letter-spacing:8px;border-radius:8px;margin:16px 0;">
              ${code}
            </div>
            <p style="color:#666;font-size:14px;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
          </div>
        `,
      });
      console.log(`📧 Verification code sent to ${email}`);
    } else {
      console.log(`🔑 Dev mode — verification code for ${email}: ${code}`);
    }

    res.json({ message: 'Verification code sent to your @ucr.edu email' });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login and /api/auth/dev-login (alias used by web client build)
router.post('/login', loginLimiter, sendLoginCode);
router.post('/dev-login', loginLimiter, sendLoginCode);

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
        `INSERT INTO users (email, name, display_name, verified, auth_provider) 
         VALUES ($1, $2, $2, true, 'email_code') RETURNING *`,
        [email, name]
      );
      user = created.rows[0];
    }

    // Check for pending staff invitations
    await acceptPendingInvites(user);

    const token = generateToken(user);

    res.json({
      user: { id: user.id, email: user.email, name: user.name, display_name: user.display_name, avatar_url: user.avatar_url },
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

// GET /api/auth/me — Return current user info from JWT (useful for token validation)
router.get('/me', require('../middleware/auth').authenticate, async (req, res, next) => {
  try {
    const user = await pool.query(
      'SELECT id, email, name, display_name, avatar_url, ucr_netid, auth_provider, verified, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
