const cron = require('node-cron');
const pool = require('../db/pool');
const { Expo } = require('expo-server-sdk');

const expo = new Expo();

async function sendWeeklyDigest() {
  console.log('Sending Weekly Digest...');
  try {
    // 1. Get top 5 events this week
    const events = await pool.query(`
      SELECT e.id, e.title, e.start_time, c.name as club_name, COUNT(r.user_id) as rsvp_count
      FROM events e
      JOIN clubs c ON e.club_id = c.id
      LEFT JOIN rsvps r ON r.event_id = e.id
      WHERE e.status = 'published'
        AND e.start_time BETWEEN now() AND now() + INTERVAL '7 days'
      GROUP BY e.id, c.name
      ORDER BY rsvp_count DESC
      LIMIT 5
    `);

    if (events.rows.length === 0) {
      console.log('No events this week. Skipping digest.');
      return;
    }

    const messageBody = events.rows.map(e => `- ${e.title} (${e.club_name})`).join('\n');

    // 2. Get all valid push tokens
    const users = await pool.query('SELECT push_token FROM users WHERE push_token IS NOT NULL');
    
    let messages = [];
    for (let user of users.rows) {
      if (!Expo.isExpoPushToken(user.push_token)) continue;

      messages.push({
        to: user.push_token,
        sound: 'default',
        title: '📅 This Week at UCR!',
        body: `Top events happening this week:\n${messageBody}`,
        data: { screen: 'tabs/feed' },
      });
    }

    // 3. Send notifications in chunks
    let chunks = expo.chunkPushNotifications(messages);
    for (let chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        console.error('Error sending push chunk', error);
      }
    }
    console.log(`Sent weekly digest to ${messages.length} users.`);
  } catch (error) {
    console.error('Weekly Digest error:', error);
  }
}

// Run every Monday at 9:00 AM
const startDigestCron = () => {
  cron.schedule('0 9 * * 1', sendWeeklyDigest, {
    scheduled: true,
    timezone: "America/Los_Angeles"
  });
  console.log('Loaded Weekly Digest Cron Job');
};

module.exports = startDigestCron;
