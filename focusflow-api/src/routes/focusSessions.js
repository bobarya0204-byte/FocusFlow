import { Router } from 'express'
import { getDatabase } from '../config/database.js'
import { FocusSessionController } from '../controllers/FocusSessionController.js'

const router = Router()
const focusSessionController = new FocusSessionController(getDatabase())

router.get('/', focusSessionController.listSessions)
router.post('/', focusSessionController.createSession)
router.put('/:id', focusSessionController.updateSession)
router.delete('/:id', focusSessionController.deleteSession)

export default router
