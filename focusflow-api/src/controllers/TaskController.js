import { TaskRepository } from '../repositories/TaskRepository.js'
import { getAuthenticatedOwnerId } from '../utils/requestAuth.js'
import { HttpError } from '../utils/httpError.js'

export class TaskController {
  /**
   * @param {import('better-sqlite3').Database} db
   */
  constructor(db) {
    this.taskRepository = new TaskRepository(db)
  }

  listTasks = (req, res, next) => {
    try {
      const ownerId = getAuthenticatedOwnerId(req)
      const tasks = this.taskRepository.getAllTasks(ownerId)
      res.status(200).json(tasks)
    } catch (error) {
      next(error)
    }
  }

  getTask = (req, res, next) => {
    try {
      const ownerId = getAuthenticatedOwnerId(req)
      const task = this.taskRepository.getTaskById(req.params.id, ownerId)
      if (!task) {
        throw new HttpError(404, 'Task not found')
      }
      res.status(200).json(task)
    } catch (error) {
      next(error)
    }
  }

  createTask = (req, res, next) => {
    try {
      const ownerId = getAuthenticatedOwnerId(req)
      const task = this.taskRepository.createTask({
        ...req.body,
        ownerId,
      })
      res.status(201).json(task)
    } catch (error) {
      if (error.message === 'Task title is required') {
        next(new HttpError(400, error.message))
        return
      }
      next(error)
    }
  }

  updateTask = (req, res, next) => {
    try {
      const ownerId = getAuthenticatedOwnerId(req)
      const task = this.taskRepository.updateTask(
        req.params.id,
        req.body,
        ownerId,
      )

      if (!task) {
        throw new HttpError(404, 'Task not found')
      }

      res.status(200).json(task)
    } catch (error) {
      if (
        error.message === 'Task title is required' ||
        error.message === 'Invalid recurrence payload'
      ) {
        next(new HttpError(400, error.message))
        return
      }
      next(error)
    }
  }

  deleteTask = (req, res, next) => {
    try {
      const ownerId = getAuthenticatedOwnerId(req)
      const deleted = this.taskRepository.softDeleteTask(
        req.params.id,
        ownerId,
      )

      if (!deleted) {
        throw new HttpError(404, 'Task not found')
      }

      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}
