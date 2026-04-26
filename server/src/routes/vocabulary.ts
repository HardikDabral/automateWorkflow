import { Router } from 'express'
import * as controller from '../controllers/vocabularyController'

const router = Router()
router.get('/', controller.getVocabulary)
router.put('/', controller.updateVocabulary)

export default router
