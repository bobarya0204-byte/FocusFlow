/**
 * Apply incremental schema changes to existing databases.
 * Safe to run on every startup after CREATE TABLE IF NOT EXISTS.
 *
 * @param {import('better-sqlite3').Database} db
 */
export function migrateDatabase(db) {
  const taskColumns = db.prepare('PRAGMA table_info(Tasks)').all()
  const columnNames = new Set(taskColumns.map((column) => column.name))

  if (!columnNames.has('RecurrenceJson')) {
    db.exec('ALTER TABLE Tasks ADD COLUMN RecurrenceJson TEXT')
  }

  if (!columnNames.has('RecurrenceStateJson')) {
    db.exec('ALTER TABLE Tasks ADD COLUMN RecurrenceStateJson TEXT')
  }

  db.exec(
    'CREATE INDEX IF NOT EXISTS IX_Tasks_SeriesId ON Tasks (SeriesId)',
  )
}
