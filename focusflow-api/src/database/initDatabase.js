import {
  CREATE_INDEX_STATEMENTS,
  CREATE_TABLE_STATEMENTS,
  INDEX_NAMES,
  TABLE_NAMES,
} from './schema.js'
import { migrateDatabase } from './migrateDatabase.js'

/**
 * Create tables and indexes if they do not already exist.
 * Safe to run on every startup — no sample data is inserted.
 *
 * @param {import('better-sqlite3').Database} db
 */
export function initDatabase(db) {
  db.pragma('foreign_keys = ON')

  db.transaction(() => {
    for (const statement of CREATE_TABLE_STATEMENTS) {
      db.exec(statement)
    }

    for (const statement of CREATE_INDEX_STATEMENTS) {
      db.exec(statement)
    }

    migrateDatabase(db)
  })()
}

/**
 * Verify that all expected tables and indexes exist.
 *
 * @param {import('better-sqlite3').Database} db
 * @returns {{ tables: string[], indexes: string[] }}
 */
export function verifyDatabase(db) {
  const existingTables = new Set(
    db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
      )
      .all()
      .map((row) => row.name),
  )

  const missingTables = TABLE_NAMES.filter((name) => !existingTables.has(name))
  if (missingTables.length > 0) {
    throw new Error(`Missing tables: ${missingTables.join(', ')}`)
  }

  const existingIndexes = new Set(
    db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'index'")
      .all()
      .map((row) => row.name),
  )

  const missingIndexes = INDEX_NAMES.filter((name) => !existingIndexes.has(name))
  if (missingIndexes.length > 0) {
    throw new Error(`Missing indexes: ${missingIndexes.join(', ')}`)
  }

  return {
    tables: [...TABLE_NAMES],
    indexes: [...INDEX_NAMES],
  }
}
