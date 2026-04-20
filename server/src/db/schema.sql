-- ============================================================
-- Large-Scale Sporting Venue Experience Enhancement System
-- SQLite Database Schema
-- ============================================================

-- Enable WAL mode for better concurrent read performance
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ============================================================
-- 1. USERS & AUTHENTICATION
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    phone_number TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    profile_photo TEXT,
    account_created_date TEXT NOT NULL DEFAULT (datetime('now')),
    last_login_date TEXT,
    preferred_language TEXT DEFAULT 'en',
    accessibility_preferences TEXT DEFAULT '{}',  -- JSON
    notification_preferences TEXT DEFAULT '{}',   -- JSON
    privacy_settings TEXT DEFAULT '{}',           -- JSON
    loyalty_tier TEXT DEFAULT 'Bronze' CHECK(loyalty_tier IN ('Bronze', 'Silver', 'Gold', 'Platinum')),
    loyalty_points INTEGER DEFAULT 0,
    role TEXT DEFAULT 'attendee' CHECK(role IN ('attendee', 'staff', 'vendor', 'security', 'manager', 'admin')),
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================
-- 2. PAYMENT METHODS
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_methods (
    payment_method_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('credit_card', 'debit_card', 'apple_pay', 'google_pay', 'paypal')),
    token TEXT NOT NULL,
    last_four TEXT,
    expiry_month INTEGER,
    expiry_year INTEGER,
    is_default INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON payment_methods(user_id);

-- ============================================================
-- 3. VENUES
-- ============================================================

