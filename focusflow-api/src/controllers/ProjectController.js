import { ProjectRepository } from '../repositories/ProjectRepository.js'
import { getAuthenticatedOwnerId } from '../utils/requestAuth.js'
import { HttpError } from '../utils/httpError.js'

export class ProjectController {
  /**
   * @param {import('better-sqlite3').Database} db
   */
  constructor(db) {
    this.projectRepository = new ProjectRepository(db)
  }

  listProjects = (req, res, next) => {
    try {
      const ownerId = getAuthenticatedOwnerId(req)
      const projects = this.projectRepository.getAllProjects(ownerId)
      res.status(200).json(projects)
    } catch (error) {
      next(error)
    }
  }

  getProject = (req, res, next) => {
    try {
      const ownerId = getAuthenticatedOwnerId(req)
      const project = this.projectRepository.getProjectById(
        req.params.id,
        ownerId,
      )
      if (!project) {
        throw new HttpError(404, 'Project not found')
      }
      res.status(200).json(project)
    } catch (error) {
      next(error)
    }
  }

  createProject = (req, res, next) => {
    try {
      const ownerId = getAuthenticatedOwnerId(req)
      const project = this.projectRepository.createProject(req.body, ownerId)
      res.status(201).json(project)
    } catch (error) {
      if (error.message === 'Project name is required') {
        next(new HttpError(400, error.message))
        return
      }
      next(error)
    }
  }

  updateProject = (req, res, next) => {
    try {
      const ownerId = getAuthenticatedOwnerId(req)
      const project = this.projectRepository.updateProject(
        req.params.id,
        req.body,
        ownerId,
      )

      if (!project) {
        throw new HttpError(404, 'Project not found')
      }

      res.status(200).json(project)
    } catch (error) {
      if (
        error.message === 'Project name is required' ||
        error.message === 'System project cannot be modified'
      ) {
        next(new HttpError(400, error.message))
        return
      }
      next(error)
    }
  }

  deleteProject = (req, res, next) => {
    try {
      const ownerId = getAuthenticatedOwnerId(req)
      const archived = this.projectRepository.archiveProject(
        req.params.id,
        ownerId,
      )

      if (!archived) {
        throw new HttpError(404, 'Project not found')
      }

      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}
