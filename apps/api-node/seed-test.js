// ============================================================================
// Development-only test seed — DO NOT run in production
// Usage: NODE_ENV=development node seed-test.js
// ============================================================================

if (process.env.NODE_ENV === 'production') {
  console.error('❌ REFUSING to run test seed in production!');
  process.exit(1);
}

const pool = require('./src/db/pool');

async function seed() {
  try {
    console.log('⚠️  Running development test seed...');

    // Create test user
    const user = await pool.query(
      `INSERT INTO users (email, name, display_name, ucr_netid, auth_provider, verified) 
       VALUES ('test@ucr.edu', 'Test Highlander', 'Test Highlander', 'testa001', 'email_code', true)
       ON CONFLICT (email) DO UPDATE SET name='Test Highlander' RETURNING id`
    );
    const userId = user.rows[0].id;
    console.log('User ID:', userId);

    // Create clubs
    const clubs = [
      ['ACM at UCR', 'UC Riverside ACM chapter - tech workshops, hackathons, and career prep', 'Academic'],
      ['Highlander Gaming', 'UCR gaming community - tournaments, game nights, and esports', 'Social'],
      ['UCR Soccer Club', 'Intramural soccer for all skill levels', 'Sports'],
      ['Career Launchpad', 'Resume workshops, mock interviews, and industry connections', 'Career'],
      ['Vietnamese Student Association', 'Cultural events, community service, and celebrating heritage', 'Cultural'],
      ['Sigma Chi UCR', 'Greek life at UCR - philanthropy, brotherhood, and social events', 'Greek Life'],
    ];

    for (const [name, desc, cat] of clubs) {
      await pool.query(
        `INSERT INTO clubs (name, description, category, created_by) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
        [name, desc, cat, userId]
      );
    }

    const allClubs = await pool.query('SELECT id, name, category FROM clubs ORDER BY name');
    console.log('Clubs created:', allClubs.rows.length);

    // Make user president of first club (using new role system)
    if (allClubs.rows[0]) {
      await pool.query(
        'INSERT INTO club_members (user_id, club_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [userId, allClubs.rows[0].id, 'president']
      );
    }

    // Follow first 3 clubs
    for (const club of allClubs.rows.slice(0, 3)) {
      await pool.query(
        'INSERT INTO follows (user_id, club_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, club.id]
      );
    }

    // Create events
    const now = new Date();
    const eventData = [
      { title: 'AI Workshop: Intro to LLMs', desc: 'Learn about large language models and build a chatbot', cat: 'Academic', hoursFromNow: 2, location: 'Winston Chung Hall 138' },
      { title: 'Smash Bros Tournament', desc: 'Bring your controllers! Cash prizes for top 3.', cat: 'Social', hoursFromNow: -1, location: 'HUB 302', ticketPrice: 5 },
      { title: 'Intramural Soccer Practice', desc: 'Weekly practice session. Cleats required.', cat: 'Sports', hoursFromNow: 24, location: 'UCR Soccer Field' },
      { title: 'Resume Review Workshop', desc: 'Get your resume reviewed by engineers from Google, Meta, and Amazon', cat: 'Career', hoursFromNow: 48, location: 'Career Center' },
      { title: 'Lunar New Year Festival', desc: 'Food, lion dances, performances, and cultural activities!', cat: 'Cultural', hoursFromNow: 72, location: 'Bell Tower' },
    ];

    for (const ev of eventData) {
      const matchClub = allClubs.rows.find(c => c.category === ev.cat) || allClubs.rows[0];
      const startTime = new Date(now.getTime() + ev.hoursFromNow * 3600000);
      const endTime = new Date(startTime.getTime() + 2 * 3600000);
      const price = ev.ticketPrice || 0;
      await pool.query(
        `INSERT INTO events (club_id, title, description, location, lat, lng, category, status, start_time, end_time, ticket_price, ticket_type, ticket_quantity)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'published',$8,$9,$10,$11,$12)`,
        [matchClub.id, ev.title, ev.desc, ev.location, 33.9737 + Math.random() * 0.005, -117.3281 + Math.random() * 0.005, ev.cat, startTime, endTime, price, price > 0 ? 'paid' : 'free', price > 0 ? 100 : null]
      );
    }

    const evtCount = await pool.query('SELECT COUNT(*) FROM events');
    console.log('Events created:', evtCount.rows[0].count);

    // RSVP user to first 3 events
    const evts = await pool.query('SELECT id FROM events ORDER BY start_time LIMIT 3');
    for (const e of evts.rows) {
      await pool.query('INSERT INTO rsvps (user_id, event_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, e.id]);
    }

    console.log('=== DEV SEED COMPLETE ===');
    console.log('To log in, use the email verification flow. Code will be printed in server logs.');
    pool.end();
  } catch (e) {
    console.error('Seed error:', e.message);
    pool.end();
    process.exit(1);
  }
}

seed();
