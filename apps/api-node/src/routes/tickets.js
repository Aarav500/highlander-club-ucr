// Event Tickets API Routes
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const crypto = require('crypto');

// GET /api/tickets/event/:id — get ticket info for an event
router.get('/event/:id', authenticate, async (req, res, next) => {
  try {
    const event = await pool.query(
      'SELECT id, title, ticket_price, ticket_type, ticket_quantity FROM events WHERE id = $1',
      [req.params.id]
    );
    if (event.rows.length === 0) return res.status(404).json({ error: 'Event not found' });

    const soldCount = await pool.query(
      "SELECT COUNT(*) FROM user_tickets WHERE event_id = $1 AND status = 'active'",
      [req.params.id]
    );

    // Check if user already has a ticket
    const userTicket = await pool.query(
      'SELECT * FROM user_tickets WHERE user_id = $1 AND event_id = $2',
      [req.user.id, req.params.id]
    );

    const evt = event.rows[0];
    res.json({
      event_id: evt.id,
      title: evt.title,
      price: parseFloat(evt.ticket_price) || 0,
      type: evt.ticket_type || 'free',
      total_quantity: evt.ticket_quantity,
      sold: parseInt(soldCount.rows[0].count),
      available: evt.ticket_quantity ? evt.ticket_quantity - parseInt(soldCount.rows[0].count) : null,
      user_has_ticket: userTicket.rows.length > 0,
      user_ticket: userTicket.rows[0] || null,
    });
  } catch (err) { next(err); }
});

// POST /api/tickets/event/:id/purchase — purchase ticket
router.post('/event/:id/purchase', authenticate, async (req, res, next) => {
  try {
    const event = await pool.query(
      'SELECT id, title, ticket_price, ticket_type, ticket_quantity FROM events WHERE id = $1',
      [req.params.id]
    );
    if (event.rows.length === 0) return res.status(404).json({ error: 'Event not found' });

    // Check if user already has a ticket
    const existing = await pool.query(
      'SELECT id FROM user_tickets WHERE user_id = $1 AND event_id = $2',
      [req.user.id, req.params.id]
    );
    if (existing.rows.length > 0) return res.status(409).json({ error: 'You already have a ticket' });

    // Check availability
    const evt = event.rows[0];
    if (evt.ticket_quantity) {
      const sold = await pool.query(
        "SELECT COUNT(*) FROM user_tickets WHERE event_id = $1 AND status = 'active'",
        [req.params.id]
      );
      if (parseInt(sold.rows[0].count) >= evt.ticket_quantity) {
        return res.status(409).json({ error: 'Tickets sold out' });
      }
    }

    // Generate unique ticket code
    const ticketCode = 'HE-' + crypto.randomBytes(6).toString('hex').toUpperCase().slice(0, 8);

    const { rows } = await pool.query(`
      INSERT INTO user_tickets (user_id, event_id, ticket_code)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [req.user.id, req.params.id, ticketCode]);

    // Also RSVP if not already
    await pool.query(
      'INSERT INTO rsvps (user_id, event_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, req.params.id]
    );

    res.status(201).json({
      message: 'Ticket purchased!',
      ticket: rows[0],
      event_title: evt.title,
    });
  } catch (err) { next(err); }
});

// GET /api/tickets/mine — get all my tickets
router.get('/mine', authenticate, async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT t.*, e.title, e.start_time, e.location, e.category,
             c.name as club_name
      FROM user_tickets t
      JOIN events e ON t.event_id = e.id
      JOIN clubs c ON e.club_id = c.id
      WHERE t.user_id = $1
      ORDER BY e.start_time ASC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) { next(err); }
});

module.exports = router;