CREATE TABLE IF NOT EXISTS venues (
    venue_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL DEFAULT '{}',          -- JSON
    capacity INTEGER NOT NULL,
    venue_type TEXT NOT NULL CHECK(venue_type IN ('stadium', 'arena', 'outdoor')),
    timezone TEXT DEFAULT 'America/New_York',
    map_data TEXT DEFAULT '{}',                  -- JSON/GeoJSON
    configuration TEXT DEFAULT '{}',             -- JSON
    wifi_ssid TEXT,
    contact_info TEXT DEFAULT '{}',              -- JSON
    image_url TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- 4. EVENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS events (
    event_id TEXT PRIMARY KEY,
    venue_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL CHECK(event_type IN ('sports', 'concert', 'conference', 'other')),
    event_date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT,
    gates_open_time TEXT,
    expected_attendance INTEGER,
    actual_attendance INTEGER DEFAULT 0,
    status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'gates_open', 'in_progress', 'halftime', 'completed', 'cancelled', 'postponed')),
    weather_forecast TEXT DEFAULT '{}',          -- JSON
    special_instructions TEXT,
    image_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_events_venue ON events(venue_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

-- ============================================================
-- 5. SECTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS sections (
    section_id TEXT PRIMARY KEY,
    venue_id TEXT NOT NULL,
    section_name TEXT NOT NULL,
    section_type TEXT DEFAULT 'standard' CHECK(section_type IN ('standard', 'premium', 'VIP', 'accessible', 'standing', 'suite')),
    capacity INTEGER NOT NULL,
    price_zone TEXT,
    amenities TEXT DEFAULT '[]',                 -- JSON array
    coordinates TEXT DEFAULT '{}',               -- GeoJSON polygon
    floor_level INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sections_venue ON sections(venue_id);

-- ============================================================
-- 6. USER TICKETS
-- ============================================================

CREATE TABLE IF NOT EXISTS user_tickets (
    ticket_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    event_id TEXT NOT NULL,
    section_id TEXT,
    ticketing_system_id TEXT,
    barcode TEXT,
    seat_location TEXT,                          -- e.g., "Section 101-Row A-Seat 5"
    ticket_type TEXT DEFAULT 'standard' CHECK(ticket_type IN ('standard', 'premium', 'VIP', 'accessible', 'standing')),
    purchase_date TEXT,
    entry_time TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'used', 'transferred', 'cancelled', 'expired')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tickets_user ON user_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event ON user_tickets(event_id);

-- ============================================================
-- 7. AMENITIES
-- ============================================================

CREATE TABLE IF NOT EXISTS amenities (
    amenity_id TEXT PRIMARY KEY,
    venue_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('concession', 'restroom', 'merchandise', 'first_aid', 'ATM', 'info_booth', 'parking', 'vip_lounge')),
    location TEXT DEFAULT '{}',                  -- GeoJSON point
    section TEXT,
    floor_level INTEGER DEFAULT 1,
    capacity INTEGER,
    hours TEXT DEFAULT '{}',                     -- JSON: opening/closing times
    status TEXT DEFAULT 'open' CHECK(status IN ('open', 'closed', 'limited', 'out_of_service')),
    features TEXT DEFAULT '[]',                  -- JSON: e.g., ["gluten_free", "vegetarian", "accessible"]
    image_url TEXT,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_amenities_venue ON amenities(venue_id);
CREATE INDEX IF NOT EXISTS idx_amenities_type ON amenities(type);

-- ============================================================
-- 8. MENU ITEMS
-- ============================================================

CREATE TABLE IF NOT EXISTS menu_items (
    menu_item_id TEXT PRIMARY KEY,
    amenity_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('food', 'beverage', 'merchandise', 'combo')),
    dietary TEXT DEFAULT '[]',                   -- JSON array: ["vegetarian", "vegan", "gluten_free", "kosher", "halal"]
    allergens TEXT DEFAULT '[]',                 -- JSON array
    calories INTEGER,
    image_url TEXT,
    is_available INTEGER DEFAULT 1,
    prep_time_seconds INTEGER DEFAULT 300,
    sort_order INTEGER DEFAULT 0,
    is_popular INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (amenity_id) REFERENCES amenities(amenity_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_menu_items_amenity ON menu_items(amenity_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);

-- ============================================================
-- 9. ORDERS
-- ============================================================

CREATE TABLE IF NOT EXISTS orders (
    order_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    event_id TEXT NOT NULL,
    amenity_id TEXT NOT NULL,
    order_number TEXT NOT NULL,
    order_type TEXT DEFAULT 'mobile_pickup' CHECK(order_type IN ('mobile_pickup', 'in_seat_delivery', 'will_call')),
    subtotal REAL NOT NULL DEFAULT 0,
    tax REAL NOT NULL DEFAULT 0,
    tip REAL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0,
    payment_method_id TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled', 'refunded')),
    order_time TEXT NOT NULL DEFAULT (datetime('now')),
    estimated_pickup_time TEXT,
    pickup_time TEXT,
    completed_time TEXT,
    pickup_location TEXT,
    special_instructions TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (event_id) REFERENCES events(event_id),
    FOREIGN KEY (amenity_id) REFERENCES amenities(amenity_id),
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(payment_method_id)
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_event ON orders(event_id);
CREATE INDEX IF NOT EXISTS idx_orders_amenity ON orders(amenity_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- ============================================================
-- 10. ORDER ITEMS
-- ============================================================

CREATE TABLE IF NOT EXISTS order_items (
    order_item_id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    menu_item_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price REAL NOT NULL,
    customizations TEXT DEFAULT '{}',            -- JSON
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(menu_item_id)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- ============================================================
-- 11. TRANSACTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS transactions (
    transaction_id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    payment_token TEXT,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'authorized', 'captured', 'failed', 'refunded', 'voided')),
    gateway_response TEXT DEFAULT '{}',          -- JSON
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

CREATE INDEX IF NOT EXISTS idx_transactions_order ON transactions(order_id);

-- ============================================================
-- 12. CROWD DENSITY (Real-Time Operational)
-- ============================================================

CREATE TABLE IF NOT EXISTS crowd_density (
    record_id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    zone_id TEXT NOT NULL,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    person_count INTEGER NOT NULL DEFAULT 0,
    density REAL DEFAULT 0,                      -- persons per sq meter
    velocity_vector TEXT DEFAULT '{}',           -- JSON: speed, direction
    alert_level TEXT DEFAULT 'normal' CHECK(alert_level IN ('normal', 'moderate', 'high', 'critical')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (event_id) REFERENCES events(event_id)
);

CREATE INDEX IF NOT EXISTS idx_crowd_density_event ON crowd_density(event_id);
CREATE INDEX IF NOT EXISTS idx_crowd_density_zone ON crowd_density(zone_id);
CREATE INDEX IF NOT EXISTS idx_crowd_density_timestamp ON crowd_density(timestamp);

-- ============================================================
-- 13. WAIT TIMES (Real-Time Operational)
-- ============================================================

CREATE TABLE IF NOT EXISTS wait_times (
    record_id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    amenity_id TEXT NOT NULL,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    estimated_wait_minutes INTEGER DEFAULT 0,
    queue_length INTEGER DEFAULT 0,
    service_rate REAL DEFAULT 0,                 -- customers per minute
    accuracy REAL DEFAULT 0.8,
    prediction_confidence REAL DEFAULT 0.7,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (event_id) REFERENCES events(event_id),
    FOREIGN KEY (amenity_id) REFERENCES amenities(amenity_id)
);

CREATE INDEX IF NOT EXISTS idx_wait_times_event ON wait_times(event_id);
CREATE INDEX IF NOT EXISTS idx_wait_times_amenity ON wait_times(amenity_id);
CREATE INDEX IF NOT EXISTS idx_wait_times_timestamp ON wait_times(timestamp);

-- ============================================================
-- 14. SENSOR DATA
-- ============================================================

CREATE TABLE IF NOT EXISTS sensor_data (
    sensor_id TEXT PRIMARY KEY,
    venue_id TEXT NOT NULL,
    sensor_type TEXT NOT NULL CHECK(sensor_type IN ('wifi', 'ble', 'camera', 'ir_beam', 'pressure', 'occupancy', 'temperature', 'air_quality')),
    name TEXT,
    location TEXT DEFAULT '{}',                  -- GeoJSON point
    zone_id TEXT,
    battery_level INTEGER,
    status TEXT DEFAULT 'online' CHECK(status IN ('online', 'offline', 'degraded')),
    last_reading TEXT DEFAULT '{}',              -- JSON
    last_reading_time TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id)
);

CREATE INDEX IF NOT EXISTS idx_sensor_data_venue ON sensor_data(venue_id);

-- ============================================================
-- 15. INCIDENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS incidents (
    incident_id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    reported_by TEXT NOT NULL,
    incident_type TEXT NOT NULL CHECK(incident_type IN ('medical', 'security', 'maintenance', 'lost_item', 'complaint', 'safety', 'crowd', 'other')),
    severity TEXT DEFAULT 'low' CHECK(severity IN ('low', 'medium', 'high', 'critical')),
    location TEXT DEFAULT '{}',                  -- GeoJSON point
    zone_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    photo_urls TEXT DEFAULT '[]',                -- JSON array
    assigned_to TEXT,
    status TEXT DEFAULT 'reported' CHECK(status IN ('reported', 'assigned', 'in_progress', 'resolved', 'closed', 'escalated')),
    reported_time TEXT NOT NULL DEFAULT (datetime('now')),
    assigned_time TEXT,
    resolved_time TEXT,
    resolution_notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (event_id) REFERENCES events(event_id),
    FOREIGN KEY (reported_by) REFERENCES users(user_id),
    FOREIGN KEY (assigned_to) REFERENCES users(user_id)
);

CREATE INDEX IF NOT EXISTS idx_incidents_event ON incidents(event_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);

-- ============================================================
-- 16. STAFF
-- ============================================================

CREATE TABLE IF NOT EXISTS staff (
    staff_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    venue_id TEXT NOT NULL,
    department TEXT NOT NULL CHECK(department IN ('operations', 'security', 'concessions', 'maintenance', 'medical', 'parking', 'guest_services')),
    position TEXT,
    badge_number TEXT,
    current_zone TEXT,
    current_location TEXT DEFAULT '{}',          -- GeoJSON point
    shift_start TEXT,
    shift_end TEXT,
    is_on_duty INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id)
);

CREATE INDEX IF NOT EXISTS idx_staff_venue ON staff(venue_id);
CREATE INDEX IF NOT EXISTS idx_staff_department ON staff(department);

-- ============================================================
-- 17. STAFF ASSIGNMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS staff_assignments (
    assignment_id TEXT PRIMARY KEY,
    staff_id TEXT NOT NULL,
    event_id TEXT NOT NULL,
    zone_id TEXT,
    task_description TEXT,
    priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'acknowledged', 'in_progress', 'completed', 'cancelled')),
    assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
    acknowledged_at TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (staff_id) REFERENCES staff(staff_id),
    FOREIGN KEY (event_id) REFERENCES events(event_id)
);

CREATE INDEX IF NOT EXISTS idx_staff_assignments_staff ON staff_assignments(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_assignments_event ON staff_assignments(event_id);

-- ============================================================
-- 18. NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
    notification_id TEXT PRIMARY KEY,
    user_id TEXT,                                 -- NULL for broadcast notifications
    event_id TEXT,
    type TEXT NOT NULL CHECK(type IN ('event_update', 'order_status', 'wait_time', 'safety', 'promotion', 'social', 'system', 'emergency')),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data TEXT DEFAULT '{}',                      -- JSON payload
    is_read INTEGER DEFAULT 0,
    is_broadcast INTEGER DEFAULT 0,
    priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'critical')),
    expires_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(event_id)
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_event ON notifications(event_id);

-- ============================================================
-- 19. USER ACTIVITY LOG
-- ============================================================

CREATE TABLE IF NOT EXISTS user_activity (
    activity_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    event_id TEXT,
    session_id TEXT,
    activity_type TEXT NOT NULL CHECK(activity_type IN ('page_view', 'search', 'navigation', 'order', 'check_in', 'scan', 'rating', 'social')),
    activity_data TEXT DEFAULT '{}',             -- JSON
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    device_type TEXT CHECK(device_type IN ('iOS', 'Android', 'web')),
    app_version TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (event_id) REFERENCES events(event_id)
);

CREATE INDEX IF NOT EXISTS idx_user_activity_user ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_timestamp ON user_activity(timestamp);

-- ============================================================
-- 20. ZONES (Venue sub-areas for crowd density tracking)
-- ============================================================

CREATE TABLE IF NOT EXISTS zones (
    zone_id TEXT PRIMARY KEY,
    venue_id TEXT NOT NULL,
    name TEXT NOT NULL,
    zone_type TEXT NOT NULL CHECK(zone_type IN ('gate', 'concourse', 'seating', 'concession', 'restroom', 'parking', 'vip', 'field')),
    capacity INTEGER,
    coordinates TEXT DEFAULT '{}',               -- GeoJSON polygon
    floor_level INTEGER DEFAULT 1,
    parent_zone_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_zone_id) REFERENCES zones(zone_id)
);

