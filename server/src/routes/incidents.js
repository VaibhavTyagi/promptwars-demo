const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/init');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/incidents
router.get('/', authenticate, (req, res, next) => {
  try {
    const db = getDb();
    const { eventId, status, severity, type } = req.query;
    let query = `SELECT i.*, u1.first_name || ' ' || u1.last_name as reporter_name, u2.first_name || ' ' || u2.last_name as assignee_name FROM incidents i JOIN users u1 ON i.reported_by = u1.user_id LEFT JOIN users u2 ON i.assigned_to = u2.user_id WHERE 1=1`;
    const params = [];
    if (eventId) { query += ' AND i.event_id = ?'; params.push(eventId); }
    if (status) { query += ' AND i.status = ?'; params.push(status); }
    if (severity) { query += ' AND i.severity = ?'; params.push(severity); }
    if (type) { query += ' AND i.incident_type = ?'; params.push(type); }
    query += ` ORDER BY CASE i.severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END, i.reported_time DESC`;
    const incidents = db.prepare(query).all(...params);
    db.close();
    res.json(incidents);
  } catch (err) { next(err); }
});

// GET /api/incidents/:id
router.get('/:id', authenticate, (req, res, next) => {
  try {
    const db = getDb();
    const incident = db.prepare(`SELECT i.*, u1.first_name || ' ' || u1.last_name as reporter_name, u2.first_name || ' ' || u2.last_name as assignee_name FROM incidents i JOIN users u1 ON i.reported_by = u1.user_id LEFT JOIN users u2 ON i.assigned_to = u2.user_id WHERE i.incident_id = ?`).get(req.params.id);
    db.close();
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    res.json(incident);
  } catch (err) { next(err); }
});

// POST /api/incidents
router.post('/', authenticate, (req, res, next) => {
  try {
    const { eventId, incidentType, severity, title, description, location, zoneId } = req.body;
    if (!eventId || !incidentType || !title) return res.status(400).json({ error: 'eventId, incidentType, and title required' });
    const db = getDb();
    const incidentId = uuidv4();
    db.prepare(`INSERT INTO incidents (incident_id, event_id, reported_by, incident_type, severity, title, description, location, zone_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(incidentId, eventId, req.user.userId, incidentType, severity || 'low', title, description || null, JSON.stringify(location || {}), zoneId || null);
    const incident = db.prepare('SELECT * FROM incidents WHERE incident_id = ?').get(incidentId);
    db.close();
    res.status(201).json(incident);
  } catch (err) { next(err); }
});

// PATCH /api/incidents/:id
router.patch('/:id', authenticate, (req, res, next) => {
  try {
    const { status, assignedTo, severity, resolutionNotes } = req.body;
    const db = getDb();
    const updates = ["updated_at = datetime('now')"];
    const values = [];
    if (status) { updates.push('status = ?'); values.push(status); }
    if (assignedTo) { updates.push('assigned_to = ?'); values.push(assignedTo); updates.push("assigned_time = datetime('now')"); }
    if (severity) { updates.push('severity = ?'); values.push(severity); }
    if (resolutionNotes) { updates.push('resolution_notes = ?'); values.push(resolutionNotes); }
    if (status === 'resolved' || status === 'closed') { updates.push("resolved_time = datetime('now')"); }
    values.push(req.params.id);
    db.prepare(`UPDATE incidents SET ${updates.join(', ')} WHERE incident_id = ?`).run(...values);
    const incident = db.prepare('SELECT * FROM incidents WHERE incident_id = ?').get(req.params.id);
    db.close();
    res.json(incident);
  } catch (err) { next(err); }
});

module.exports = router;
