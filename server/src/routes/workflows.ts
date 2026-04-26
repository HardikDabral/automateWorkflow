import { Router } from 'express'
import * as workflowController from '../controllers/workflowController'
import * as runController from '../controllers/runController'

const router = Router()

router.get('/', workflowController.list)
router.post('/', workflowController.create)
router.get('/:id', workflowController.get)
router.post('/:id/versions', workflowController.createVersion)
router.get('/:id/activate-preview', workflowController.activatePreview)
router.post('/:id/activate', workflowController.activate)
router.post('/:id/pause', workflowController.pause)
router.post('/:id/test-run', workflowController.testRun)
router.get('/:id/runs', runController.listForWorkflow)

export default router
