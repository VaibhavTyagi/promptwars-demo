const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/init');
const { generateToken, authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Email, password, firstName, and lastName are required' });
    }
    const db = getDb();
    const existing = db.prepare('SELECT user_id FROM users WHERE email = ?').get(email);
    if (existing) {
      db.close();
      return res.status(409).json({ error: 'Email already registered' });
    }
    const userId = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 10);
    db.prepare(`INSERT INTO users (user_id, email, password_hash, first_name, last_name, phone_number) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(userId, email, passwordHash, firstName, lastName, phone || null);
    const user = db.prepare('SELECT user_id, email, first_name, last_name, role, loyalty_tier, loyalty_points FROM users WHERE user_id = ?').get(userId);
    db.close();
    const token = generateToken({ user_id: userId, email, role: 'attendee' });
    res.status(201).json({ token, user });
  } catch (err) { next(err); }
});

// POST /api/auth/login
router.post('/login', (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      db.close();
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    db.prepare("UPDATE users SET last_login_date = datetime('now') WHERE user_id = ?").run(user.user_id);
    db.close();
    const token = generateToken(user);
    const { password_hash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) { next(err); }
});

// GET /api/auth/profile
router.get('/profile', authenticate, (req, res, next) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT user_id, email, phone_number, first_name, last_name, profile_photo, preferred_language, accessibility_preferences, notification_preferences, loyalty_tier, loyalty_points, role FROM users WHERE user_id = ?').get(req.user.userId);
    db.close();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
});

// PUT /api/auth/profile
router.put('/profile', authenticate, (req, res, next) => {
  try {
    const { firstName, lastName, phone, preferredLanguage, accessibilityPreferences, notificationPreferences } = req.body;
    const db = getDb();
    const updates = [];
    const values = [];
    if (firstName) { updates.push('first_name = ?'); values.push(firstName); }
    if (lastName) { updates.push('last_name = ?'); values.push(lastName); }
    if (phone) { updates.push('phone_number = ?'); values.push(phone); }
    if (preferredLanguage) { updates.push('preferred_language = ?'); values.push(preferredLanguage); }
    if (accessibilityPreferences) { updates.push('accessibility_preferences = ?'); values.push(JSON.stringify(accessibilityPreferences)); }
    if (notificationPreferences) { updates.push('notification_preferences = ?'); values.push(JSON.stringify(notificationPreferences)); }
    updates.push("updated_at = datetime('now')");
    values.push(req.user.userId);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`).run(...values);
    const user = db.prepare('SELECT user_id, email, first_name, last_name, phone_number, preferred_language, loyalty_tier, loyalty_points, role FROM users WHERE user_id = ?').get(req.user.userId);
    db.close();
    res.json(user);
  } catch (err) { next(err); }
});

module.exports = router;
