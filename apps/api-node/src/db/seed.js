const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env.example') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const client = await pool.connect();

  try {
    console.log('🌱 Seeding database...');
    await client.query('BEGIN');

    // Create 3 sample users
    const users = await client.query(`
      INSERT INTO users (email, name, verified) VALUES
        ('demo.student@ucr.edu', 'Demo Student', true),
        ('club.officer@ucr.edu', 'Club Officer', true),
        ('alex.highlander@ucr.edu', 'Alex Highlander', true)
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email
    `);

    if (users.rows.length === 0) {
      console.log('⚠️  Seed data already exists, skipping...');
      await client.query('COMMIT');
      return;
    }

    const [student, officer, alex] = users.rows;
    console.log(`  ✅ Created ${users.rows.length} users`);

    // Create 3 sample clubs
    const clubs = await client.query(`
      INSERT INTO clubs (name, description, category, instagram, created_by) VALUES
        ('ACM @ UCR', 'Association for Computing Machinery — coding workshops, hackathons, and tech talks.', 'Academic', '@acm_ucr', $1),
        ('Highlander Gaming', 'Esports and casual gaming club. Weekly tournaments and game nights.', 'Social', '@ucr_gaming', $1),
        ('UCR Dance Marathon', 'Annual 8-hour dance event raising money for Children''s Miracle Network Hospitals.', 'Cultural', '@ucrdm', $1)
      RETURNING id, name
    `, [officer.id]);

    const [acm, gaming, dance] = clubs.rows;
    console.log(`  ✅ Created ${clubs.rows.length} clubs`);

    // Set officer as admin of all clubs
    await client.query(`
      INSERT INTO club_members (user_id, club_id, role) VALUES
        ($1, $2, 'admin'),
        ($1, $3, 'admin'),
        ($1, $4, 'admin')
    `, [officer.id, acm.id, gaming.id, dance.id]);

    // Create 10 sample events (mix of upcoming, happening now, past)
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
        ($1, 'Hackathon Kickoff 2026', 'Annual ACM Hackathon — 48 hours of building cool stuff.', 'Student Recreation Center', 33.9731, -117.3256, 'Academic', 'published', $8, $9),
        ($2, 'Valorant Tournament', '5v5 competitive Valorant. Sign up with your team!', 'HUB 302', 33.9738, -117.3274, 'Social', 'published', $10, $11),
        ($2, 'Game Night: Smash Bros', 'Casual Smash Bros Ultimate tournament. Prizes for top 3!', 'Lothian Lounge', 33.9740, -117.3280, 'Social', 'published', $12, $13),
        ($2, 'Board Game Social', 'Catan, Codenames, and more! Snacks provided.', 'Glen Mor Clubhouse', 33.9755, -117.3310, 'Social', 'published', $14, $15),
        ($3, 'Dance Marathon Info Night', 'Learn about our mission and how to join!', 'University Theatre', 33.9732, -117.3261, 'Cultural', 'published', $16, $17),
        ($3, 'Fundraiser Bake Sale', 'Support CMN Hospitals! All proceeds donated.', 'Bell Tower', 33.9733, -117.3276, 'Cultural', 'published', $18, $19),
        ($1, 'Resume Review Night', 'Get your resume reviewed by industry professionals.', 'Career Center', 33.9741, -117.3270, 'Career', 'published', $20, $21),
        ($2, 'Minecraft Server Launch Party', 'Join our new community Minecraft server!', 'Online (Discord)', 33.9738, -117.3274, 'Social', 'published', $22, $23)
    `, [
      acm.id, gaming.id, dance.id,
      hour(-1), hour(1),       // Event 1: happening now
      hour(2), hour(4),        // Event 2: in 2 hours
      hour(24), hour(72),      // Event 3: tomorrow
      hour(-2), hour(0.5),     // Event 4: happening now (ending soon)
      hour(5), hour(8),        // Event 5: tonight
      hour(48), hour(51),      // Event 6: in 2 days
      hour(3), hour(5),        // Event 7: in 3 hours
      hour(72), hour(75),      // Event 8: in 3 days
      hour(26), hour(29),      // Event 9: tomorrow evening
      hour(168), hour(170)     // Event 10: next week
    ]);

    console.log('  ✅ Created 10 events');

    // Demo student follows ACM and Gaming clubs
    await client.query(`
      INSERT INTO follows (user_id, club_id) VALUES ($1, $2), ($1, $3)
    `, [student.id, acm.id, gaming.id]);

    // Demo student RSVPs to first 3 events
    const events = await client.query('SELECT id FROM events LIMIT 3');
    for (const event of events.rows) {
      await client.query('INSERT INTO rsvps (user_id, event_id) VALUES ($1, $2)', [student.id, event.id]);
    }

    // Alex and Demo Student are friends
    await client.query(`
      INSERT INTO friendships (user_id, friend_id) VALUES ($1, $2), ($2, $1)
    `, [student.id, alex.id]);

    // Alex RSVPs to some events too (for friend activity)
    const eventsForAlex = await client.query('SELECT id FROM events LIMIT 5');
    for (const event of eventsForAlex.rows) {
      await client.query(
        'INSERT INTO rsvps (user_id, event_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [alex.id, event.id]
      );
    }

    await client.query('COMMIT');
    console.log('🎉 Seed complete!');
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