CREATE INDEX IF NOT EXISTS idx_zones_venue ON zones(venue_id);

-- ============================================================
-- 21. LOYALTY & REWARDS
-- ============================================================

CREATE TABLE IF NOT EXISTS loyalty_transactions (
    transaction_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    points INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('earned', 'redeemed', 'bonus', 'expired', 'adjusted')),
    source TEXT,                                  -- e.g., "purchase", "check_in", "referral"
    reference_id TEXT,                           -- order_id, event_id, etc.
    description TEXT,
    balance_after INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE INDEX IF NOT EXISTS idx_loyalty_user ON loyalty_transactions(user_id);

-- ============================================================
-- 22. FEEDBACK & RATINGS
-- ============================================================

CREATE TABLE IF NOT EXISTS feedback (
    feedback_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    event_id TEXT,
    amenity_id TEXT,
    type TEXT NOT NULL CHECK(type IN ('venue', 'concession', 'restroom', 'staff', 'app', 'event', 'general')),
    rating INTEGER CHECK(rating BETWEEN 1 AND 5),
    comment TEXT,
    photo_urls TEXT DEFAULT '[]',                -- JSON array
    status TEXT DEFAULT 'submitted' CHECK(status IN ('submitted', 'reviewed', 'responded', 'resolved')),
    response TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (event_id) REFERENCES events(event_id),
    FOREIGN KEY (amenity_id) REFERENCES amenities(amenity_id)
);

CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback(user_id);

-- ============================================================
-- Enable Full-Text Search (FTS5) for amenity search
-- ============================================================

CREATE VIRTUAL TABLE IF NOT EXISTS amenities_fts USING fts5(
    amenity_id,
    name,
    type,
    section,
    features,
    description,
    content=amenities,
    content_rowid=rowid
);
