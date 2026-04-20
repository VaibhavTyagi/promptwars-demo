const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/init');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/orders - get user's orders
router.get('/', authenticate, (req, res, next) => {
  try {
    const db = getDb();
    const { eventId, status } = req.query;
    let query = `SELECT o.*, a.name as amenity_name FROM orders o JOIN amenities a ON o.amenity_id = a.amenity_id WHERE o.user_id = ?`;
    const params = [req.user.userId];
    if (eventId) { query += ' AND o.event_id = ?'; params.push(eventId); }
    if (status) { query += ' AND o.status = ?'; params.push(status); }
    query += ' ORDER BY o.order_time DESC';
    const orders = db.prepare(query).all(...params);
    db.close();
    res.json(orders);
  } catch (err) { next(err); }
});

// GET /api/orders/:id
router.get('/:id', authenticate, (req, res, next) => {
  try {
    const db = getDb();
    const order = db.prepare(`SELECT o.*, a.name as amenity_name FROM orders o JOIN amenities a ON o.amenity_id = a.amenity_id WHERE o.order_id = ?`).get(req.params.id);
    if (!order) { db.close(); return res.status(404).json({ error: 'Order not found' }); }
    const items = db.prepare(`SELECT oi.*, mi.name, mi.description, mi.image_url FROM order_items oi JOIN menu_items mi ON oi.menu_item_id = mi.menu_item_id WHERE oi.order_id = ?`).all(req.params.id);
    db.close();
    res.json({ ...order, items });
  } catch (err) { next(err); }
});

// POST /api/orders - place new order
router.post('/', authenticate, (req, res, next) => {
  try {
    const { eventId, amenityId, items, orderType, specialInstructions, paymentMethodId } = req.body;
    if (!eventId || !amenityId || !items || !items.length) {
      return res.status(400).json({ error: 'eventId, amenityId, and items required' });
    }
    const db = getDb();
    const orderId = uuidv4();
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const menuItem = db.prepare('SELECT * FROM menu_items WHERE menu_item_id = ?').get(item.menuItemId);
      if (!menuItem) { db.close(); return res.status(400).json({ error: `Menu item ${item.menuItemId} not found` }); }
      if (!menuItem.is_available) { db.close(); return res.status(400).json({ error: `${menuItem.name} is not available` }); }
      const qty = item.quantity || 1;
      subtotal += menuItem.price * qty;
      orderItems.push({ menuItemId: item.menuItemId, quantity: qty, unitPrice: menuItem.price, customizations: item.customizations || {} });
    }

    const tax = +(subtotal * 0.08875).toFixed(2); // NY tax rate
    const total = +(subtotal + tax).toFixed(2);
    const estPickup = new Date(Date.now() + 10 * 60000).toISOString();

    db.prepare(`INSERT INTO orders (order_id, user_id, event_id, amenity_id, order_number, order_type, subtotal, tax, total, payment_method_id, status, estimated_pickup_time, special_instructions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?)`)
      .run(orderId, req.user.userId, eventId, amenityId, orderNumber, orderType || 'mobile_pickup', subtotal, tax, total, paymentMethodId || null, estPickup, specialInstructions || null);

    const insertItem = db.prepare(`INSERT INTO order_items (order_item_id, order_id, menu_item_id, quantity, unit_price, customizations) VALUES (?, ?, ?, ?, ?, ?)`);
    for (const oi of orderItems) {
      insertItem.run(uuidv4(), orderId, oi.menuItemId, oi.quantity, oi.unitPrice, JSON.stringify(oi.customizations));
    }

    // Create transaction record
    db.prepare(`INSERT INTO transactions (transaction_id, order_id, amount, status) VALUES (?, ?, ?, 'captured')`)
      .run(uuidv4(), orderId, total);

    const order = db.prepare('SELECT o.*, a.name as amenity_name FROM orders o JOIN amenities a ON o.amenity_id = a.amenity_id WHERE o.order_id = ?').get(orderId);
    db.close();
    res.status(201).json(order);
  } catch (err) { next(err); }
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', authenticate, (req, res, next) => {
  try {
    const { status } = req.body;
    const valid = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const db = getDb();
    const updates = ['status = ?', "updated_at = datetime('now')"];
    const params = [status];
    if (status === 'completed') { updates.push("completed_time = datetime('now')"); }
    if (status === 'ready') { updates.push("pickup_time = datetime('now')"); }
    params.push(req.params.id);
    db.prepare(`UPDATE orders SET ${updates.join(', ')} WHERE order_id = ?`).run(...params);
    const order = db.prepare('SELECT * FROM orders WHERE order_id = ?').get(req.params.id);
    db.close();
    res.json(order);
  } catch (err) { next(err); }
});

// GET /api/orders/venue/:eventId - all orders for event (staff)
router.get('/venue/:eventId', authenticate, (req, res, next) => {
  try {
    const db = getDb();
    const orders = db.prepare(`SELECT o.*, a.name as amenity_name, u.first_name, u.last_name FROM orders o JOIN amenities a ON o.amenity_id = a.amenity_id JOIN users u ON o.user_id = u.user_id WHERE o.event_id = ? ORDER BY o.order_time DESC`).all(req.params.eventId);
    db.close();
    res.json(orders);
  } catch (err) { next(err); }
});

module.exports = router;
