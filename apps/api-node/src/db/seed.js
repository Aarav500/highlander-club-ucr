// ============================================================================
// Development-only seed script — DO NOT run in production
// Usage: NODE_ENV=development node src/db/seed.js
// ============================================================================

if (process.env.NODE_ENV === 'production') {
  console.error('❌ REFUSING to run seed in production!');
  console.error('   This script creates test data and should only be used in development.');
  process.exit(1);
}

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const client = await pool.connect();

  try {
    console.log('');
    console.log('⚠️  ═══════════════════════════════════════════════════════');
    console.log('⚠️  DEVELOPMENT SEED — Creating test data');
    console.log('⚠️  This data is for local development only.');
    console.log('⚠️  ═══════════════════════════════════════════════════════');
    console.log('');

    await client.query('BEGIN');

    // Create test users (with CAS-style netids)
    const users = await client.query(`
      INSERT INTO users (email, name, display_name, ucr_netid, auth_provider, verified) VALUES
        ('demo.student@ucr.edu', 'Demo Student', 'Demo Student', 'demo.student', 'email_code', true),
        ('club.officer@ucr.edu', 'Club Officer', 'Club Officer', 'club.officer', 'email_code', true),
        ('alex.highlander@ucr.edu', 'Alex Highlander', 'Alex Highlander', 'ahigh001', 'email_code', true)
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email
    `);

    if (users.rows.length === 0) {
      console.log('⚠️  Seed data already exists, skipping...');
      await client.query('COMMIT');
      return;
    }

    const [student, officer, alex] = users.rows;
    console.log(`  ✅ Created ${users.rows.length} test users`);

    // Create sample clubs
    const clubs = await client.query(`
      INSERT INTO clubs (name, description, category, instagram, created_by) VALUES
        ('ACM @ UCR', 'Association for Computing Machinery — coding workshops, hackathons, and tech talks.', 'Academic', '@acm_ucr', $1),
        ('Highlander Gaming', 'Esports and casual gaming club. Weekly tournaments and game nights.', 'Social', '@ucr_gaming', $1),
        ('UCR Dance Marathon', 'Annual 8-hour dance event raising money for Children''s Miracle Network Hospitals.', 'Cultural', '@ucrdm', $1)
      RETURNING id, name
    `, [officer.id]);

    const [acm, gaming, dance] = clubs.rows;
    console.log(`  ✅ Created ${clubs.rows.length} test clubs`);

    // Set officer as president of all clubs (using new role system)
    await client.query(`
      INSERT INTO club_members (user_id, club_id, role) VALUES
        ($1, $2, 'president'),
        ($1, $3, 'president'),
        ($1, $4, 'president')
    `, [officer.id, acm.id, gaming.id, dance.id]);

    // Create sample events
    const now = new Date();
    const hour = (h) => {
      const d = new Date(now);
      d.setHours(d.getHours() + h);
      return d.toISOString();
    };

    await client.query(`
      INSERT INTO events (club_id, title, description, location, lat, lng, category, status, start_time, end_time) VALUES
        ($1, 'Intro to Python Workshop', 'Learn Python basics — no experience required!', 'Winston Chung Hall 205', 33.9737, -117.3265, 'Academic', 'published', $4, $5),
        ($1, 'LeetCode Practice Session', 'Weekly algo practice. Bring your laptop.', 'Orbach Library 240', 33.9735, -117.3288, 'Academic', 'published', $6, $7),
        ($2, 'Valorant Tournament', '5v5 competitive Valorant. Sign up with your team!', 'HUB 302', 33.9738, -117.3274, 'Social', 'published', $8, $9),
        ($2, 'Game Night: Smash Bros', 'Casual Smash Bros Ultimate tournament. Prizes for top 3!', 'Lothian Lounge', 33.9740, -117.3280, 'Social', 'published', $10, $11),
        ($3, 'Dance Marathon Info Night', 'Learn about our mission and how to join!', 'University Theatre', 33.9732, -117.3261, 'Cultural', 'published', $12, $13)
    `, [
      acm.id, gaming.id, dance.id,
      hour(-1), hour(1),       // Event 1: happening now
      hour(2), hour(4),        // Event 2: in 2 hours
      hour(-2), hour(0.5),     // Event 3: happening now
      hour(5), hour(8),        // Event 4: tonight
      hour(3), hour(5),        // Event 5: in 3 hours
    ]);

    console.log('  ✅ Created 5 test events');

    // Demo student follows ACM and Gaming clubs
    await client.query(`
      INSERT INTO follows (user_id, club_id) VALUES ($1, $2), ($1, $3)
    `, [student.id, acm.id, gaming.id]);

    // Demo student RSVPs to first 2 events
    const events = await client.query('SELECT id FROM events LIMIT 2');
    for (const event of events.rows) {
      await client.query('INSERT INTO rsvps (user_id, event_id) VALUES ($1, $2)', [student.id, event.id]);
    }

    // Alex and Demo Student are friends
    await client.query(`
      INSERT INTO friendships (user_id, friend_id) VALUES ($1, $2), ($2, $1)
    `, [student.id, alex.id]);

    await client.query('COMMIT');
    console.log('');
    console.log('🎉 Dev seed complete!');
    console.log('');
    console.log('📝 To log in during development:');
    console.log('   Use the email verification flow with any @ucr.edu email.');
    console.log('   The verification code will be printed in the server console.');
    console.log('');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
