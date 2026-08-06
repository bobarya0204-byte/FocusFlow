import Database from 'better-sqlite3'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { initDatabase } from '../database/initDatabase.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const apiRoot = path.resolve(__dirname, '../..')

/** @type {import('better-sqlite3').Database | null} */
let db = null

export function getDatabasePath() {
  const configured = process.env.DATABASE_PATH || './focusflow.db'
  return path.isAbsolute(configured)
    ? configured
    : path.resolve(apiRoot, configured)
}

/**
 * Open the SQLite database connection (creates the file if missing).
 * @returns {import('better-sqlite3').Database}
 */
export function getDatabase() {
  if (!db) {
    const dbPath = getDatabasePath()
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    // Run migrations before repositories prepare statements (import order safe).
    initDatabase(db)
  }
  return db
}

export function closeDatabase() {
  if (db) {
    db.close()
    db = null
  }
}
