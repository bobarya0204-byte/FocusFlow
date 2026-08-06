import { Router } from 'express'
import { getDatabase } from '../config/database.js'
import { ProjectController } from '../controllers/ProjectController.js'

const router = Router()
const projectController = new ProjectController(getDatabase())

router.get('/', projectController.listProjects)
router.get('/:id', projectController.getProject)
router.post('/', projectController.createProject)
router.put('/:id', projectController.updateProject)
router.delete('/:id', projectController.deleteProject)

export default router
