const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/init');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/staff
router.get('/', authenticate, authorize('admin', 'manager', 'security'), (req, res, next) => {
  try {
    const db = getDb();
    const { venueId, department, onDuty } = req.query;
    let query = `SELECT s.*, u.first_name, u.last_name, u.email, u.phone_number FROM staff s JOIN users u ON s.user_id = u.user_id WHERE 1=1`;
    const params = [];
    if (venueId) { query += ' AND s.venue_id = ?'; params.push(venueId); }
    if (department) { query += ' AND s.department = ?'; params.push(department); }
    if (onDuty === 'true') { query += ' AND s.is_on_duty = 1'; }
    query += ' ORDER BY s.department, u.last_name';
    const staff = db.prepare(query).all(...params);
    db.close();
    res.json(staff);
  } catch (err) { next(err); }
});

// POST /api/staff/assign
router.post('/assign', authenticate, authorize('admin', 'manager'), (req, res, next) => {
  try {
    const { staffId, eventId, zoneId, taskDescription, priority } = req.body;
    if (!staffId || !eventId) return res.status(400).json({ error: 'staffId and eventId required' });
    const db = getDb();
    const assignmentId = uuidv4();
    db.prepare(`INSERT INTO staff_assignments (assignment_id, staff_id, event_id, zone_id, task_description, priority) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(assignmentId, staffId, eventId, zoneId || null, taskDescription || null, priority || 'normal');
    const assignment = db.prepare('SELECT sa.*, u.first_name, u.last_name FROM staff_assignments sa JOIN staff s ON sa.staff_id = s.staff_id JOIN users u ON s.user_id = u.user_id WHERE sa.assignment_id = ?').get(assignmentId);
    db.close();
    res.status(201).json(assignment);
  } catch (err) { next(err); }
});

// GET /api/staff/assignments/:eventId
router.get('/assignments/:eventId', authenticate, (req, res, next) => {
  try {
    const db = getDb();
    const assignments = db.prepare(`SELECT sa.*, u.first_name, u.last_name, s.department, s.position FROM staff_assignments sa JOIN staff s ON sa.staff_id = s.staff_id JOIN users u ON s.user_id = u.user_id WHERE sa.event_id = ? ORDER BY CASE sa.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END`).all(req.params.eventId);
    db.close();
    res.json(assignments);
  } catch (err) { next(err); }
});

// PATCH /api/staff/assignments/:id
router.patch('/assignments/:id', authenticate, (req, res, next) => {
  try {
    const { status } = req.body;
    const valid = ['pending', 'acknowledged', 'in_progress', 'completed', 'cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const db = getDb();
    const updates = ['status = ?'];
    const params = [status];
    if (status === 'acknowledged') updates.push("acknowledged_at = datetime('now')");
    if (status === 'completed') updates.push("completed_at = datetime('now')");
    params.push(req.params.id);
    db.prepare(`UPDATE staff_assignments SET ${updates.join(', ')} WHERE assignment_id = ?`).run(...params);
    const assignment = db.prepare('SELECT * FROM staff_assignments WHERE assignment_id = ?').get(req.params.id);
    db.close();
    res.json(assignment);
  } catch (err) { next(err); }
});

module.exports = router;
