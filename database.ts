import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import os from 'os';

// Determine database path. On Vercel, the root is read-only, so we must use /tmp
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
const dbPath = isVercel ? path.join(os.tmpdir(), 'danang_green.db') : 'danang_green.db';

console.log(`[DB] Using database path: ${dbPath}`);
const db = new Database(dbPath);
console.log('[DB] Database connection established.');

export const initDb = () => {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT, -- 'admin', 'district_manager', 'ward_manager', 'school_manager', 'department_manager', 'environment_department'
      area TEXT, -- e.g., 'Hai Chau', 'Son Tra', 'Hoa Vang'
      ward TEXT, -- Ward/Commune name
      organizationName TEXT,
      email TEXT,
      phone TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migration: Add columns if they don't exist
  try {
    db.exec("ALTER TABLE users ADD COLUMN organizationName TEXT");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE users ADD COLUMN email TEXT");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE users ADD COLUMN phone TEXT");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE users ADD COLUMN approvalStatus TEXT DEFAULT 'approved'");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE users ADD COLUMN ward TEXT");
  } catch (e) {}

  // Reports table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      mediaUrl TEXT,
      mediaType TEXT,
      latitude REAL,
      longitude REAL,
      userDescription TEXT,
      issueType TEXT,
      description TEXT,
      priority TEXT,
      solution TEXT,
      isIssuePresent INTEGER, -- boolean stored as 0/1
      status TEXT,
      timestamp TEXT,
      area TEXT,
      ward TEXT, -- Ward name
      reporter TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  try {
    db.exec("ALTER TABLE reports ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP");
  } catch (e) {}

  try {
    db.exec("ALTER TABLE reports ADD COLUMN reporter TEXT");
  } catch (e) {}

  try {
    db.exec("ALTER TABLE reports ADD COLUMN ward TEXT");
  } catch (e) {}

  // Notifications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      reportId TEXT,
      message TEXT,
      type TEXT, -- 'new_report', 'status_update', 'emergency'
      isRead INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(reportId) REFERENCES reports(id)
    )
  `);

  // Orders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      productName TEXT,
      quantity INTEGER,
      address TEXT,
      phone TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id)
    )
  `);

  // Notes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed users if empty
  const stmt = db.prepare('SELECT count(*) as count FROM users');
  const result = stmt.get() as { count: number };
  
  if (result.count === 0) {
    const insert = db.prepare('INSERT INTO users (username, password, role, area, ward, organizationName) VALUES (?, ?, ?, ?, ?, ?)');
    const hashedPassword = bcrypt.hashSync('123456', 10);
    
    // Requested Official Accounts
    insert.run('admin@dananggreen.vn', hashedPassword, 'environment_department', 'All', null, 'Hệ thống Đà Nẵng Green');
    insert.run('quanly@dananggreen.vn', hashedPassword, 'department_manager', 'Hải Châu', null, 'Ban Quản lý Môi trường');
    insert.run('nguoidan1@gmail.com', hashedPassword, 'citizen', 'Hải Châu', null, 'Người dân');
    insert.run('nguoidan2@gmail.com', hashedPassword, 'citizen', 'Thanh Khê', null, 'Người dân');

    // Ward specific accounts
    insert.run('ward.hoacuongbac@dananggreen.vn', hashedPassword, 'ward_manager', 'Hải Châu', 'Hòa Cường Bắc', 'UBND Phường Hòa Cường Bắc');
    insert.run('ward.thachthang@dananggreen.vn', hashedPassword, 'ward_manager', 'Hải Châu', 'Thạch Thang', 'UBND Phường Thạch Thang');
    insert.run('ward.anmy@dananggreen.vn', hashedPassword, 'ward_manager', 'Tam Kỳ', 'An Mỹ', 'UBND Phường An Mỹ');
    insert.run('ward.hoaxuan@dananggreen.vn', hashedPassword, 'ward_manager', 'Cẩm Lệ', 'Hòa Xuân', 'UBND Phường Hòa Xuân');

    // Legacy/Default Accounts
    insert.run('admin', hashedPassword, 'admin', 'All', null, 'Quản trị viên');
    insert.run('quantrivien', hashedPassword, 'admin', 'All', null, 'Quản trị viên');
    insert.run('quản trị viên', hashedPassword, 'admin', 'All', null, 'Quản trị viên');
    console.log('Database seeded with initial users.');
  } else {
    // Ensure the new requested accounts exist even if DB already has data
    const checkUser = db.prepare('SELECT count(*) as count FROM users WHERE username = ?');
    const insert = db.prepare('INSERT INTO users (username, password, role, area, ward, organizationName) VALUES (?, ?, ?, ?, ?, ?)');
    const hashedPassword = bcrypt.hashSync('123456', 10);

    const newUsers = [
      { u: 'admin@dananggreen.vn', r: 'environment_department', a: 'All', w: null as string | null, o: 'Hệ thống Đà Nẵng Green' },
      { u: 'quanly@dananggreen.vn', r: 'department_manager', a: 'Hải Châu', w: null as string | null, o: 'Ban Quản lý Môi trường' },
      { u: 'nguoidan1@gmail.com', r: 'citizen', a: 'Hải Châu', w: null as string | null, o: 'Người dân' },
      { u: 'nguoidan2@gmail.com', r: 'citizen', a: 'Thanh Khê', w: null as string | null, o: 'Người dân' },
      { u: 'ward.hoacuongbac@dananggreen.vn', r: 'ward_manager', a: 'Hải Châu', w: 'Hòa Cường Bắc', o: 'UBND Phường Hòa Cường Bắc' },
      { u: 'ward.thachthang@dananggreen.vn', r: 'ward_manager', a: 'Hải Châu', w: 'Thạch Thang', o: 'UBND Phường Thạch Thang' },
      { u: 'ward.anmy@dananggreen.vn', r: 'ward_manager', a: 'Tam Kỳ', w: 'An Mỹ', o: 'UBND Phường An Mỹ' },
      { u: 'ward.hoaxuan@dananggreen.vn', r: 'ward_manager', a: 'Cẩm Lệ', w: 'Hòa Xuân', o: 'UBND Phường Hòa Xuân' }
    ];

    newUsers.forEach(user => {
      const exists = checkUser.get(user.u) as { count: number };
      if (exists.count === 0) {
        insert.run(user.u, hashedPassword, user.r, user.a, user.w, user.o);
        console.log(`Added requested account: ${user.u}`);
      }
    });
  }
};

export default db;
