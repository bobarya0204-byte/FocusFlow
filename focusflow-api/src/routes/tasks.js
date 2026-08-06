import { Router } from 'express'
import { getDatabase } from '../config/database.js'
import { TaskController } from '../controllers/TaskController.js'

const router = Router()
const taskController = new TaskController(getDatabase())

router.get('/', taskController.listTasks)
router.get('/:id', taskController.getTask)
router.post('/', taskController.createTask)
router.put('/:id', taskController.updateTask)
router.delete('/:id', taskController.deleteTask)

export default router
