import { Router } from 'express'
import * as runController from '../controllers/runController'

const router = Router()
router.get('/:runId', runController.get)
router.post('/:runId/cancel', runController.cancel)

export default router
