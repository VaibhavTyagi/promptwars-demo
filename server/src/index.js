require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
const { initializeDatabase } = require('./db/init');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Initialize database
initializeDatabase();

// Check if database is seeded, if not, seed it
const db = require('./db/init').getDb();
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
if (userCount === 0) {
  console.log('Database not seeded, seeding...');
  // Run seeding logic here
  const { v4: uuidv4 } = require('uuid');
  const bcrypt = require('bcryptjs');
  const passwordHash = bcrypt.hashSync('password123', 10);
  const users = [
    { id: uuidv4(), email: 'sarah@example.com', first: 'Sarah', last: 'Johnson', role: 'attendee', tier: 'Silver', points: 2500 },
    { id: uuidv4(), email: 'marcus@example.com', first: 'Marcus', last: 'Williams', role: 'attendee', tier: 'Platinum', points: 15000 },
    { id: uuidv4(), email: 'jennifer@example.com', first: 'Jennifer', last: 'Chen', role: 'manager', tier: 'Gold', points: 5000 },
    { id: uuidv4(), email: 'david@example.com', first: 'David', last: 'Martinez', role: 'security', tier: 'Bronze', points: 500 },
    { id: uuidv4(), email: 'alex@example.com', first: 'Alex', last: 'Thompson', role: 'vendor', tier: 'Bronze', points: 200 },
    { id: uuidv4(), email: 'admin@venue.com', first: 'Admin', last: 'User', role: 'admin', tier: 'Platinum', points: 0 },
  ];
  const insertUser = db.prepare(`INSERT INTO users (user_id, email, password_hash, first_name, last_name, role, loyalty_tier, loyalty_points) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const u of users) {
    insertUser.run(u.id, u.email, passwordHash, u.first, u.last, u.role, u.tier, u.points);
  }
  console.log('Database seeded with', users.length, 'users');
}
db.close();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN || 'http://localhost:5173', methods: ['GET', 'POST'] }
});

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000, message: { error: 'Too many requests' } });
app.use('/api/', limiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/venues', require('./routes/venues'));
app.use('/api/events', require('./routes/events'));
app.use('/api/amenities', require('./routes/amenities'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/incidents', require('./routes/incidents'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Socket.io events
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('join-event', (eventId) => {
    socket.join(`event:${eventId}`);
    console.log(`${socket.id} joined event:${eventId}`);
  });

  socket.on('leave-event', (eventId) => {
    socket.leave(`event:${eventId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Make io accessible to routes
app.set('io', io);

// Serve React static build in production
const path = require('path');
const clientBuildPath = path.join(__dirname, '../../client/dist');
const fs = require('fs');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  // SPA fallback — serve index.html for any non-API route
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/socket.io')) return next();
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🏟️  Venue Experience API running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`📊 API docs: http://localhost:${PORT}/api/health\n`);
});

module.exports = { app, server, io };
