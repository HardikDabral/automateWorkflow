import './loadEnv'
import 'express-async-errors'
import http from 'node:http'
import express from 'express'
import cors from 'cors'
import { connectMongo } from './services/mongoService'
import authRouter from './routes/auth'
import vocabularyRouter from './routes/vocabulary'
import workflowsRouter from './routes/workflows'
import runsRouter from './routes/runs'
import aiRouter from './routes/ai'
import { requireAuth } from './middleware/auth'
import { errorHandler } from './middleware/errorHandler'
import { initSocketServer } from './socket/socketServer'
import { getUsage } from './services/quotaService'
import { startWorker } from '../../worker/src/index'

async function main() {
  await connectMongo()

  const app = express()
  app.use(cors())
  app.use(express.json({ limit: '2mb' }))

  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'server' })
  })

  app.use('/api/auth', authRouter)
  app.use('/api/vocabulary', requireAuth, vocabularyRouter)
  app.use('/api/workflows', requireAuth, workflowsRouter)
  app.use('/api/runs', requireAuth, runsRouter)
  app.use('/api/ai', requireAuth, aiRouter)

  app.get('/api/me', requireAuth, (req, res) => {
    res.json({ user: req.user })
  })

  app.get('/api/me/usage', requireAuth, async (_req, res, next) => {
    try {
      res.json(await getUsage())
    } catch (e) {
      next(e)
    }
  })

  app.use(errorHandler)

  const server = http.createServer(app)
  initSocketServer(server)

  if (process.env.INLINE_WORKER === 'true') {
    startWorker()
  }

  const port = Number(process.env.PORT || 5000)
  server.listen(port, () => {
    console.log(`[server] listening on :${port}`)
  })
}

main().catch((err) => {
  console.error('[server] failed to start', err)
  process.exit(1)
})
