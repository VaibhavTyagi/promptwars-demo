const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/init');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/amenities
router.get('/', (req, res, next) => {
  try {
    const db = getDb();
    const { venueId, type, status } = req.query;
    let query = 'SELECT * FROM amenities WHERE 1=1';
    const params = [];
    if (venueId) { query += ' AND venue_id = ?'; params.push(venueId); }
    if (type) { query += ' AND type = ?'; params.push(type); }
    if (status) { query += ' AND status = ?'; params.push(status); }
    const amenities = db.prepare(query).all(...params);
    db.close();
    res.json(amenities);
  } catch (err) { next(err); }
});

// GET /api/amenities/:id
router.get('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const amenity = db.prepare('SELECT * FROM amenities WHERE amenity_id = ?').get(req.params.id);
    if (!amenity) { db.close(); return res.status(404).json({ error: 'Amenity not found' }); }
    const menuItems = db.prepare('SELECT * FROM menu_items WHERE amenity_id = ? ORDER BY sort_order, is_popular DESC').all(req.params.id);
    db.close();
    res.json({ ...amenity, menuItems });
  } catch (err) { next(err); }
});

// GET /api/amenities/:id/menu
router.get('/:id/menu', (req, res, next) => {
  try {
    const db = getDb();
    const { category, dietary } = req.query;
    let query = 'SELECT * FROM menu_items WHERE amenity_id = ? AND is_available = 1';
    const params = [req.params.id];
    if (category) { query += ' AND category = ?'; params.push(category); }
    query += ' ORDER BY is_popular DESC, sort_order ASC';
    let items = db.prepare(query).all(...params);
    if (dietary) {
      items = items.filter(item => {
        const d = JSON.parse(item.dietary || '[]');
        return d.includes(dietary);
      });
    }
    db.close();
    res.json(items);
  } catch (err) { next(err); }
});

// GET /api/amenities/wait-times/:eventId
router.get('/wait-times/:eventId', (req, res, next) => {
  try {
    const db = getDb();
    const waitTimes = db.prepare(`
      SELECT wt.*, a.name as amenity_name, a.type as amenity_type, a.section, a.status as amenity_status
      FROM wait_times wt
      JOIN amenities a ON wt.amenity_id = a.amenity_id
      WHERE wt.event_id = ?
      AND wt.timestamp = (SELECT MAX(wt2.timestamp) FROM wait_times wt2 WHERE wt2.amenity_id = wt.amenity_id AND wt2.event_id = wt.event_id)
      ORDER BY wt.estimated_wait_minutes DESC
    `).all(req.params.eventId);
    db.close();
    res.json(waitTimes);
  } catch (err) { next(err); }
});

// GET /api/amenities/crowd-density/:eventId
router.get('/crowd-density/:eventId', (req, res, next) => {
  try {
    const db = getDb();
    const density = db.prepare(`
      SELECT cd.*, z.name as zone_name, z.zone_type, z.capacity as zone_capacity
      FROM crowd_density cd
      JOIN zones z ON cd.zone_id = z.zone_id
      WHERE cd.event_id = ?
      AND cd.timestamp = (SELECT MAX(cd2.timestamp) FROM crowd_density cd2 WHERE cd2.zone_id = cd.zone_id AND cd2.event_id = cd.event_id)
      ORDER BY cd.density DESC
    `).all(req.params.eventId);
    db.close();
    res.json(density);
  } catch (err) { next(err); }
});

module.exports = router;
