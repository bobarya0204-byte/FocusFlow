import 'dotenv/config'
import { createApp } from './app.js'
import { closeDatabase, getDatabase, getDatabasePath } from './config/database.js'
import { ensureLocalFixtures } from './database/ensureLocalFixtures.js'
import { initDatabase, verifyDatabase } from './database/initDatabase.js'

const port = Number(process.env.PORT) || 3001
const dbPath = getDatabasePath()

const db = getDatabase()
console.log('✓ SQLite connected')
console.log(`  → ${dbPath}`)

initDatabase(db)
ensureLocalFixtures(db)
console.log('✓ Database initialized')

const { tables, indexes } = verifyDatabase(db)
console.log('✓ Tables verified')
console.log(`  → ${tables.length} tables, ${indexes.length} indexes`)

const app = createApp()

const server = app.listen(port, () => {
  console.log(`FocusFlow API listening on http://localhost:${port}`)
})

function shutdown(signal) {
  console.log(`\n${signal} received — shutting down FocusFlow API`)
  server.close(() => {
    closeDatabase()
    process.exit(0)
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
