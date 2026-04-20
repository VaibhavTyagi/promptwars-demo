const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/init');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/venues
router.get('/', (req, res, next) => {
  try {
    const db = getDb();
    const venues = db.prepare('SELECT * FROM venues WHERE is_active = 1').all();
    db.close();
    res.json(venues);
  } catch (err) { next(err); }
});

// GET /api/venues/:id
router.get('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const venue = db.prepare('SELECT * FROM venues WHERE venue_id = ?').get(req.params.id);
    if (!venue) { db.close(); return res.status(404).json({ error: 'Venue not found' }); }
    const sections = db.prepare('SELECT * FROM sections WHERE venue_id = ?').all(req.params.id);
    const zones = db.prepare('SELECT * FROM zones WHERE venue_id = ?').all(req.params.id);
    db.close();
    res.json({ ...venue, sections, zones });
  } catch (err) { next(err); }
});

// POST /api/venues (admin only)
router.post('/', authenticate, authorize('admin', 'manager'), (req, res, next) => {
  try {
    const { name, address, capacity, venueType, timezone, wifiSsid } = req.body;
    if (!name || !capacity || !venueType) return res.status(400).json({ error: 'name, capacity, venueType required' });
    const db = getDb();
    const venueId = uuidv4();
    db.prepare(`INSERT INTO venues (venue_id, name, address, capacity, venue_type, timezone, wifi_ssid) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(venueId, name, JSON.stringify(address || {}), capacity, venueType, timezone || 'America/New_York', wifiSsid || null);
    const venue = db.prepare('SELECT * FROM venues WHERE venue_id = ?').get(venueId);
    db.close();
    res.status(201).json(venue);
  } catch (err) { next(err); }
});

// GET /api/venues/:id/zones
router.get('/:id/zones', (req, res, next) => {
  try {
    const db = getDb();
    const zones = db.prepare('SELECT * FROM zones WHERE venue_id = ?').all(req.params.id);
    db.close();
    res.json(zones);
  } catch (err) { next(err); }
});

module.exports = router;
