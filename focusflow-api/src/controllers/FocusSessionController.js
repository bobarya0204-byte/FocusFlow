import { FocusSessionRepository } from '../repositories/FocusSessionRepository.js'
import { getAuthenticatedOwnerId } from '../utils/requestAuth.js'
import { HttpError } from '../utils/httpError.js'

export class FocusSessionController {
  /**
   * @param {import('better-sqlite3').Database} db
   */
  constructor(db) {
    this.focusSessionRepository = new FocusSessionRepository(db)
  }

  listSessions = (req, res, next) => {
    try {
      const ownerId = getAuthenticatedOwnerId(req)
      const sessions = this.focusSessionRepository.getAllSessions(ownerId)
      res.status(200).json(sessions)
    } catch (error) {
      next(error)
    }
  }

  createSession = (req, res, next) => {
    try {
      const ownerId = getAuthenticatedOwnerId(req)
      const session = this.focusSessionRepository.createSession({
        ...req.body,
        ownerId,
      })
      res.status(201).json(session)
    } catch (error) {
      if (error.message === 'Session completedAt is required') {
        next(new HttpError(400, error.message))
        return
      }
      next(error)
    }
  }

  updateSession = (req, res, next) => {
    try {
      const ownerId = getAuthenticatedOwnerId(req)
      const session = this.focusSessionRepository.updateSession(
        req.params.id,
        req.body,
        ownerId,
      )

      if (!session) {
        throw new HttpError(404, 'Focus session not found')
      }

      res.status(200).json(session)
    } catch (error) {
      next(error)
    }
  }

  deleteSession = (req, res, next) => {
    try {
      const ownerId = getAuthenticatedOwnerId(req)
      const deleted = this.focusSessionRepository.deleteSession(
        req.params.id,
        ownerId,
      )

      if (!deleted) {
        throw new HttpError(404, 'Focus session not found')
      }

      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}
