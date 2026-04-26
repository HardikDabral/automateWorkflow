import type { Server as HttpServer } from 'node:http'
import { Server as SocketIOServer, type Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { getSubscriber } from '../services/redisService'

interface SocketAuth {
  userId: string
  tenantId: string
  role: 'admin' | 'member'
}

const TENANT_ROOM_PREFIX = 'tenant:'
const EVENT_CHANNEL_PATTERN = 'run-events:*'

let io: SocketIOServer | null = null

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  if (io) return io

  io = new SocketIOServer(httpServer, {
    cors: { origin: true, credentials: true },
  })

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    if (typeof token !== 'string' || !token) {
      return next(new Error('auth: missing token'))
    }
    const secret = process.env.JWT_SECRET
    if (!secret) return next(new Error('auth: JWT not configured'))

    try {
      const decoded = jwt.verify(token, secret) as jwt.JwtPayload
      const { userId, tenantId, role } = decoded as Partial<SocketAuth>
      if (!userId || !tenantId || !role) return next(new Error('auth: malformed token'))
      ;(socket.data as { auth: SocketAuth }).auth = { userId, tenantId, role }
      next()
    } catch {
      next(new Error('auth: invalid or expired token'))
    }
  })

  io.on('connection', (socket: Socket) => {
    const auth = (socket.data as { auth: SocketAuth }).auth
    socket.join(`${TENANT_ROOM_PREFIX}${auth.tenantId}`)
    socket.emit('connected', { tenantId: auth.tenantId })
  })

  bridgeRedisToSockets(io)
  return io
}

export function getIO(): SocketIOServer {
  if (!io) throw new Error('Socket.io not initialized')
  return io
}

/**
 * Single pattern subscriber bridges all tenants' run-events channels to their
 * respective Socket.io rooms. One Redis connection regardless of tenant count.
 */
function bridgeRedisToSockets(ioServer: SocketIOServer): void {
  const sub = getSubscriber()
  sub.psubscribe(EVENT_CHANNEL_PATTERN, (err, count) => {
    if (err) {
      console.error('[socket] psubscribe failed', err)
      return
    }
    console.log(`[socket] subscribed to ${count} pattern(s): ${EVENT_CHANNEL_PATTERN}`)
  })

  sub.on('pmessage', (_pattern, channel, message) => {
    const tenantId = channel.slice('run-events:'.length)
    if (!tenantId) return

    let payload: { type?: string } & Record<string, unknown>
    try {
      payload = JSON.parse(message)
    } catch {
      return
    }

    const eventName = payload.type || 'step:completed'
    // Whitelist what we forward so garbage on the channel can't flood clients.
    if (!isAllowedEvent(eventName)) return

    ioServer.to(`${TENANT_ROOM_PREFIX}${tenantId}`).emit(eventName, payload)
  })
}

function isAllowedEvent(name: string): boolean {
  return name === 'step:completed' || name === 'run:completed' || name === 'run:started'
}
