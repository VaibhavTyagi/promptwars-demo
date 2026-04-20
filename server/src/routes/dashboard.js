const express = require('express');
const { getDb } = require('../db/init');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/overview/:eventId - aggregated event overview
router.get('/overview/:eventId', authenticate, (req, res, next) => {
  try {
    const db = getDb();
    const eventId = req.params.eventId;

    const event = db.prepare('SELECT e.*, v.name as venue_name, v.capacity FROM events e JOIN venues v ON e.venue_id = v.venue_id WHERE e.event_id = ?').get(eventId);
    if (!event) { db.close(); return res.status(404).json({ error: 'Event not found' }); }

    // Attendance
    const ticketCount = db.prepare("SELECT COUNT(*) as count FROM user_tickets WHERE event_id = ? AND status = 'used'").get(eventId);

    // Active incidents
    const incidents = db.prepare(`SELECT severity, COUNT(*) as count FROM incidents WHERE event_id = ? AND status NOT IN ('resolved', 'closed') GROUP BY severity`).all(eventId);

    // Order stats
    const orderStats = db.prepare(`SELECT status, COUNT(*) as count, SUM(total) as revenue FROM orders WHERE event_id = ? GROUP BY status`).all(eventId);

    // Average wait times
    const avgWait = db.prepare(`SELECT AVG(wt.estimated_wait_minutes) as avg_wait, MAX(wt.estimated_wait_minutes) as max_wait, a.type as amenity_type FROM wait_times wt JOIN amenities a ON wt.amenity_id = a.amenity_id WHERE wt.event_id = ? AND wt.timestamp = (SELECT MAX(wt2.timestamp) FROM wait_times wt2 WHERE wt2.amenity_id = wt.amenity_id AND wt2.event_id = wt.event_id) GROUP BY a.type`).all(eventId);

    // Crowd density summary
    const densitySummary = db.prepare(`SELECT alert_level, COUNT(*) as zone_count FROM crowd_density WHERE event_id = ? AND timestamp = (SELECT MAX(cd2.timestamp) FROM crowd_density cd2 WHERE cd2.zone_id = crowd_density.zone_id AND cd2.event_id = crowd_density.event_id) GROUP BY alert_level`).all(eventId);

    // Staff on duty
    const staffOnDuty = db.prepare('SELECT department, COUNT(*) as count FROM staff WHERE venue_id = ? AND is_on_duty = 1 GROUP BY department').all(event.venue_id);

    // Total revenue
    const totalRevenue = db.prepare("SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE event_id = ? AND status != 'cancelled'").get(eventId);

    db.close();
    res.json({
      event,
      attendance: { entered: ticketCount.count, expected: event.expected_attendance, capacity: event.capacity },
      incidents: { active: incidents, total: incidents.reduce((s, i) => s + i.count, 0) },
      orders: { byStatus: orderStats, totalRevenue: totalRevenue.total },
      waitTimes: avgWait,
      crowdDensity: densitySummary,
      staff: staffOnDuty
    });
  } catch (err) { next(err); }
});

// GET /api/dashboard/revenue/:eventId
router.get('/revenue/:eventId', authenticate, (req, res, next) => {
  try {
    const db = getDb();
    const orders = db.prepare(`SELECT o.order_time, o.total, o.status, a.name as amenity_name, a.type as amenity_type FROM orders o JOIN amenities a ON o.amenity_id = a.amenity_id WHERE o.event_id = ? AND o.status != 'cancelled' ORDER BY o.order_time`).all(req.params.eventId);
    
    const byAmenity = db.prepare(`SELECT a.name, a.type, COUNT(o.order_id) as order_count, SUM(o.total) as total_revenue FROM orders o JOIN amenities a ON o.amenity_id = a.amenity_id WHERE o.event_id = ? AND o.status != 'cancelled' GROUP BY a.amenity_id ORDER BY total_revenue DESC`).all(req.params.eventId);
    db.close();
    res.json({ orders, byAmenity });
  } catch (err) { next(err); }
});

// GET /api/dashboard/analytics/:eventId
router.get('/analytics/:eventId', authenticate, (req, res, next) => {
  try {
    const db = getDb();
    const eventId = req.params.eventId;

    // Wait time trends (latest per amenity)
    const waitTrends = db.prepare(`SELECT wt.*, a.name as amenity_name, a.type as amenity_type FROM wait_times wt JOIN amenities a ON wt.amenity_id = a.amenity_id WHERE wt.event_id = ? ORDER BY wt.timestamp DESC LIMIT 100`).all(eventId);

    // Crowd density trends
    const densityTrends = db.prepare(`SELECT cd.*, z.name as zone_name, z.zone_type FROM crowd_density cd JOIN zones z ON cd.zone_id = z.zone_id WHERE cd.event_id = ? ORDER BY cd.timestamp DESC LIMIT 100`).all(eventId);

    // Feedback
    const feedback = db.prepare(`SELECT type, AVG(rating) as avg_rating, COUNT(*) as count FROM feedback WHERE event_id = ? GROUP BY type`).all(eventId);

    db.close();
    res.json({ waitTrends, densityTrends, feedback });
  } catch (err) { next(err); }
});

module.exports = router;
