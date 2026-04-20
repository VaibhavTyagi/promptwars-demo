const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { getDb, initializeDatabase } = require('./init');

async function seed() {
  initializeDatabase();
  const db = getDb();

  console.log('Seeding database...');

  // Clear existing data - disable foreign keys temporarily
  db.pragma('foreign_keys = OFF');
  const tables = ['amenities_fts','feedback','loyalty_transactions','notifications','staff_assignments','staff',
    'user_activity','crowd_density','wait_times','sensor_data','order_items','transactions',
    'orders','menu_items','amenities','user_tickets','sections','zones','events','venues',
    'payment_methods','users'];
  for (const t of tables) {
    try { db.exec(`DELETE FROM ${t}`); } catch(e) {}
  }
  db.pragma('foreign_keys = ON');

  // --- USERS ---
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

  // --- VENUE ---
  const venueId = uuidv4();
  db.prepare(`INSERT INTO venues (venue_id, name, address, capacity, venue_type, timezone, wifi_ssid, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(venueId, 'MetLife Stadium', JSON.stringify({ street: '1 MetLife Stadium Dr', city: 'East Rutherford', state: 'NJ', zip: '07073', country: 'US' }),
      82500, 'stadium', 'America/New_York', 'MetLife-Guest', '/images/metlife.jpg');

  // --- ZONES ---
  const zoneData = [
    { name: 'Gate A', type: 'gate', capacity: 5000 },
    { name: 'Gate B', type: 'gate', capacity: 5000 },
    { name: 'Gate C', type: 'gate', capacity: 5000 },
    { name: 'Gate D', type: 'gate', capacity: 5000 },
    { name: 'North Concourse', type: 'concourse', capacity: 8000 },
    { name: 'South Concourse', type: 'concourse', capacity: 8000 },
    { name: 'East Concourse', type: 'concourse', capacity: 8000 },
    { name: 'West Concourse', type: 'concourse', capacity: 8000 },
    { name: 'Lower Bowl', type: 'seating', capacity: 30000 },
    { name: 'Upper Deck', type: 'seating', capacity: 25000 },
    { name: 'Club Level', type: 'vip', capacity: 10000 },
    { name: 'Lot A Parking', type: 'parking', capacity: 5000 },
  ];
  const zones = [];
  const insertZone = db.prepare(`INSERT INTO zones (zone_id, venue_id, name, zone_type, capacity) VALUES (?, ?, ?, ?, ?)`);
  for (const z of zoneData) {
    const zid = uuidv4();
    insertZone.run(zid, venueId, z.name, z.type, z.capacity);
    zones.push({ ...z, id: zid });
  }

  // --- SECTIONS ---
  const sectionData = [
    { name: 'Section 101', type: 'standard', cap: 500, zone: 'Lower Bowl' },
    { name: 'Section 102', type: 'standard', cap: 500, zone: 'Lower Bowl' },
    { name: 'Section 201', type: 'premium', cap: 300, zone: 'Club Level' },
    { name: 'Section 301', type: 'standard', cap: 600, zone: 'Upper Deck' },
    { name: 'Suite A', type: 'suite', cap: 20, zone: 'Club Level' },
  ];
  const sections = [];
  const insertSection = db.prepare(`INSERT INTO sections (section_id, venue_id, section_name, section_type, capacity) VALUES (?, ?, ?, ?, ?)`);
  for (const s of sectionData) {
    const sid = uuidv4();
    insertSection.run(sid, venueId, s.name, s.type, s.cap);
    sections.push({ ...s, id: sid });
  }

  // --- EVENTS ---
  const eventId = uuidv4();
  const eventId2 = uuidv4();
  db.prepare(`INSERT INTO events (event_id, venue_id, name, description, event_type, event_date, start_time, end_time, gates_open_time, expected_attendance, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(eventId, venueId, 'Giants vs Eagles - Week 12', 'NFC East Rivalry Game', 'sports', '2026-04-25', '2026-04-25T13:00:00', '2026-04-25T16:30:00', '2026-04-25T10:00:00', 78000, 'scheduled');
  db.prepare(`INSERT INTO events (event_id, venue_id, name, description, event_type, event_date, start_time, end_time, gates_open_time, expected_attendance, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(eventId2, venueId, 'Taylor Swift - Eras Tour', 'The Eras Tour 2026', 'concert', '2026-05-10', '2026-05-10T19:00:00', '2026-05-10T23:00:00', '2026-05-10T16:00:00', 82000, 'scheduled');

  // --- AMENITIES ---
  const amenityData = [
    { name: 'Stadium Grill', type: 'concession', section: 'North Concourse', status: 'open' },
    { name: 'Pizza Palace', type: 'concession', section: 'South Concourse', status: 'open' },
    { name: 'Craft Beer Bar', type: 'concession', section: 'Club Level', status: 'open' },
    { name: 'Taco Stand', type: 'concession', section: 'East Concourse', status: 'open' },
    { name: 'Smoothie Station', type: 'concession', section: 'West Concourse', status: 'open' },
    { name: 'Restroom 1A', type: 'restroom', section: 'North Concourse', status: 'open' },
    { name: 'Restroom 1B', type: 'restroom', section: 'South Concourse', status: 'open' },
    { name: 'Restroom 2A', type: 'restroom', section: 'East Concourse', status: 'open' },
    { name: 'Restroom Club', type: 'restroom', section: 'Club Level', status: 'open' },
    { name: 'Team Store', type: 'merchandise', section: 'North Concourse', status: 'open' },
    { name: 'Fan Gear Kiosk', type: 'merchandise', section: 'South Concourse', status: 'open' },
    { name: 'First Aid Station', type: 'first_aid', section: 'North Concourse', status: 'open' },
    { name: 'ATM - North', type: 'ATM', section: 'North Concourse', status: 'open' },
    { name: 'Guest Services', type: 'info_booth', section: 'Gate A', status: 'open' },
  ];
  const amenities = [];
  const insertAmenity = db.prepare(`INSERT INTO amenities (amenity_id, venue_id, name, type, section, status) VALUES (?, ?, ?, ?, ?, ?)`);
  for (const a of amenityData) {
    const aid = uuidv4();
    insertAmenity.run(aid, venueId, a.name, a.type, a.section, a.status);
    amenities.push({ ...a, id: aid });
  }

  // --- MENU ITEMS ---
  const menuData = [
    { amenity: 'Stadium Grill', items: [
      { name: 'Classic Burger', desc: 'Angus beef patty with lettuce, tomato, and special sauce', price: 14.99, cat: 'food', cal: 650, popular: 1 },
      { name: 'Cheeseburger Deluxe', desc: 'Double patty with cheddar, bacon, and pickles', price: 17.99, cat: 'food', cal: 850, popular: 1 },
      { name: 'Veggie Burger', desc: 'Plant-based patty with avocado and sprouts', price: 13.99, cat: 'food', cal: 420, popular: 0, dietary: ['vegetarian','vegan'] },
      { name: 'Chicken Tenders', desc: 'Hand-breaded tenders with choice of dipping sauce', price: 12.99, cat: 'food', cal: 580, popular: 1 },
      { name: 'French Fries', desc: 'Crispy golden fries with seasoning', price: 7.99, cat: 'food', cal: 380, popular: 0, dietary: ['vegetarian','vegan','gluten_free'] },
      { name: 'Onion Rings', desc: 'Beer-battered onion rings', price: 8.99, cat: 'food', cal: 440, popular: 0, dietary: ['vegetarian'] },
    ]},
    { amenity: 'Pizza Palace', items: [
      { name: 'Pepperoni Pizza Slice', desc: 'Classic NY-style pepperoni slice', price: 8.99, cat: 'food', cal: 320, popular: 1 },
      { name: 'Margherita Slice', desc: 'Fresh mozzarella, basil, and tomato sauce', price: 7.99, cat: 'food', cal: 280, popular: 0, dietary: ['vegetarian'] },
      { name: 'Meat Lovers Slice', desc: 'Pepperoni, sausage, bacon, and ham', price: 9.99, cat: 'food', cal: 420, popular: 1 },
      { name: 'Garlic Knots (6)', desc: 'Fresh-baked knots with garlic butter', price: 6.99, cat: 'food', cal: 340, popular: 0, dietary: ['vegetarian'] },
    ]},
    { amenity: 'Craft Beer Bar', items: [
      { name: 'IPA Draft (16oz)', desc: 'Local craft IPA on tap', price: 14.99, cat: 'beverage', cal: 200, popular: 1 },
      { name: 'Lager Draft (16oz)', desc: 'Crisp American lager', price: 12.99, cat: 'beverage', cal: 150, popular: 1 },
      { name: 'Stout Draft (16oz)', desc: 'Rich chocolate stout', price: 14.99, cat: 'beverage', cal: 220, popular: 0 },
      { name: 'Hard Seltzer', desc: 'Assorted flavors', price: 11.99, cat: 'beverage', cal: 100, popular: 0, dietary: ['gluten_free'] },
      { name: 'Soft Drink (20oz)', desc: 'Coke, Diet Coke, Sprite, or Fanta', price: 6.99, cat: 'beverage', cal: 250, popular: 0, dietary: ['vegetarian','vegan'] },
      { name: 'Water Bottle', desc: 'Purified drinking water', price: 5.99, cat: 'beverage', cal: 0, popular: 0, dietary: ['vegetarian','vegan','gluten_free'] },
    ]},
    { amenity: 'Taco Stand', items: [
      { name: 'Street Tacos (3)', desc: 'Carne asada, cilantro, onion on corn tortillas', price: 13.99, cat: 'food', cal: 480, popular: 1, dietary: ['gluten_free'] },
      { name: 'Chicken Quesadilla', desc: 'Grilled chicken with melted cheese', price: 11.99, cat: 'food', cal: 520, popular: 0 },
      { name: 'Nachos Supreme', desc: 'Loaded nachos with beef, cheese, jalapeños', price: 14.99, cat: 'food', cal: 780, popular: 1 },
      { name: 'Veggie Burrito', desc: 'Rice, beans, guacamole, and grilled veggies', price: 12.99, cat: 'food', cal: 580, popular: 0, dietary: ['vegetarian','vegan'] },
    ]},
  ];

  const insertMenuItem = db.prepare(`INSERT INTO menu_items (menu_item_id, amenity_id, name, description, price, category, dietary, calories, is_available, is_popular) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`);
  for (const group of menuData) {
    const amenity = amenities.find(a => a.name === group.amenity);
    if (!amenity) continue;
    for (const item of group.items) {
      insertMenuItem.run(uuidv4(), amenity.id, item.name, item.desc, item.price, item.cat, JSON.stringify(item.dietary || []), item.cal, item.popular ? 1 : 0);
    }
  }

  // --- WAIT TIMES (seed current data) ---
  const insertWaitTime = db.prepare(`INSERT INTO wait_times (record_id, event_id, amenity_id, estimated_wait_minutes, queue_length, service_rate) VALUES (?, ?, ?, ?, ?, ?)`);
  for (const a of amenities) {
    if (a.type === 'concession' || a.type === 'restroom') {
      const wait = Math.floor(Math.random() * 15) + 1;
      const queue = Math.floor(Math.random() * 30) + 2;
      insertWaitTime.run(uuidv4(), eventId, a.id, wait, queue, +(Math.random() * 3 + 1).toFixed(1));
    }
  }

  // --- CROWD DENSITY ---
  const insertDensity = db.prepare(`INSERT INTO crowd_density (record_id, event_id, zone_id, person_count, density, alert_level) VALUES (?, ?, ?, ?, ?, ?)`);
  for (const z of zones) {
    const count = Math.floor(Math.random() * (z.capacity * 0.7));
    const density = +(count / (z.capacity || 1)).toFixed(2);
    const alert = density > 0.8 ? 'critical' : density > 0.6 ? 'high' : density > 0.4 ? 'moderate' : 'normal';
    insertDensity.run(uuidv4(), eventId, z.id, count, density, alert);
  }

  // --- STAFF ---
  const insertStaff = db.prepare(`INSERT INTO staff (staff_id, user_id, venue_id, department, position, is_on_duty) VALUES (?, ?, ?, ?, ?, 1)`);
  insertStaff.run(uuidv4(), users[2].id, venueId, 'operations', 'Operations Manager');
  insertStaff.run(uuidv4(), users[3].id, venueId, 'security', 'Security Officer');
  insertStaff.run(uuidv4(), users[4].id, venueId, 'concessions', 'Vendor Staff');

  // --- INCIDENTS (sample) ---
  db.prepare(`INSERT INTO incidents (incident_id, event_id, reported_by, incident_type, severity, title, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(uuidv4(), eventId, users[3].id, 'maintenance', 'medium', 'Spill in North Concourse', 'Large beverage spill near Section 101 entrance causing slip hazard', 'reported');
  db.prepare(`INSERT INTO incidents (incident_id, event_id, reported_by, incident_type, severity, title, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(uuidv4(), eventId, users[2].id, 'crowd', 'high', 'Gate B Overcrowding', 'Crowd density exceeding safe levels at Gate B during entry rush', 'in_progress');

  // --- USER TICKETS ---
  db.prepare(`INSERT INTO user_tickets (ticket_id, user_id, event_id, section_id, seat_location, ticket_type, status) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(uuidv4(), users[0].id, eventId, sections[0].id, 'Section 101-Row F-Seat 12', 'standard', 'active');
  db.prepare(`INSERT INTO user_tickets (ticket_id, user_id, event_id, section_id, seat_location, ticket_type, status) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(uuidv4(), users[1].id, eventId, sections[2].id, 'Section 201-Row A-Seat 3', 'VIP', 'active');

  db.close();
  console.log('✅ Database seeded successfully!');
  console.log(`   Users: ${users.length}`);
  console.log(`   Zones: ${zones.length}`);
  console.log(`   Sections: ${sections.length}`);
  console.log(`   Amenities: ${amenities.length}`);
  console.log(`   Events: 2`);
}

seed().catch(err => { console.error('Seed error:', err); process.exit(1); });
