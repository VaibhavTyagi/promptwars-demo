const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/init');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/events
router.get('/', (req, res, next) => {
  try {
    const db = getDb();
    const { venueId, status, upcoming } = req.query;
    let query = 'SELECT e.*, v.name as venue_name FROM events e JOIN venues v ON e.venue_id = v.venue_id WHERE 1=1';
    const params = [];
    if (venueId) { query += ' AND e.venue_id = ?'; params.push(venueId); }
    if (status) { query += ' AND e.status = ?'; params.push(status); }
    if (upcoming === 'true') { query += " AND e.event_date >= date('now')"; }
    query += ' ORDER BY e.event_date ASC';
    const events = db.prepare(query).all(...params);
    db.close();
    res.json(events);
  } catch (err) { next(err); }
});

// GET /api/events/:id
router.get('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const event = db.prepare('SELECT e.*, v.name as venue_name, v.capacity as venue_capacity FROM events e JOIN venues v ON e.venue_id = v.venue_id WHERE e.event_id = ?').get(req.params.id);
    if (!event) { db.close(); return res.status(404).json({ error: 'Event not found' }); }
    db.close();
    res.json(event);
  } catch (err) { next(err); }
});

// POST /api/events
router.post('/', authenticate, authorize('admin', 'manager'), (req, res, next) => {
  try {
    const { venueId, name, description, eventType, eventDate, startTime, endTime, gatesOpenTime, expectedAttendance } = req.body;
    if (!venueId || !name || !eventType || !eventDate || !startTime) {
      return res.status(400).json({ error: 'venueId, name, eventType, eventDate, startTime required' });
    }
    const db = getDb();
    const eventId = uuidv4();
    db.prepare(`INSERT INTO events (event_id, venue_id, name, description, event_type, event_date, start_time, end_time, gates_open_time, expected_attendance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(eventId, venueId, name, description || null, eventType, eventDate, startTime, endTime || null, gatesOpenTime || null, expectedAttendance || null);
    const event = db.prepare('SELECT * FROM events WHERE event_id = ?').get(eventId);
    db.close();
    res.status(201).json(event);
  } catch (err) { next(err); }
});

// PATCH /api/events/:id/status
router.patch('/:id/status', authenticate, authorize('admin', 'manager'), (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['scheduled', 'gates_open', 'in_progress', 'halftime', 'completed', 'cancelled', 'postponed'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const db = getDb();
    db.prepare("UPDATE events SET status = ?, updated_at = datetime('now') WHERE event_id = ?").run(status, req.params.id);
    const event = db.prepare('SELECT * FROM events WHERE event_id = ?').get(req.params.id);
    db.close();
    res.json(event);
  } catch (err) { next(err); }
});

module.exports = router;
