import { Router } from 'express'
import * as aiController from '../controllers/aiController'

const router = Router()
router.post('/session/start', aiController.startSession)
router.post('/session/:id/message', aiController.sendMessage)
router.delete('/session/:id', aiController.deleteSession)

export default router
