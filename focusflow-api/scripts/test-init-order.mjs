import fs from 'fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const testDb = path.join(path.dirname(fileURLToPath(import.meta.url)), 'test-no-recur.db')
if (fs.existsSync(testDb)) {
  try {
    fs.unlinkSync(testDb)
  } catch {
    // ignore locked file from prior run
  }
}

process.env.DATABASE_PATH = testDb

const { getDatabase, closeDatabase } = await import('../src/config/database.js')
const db = getDatabase()

const columns = db
  .prepare('PRAGMA table_info(Tasks)')
  .all()
  .map((column) => column.name)
console.log('Has RecurrenceJson after getDatabase():', columns.includes('RecurrenceJson'))

const { TaskRepository } = await import('../src/repositories/TaskRepository.js')
const repo = new TaskRepository(db)
console.log('TaskRepository initialized:', Boolean(repo.updateStmt))

closeDatabase()

try {
  fs.unlinkSync(testDb)
} catch {
  // ignore
}
