const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const DB_PATH = process.env.DB_PATH || './data/venue.db';
const dbDir = path.dirname(path.resolve(__dirname, '../../', DB_PATH));

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.resolve(__dirname, '../../', DB_PATH);

function getDb() {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

function initializeDatabase() {
  const db = getDb();
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  
  // Use exec to run the entire schema at once — better-sqlite3 supports this
  try {
    db.exec(schema);
    console.log('Database initialized at:', dbPath);
  } catch (err) {
    console.error('Schema initialization error:', err.message);
  }
  
  db.close();
}

if (require.main === module) { initializeDatabase(); }
module.exports = { getDb, initializeDatabase };
