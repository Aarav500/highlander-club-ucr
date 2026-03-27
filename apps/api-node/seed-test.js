const pool = require('./src/db/pool');

async function seed() {
  try {
    // Create test user
    const user = await pool.query(
      `INSERT INTO users (email, name, verified) VALUES ('test@ucr.edu', 'Test Highlander', true)
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

    // Make user admin of first club
    if (allClubs.rows[0]) {
      await pool.query(
        'INSERT INTO club_members (user_id, club_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [userId, allClubs.rows[0].id, 'admin']
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
      { title: 'Smash Bros Tournament', desc: 'Bring your controllers! Cash prizes for top 3. All skill levels welcome.', cat: 'Social', hoursFromNow: -1, location: 'HUB 302', ticketPrice: 5 },
      { title: 'Intramural Soccer Practice', desc: 'Weekly practice session. Cleats required, shin guards recommended.', cat: 'Sports', hoursFromNow: 24, location: 'UCR Soccer Field' },
      { title: 'Resume Review Workshop', desc: 'Get your resume reviewed by engineers from Google, Meta, and Amazon', cat: 'Career', hoursFromNow: 48, location: 'Career Center' },
      { title: 'Lunar New Year Festival', desc: 'Food, lion dances, performances, and cultural activities!', cat: 'Cultural', hoursFromNow: 72, location: 'Bell Tower' },
      { title: 'Greek Week Kickoff', desc: 'Annual Greek Week opening ceremony with all chapters', cat: 'Greek Life', hoursFromNow: 96, location: 'Student Recreation Center' },
      { title: 'Cybersecurity CTF', desc: 'Capture the flag competition. Teams of 2-4. Beginners welcome!', cat: 'Academic', hoursFromNow: 120, location: 'Bourns A265' },
      { title: 'Outdoor Movie Night', desc: 'Screening of Interstellar under the stars. Free popcorn!', cat: 'Social', hoursFromNow: 144, location: 'Bell Tower Lawn', ticketPrice: 0 },
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

    // Generate a login code for testing
    const code = '123456';
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await pool.query('UPDATE login_codes SET used = true WHERE email = $1 AND used = false', ['test@ucr.edu']);
    await pool.query('INSERT INTO login_codes (email, code, expires_at) VALUES ($1, $2, $3)', ['test@ucr.edu', code, expiresAt]);
    console.log('Login code for test@ucr.edu: 123456');

    console.log('=== SEED COMPLETE ===');
    pool.end();
  } catch (e) {
    console.error('Seed error:', e.message);
    pool.end();
    process.exit(1);
  }
}

seed();
