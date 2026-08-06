import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import { getDatabase } from './config/database.js'
import { createRequireEntraAuth } from './middleware/auth.js'
import { errorHandler } from './middleware/errorHandler.js'
import focusSessionsRouter from './routes/focusSessions.js'
import healthRouter from './routes/health.js'
import projectsRouter from './routes/projects.js'
import tasksRouter from './routes/tasks.js'
import usersRouter from './routes/users.js'

export function createApp() {
  const app = express()
  const requireEntraAuth = createRequireEntraAuth(getDatabase())

  app.use(helmet())
  app.use(cors())
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
  app.use(express.json())

  app.use('/health', healthRouter)
  app.use('/users', usersRouter)
  app.use('/api/tasks', requireEntraAuth, tasksRouter)
  app.use('/api/projects', requireEntraAuth, projectsRouter)
  app.use('/api/focus-sessions', requireEntraAuth, focusSessionsRouter)

  app.use((_req, res) => {
    res.status(404).json({ error: { message: 'Not found' } })
  })

  app.use(errorHandler)

  return app
}
