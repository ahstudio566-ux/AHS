import Database from 'better-sqlite3';
try {
  const db = new Database('test.db');
  console.log('Success');
  db.close();
} catch (e) {
  console.error('Failure:', e);
}
