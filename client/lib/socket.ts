'use client'

import { io, type Socket } from 'socket.io-client'
import { getToken } from './auth'

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

let socket: Socket | null = null

export function getSocket(): Socket {
  const token = getToken()
  if (socket && socket.connected) return socket
  if (socket) {
    socket.disconnect()
    socket = null
  }
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true,
  })
  return socket
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
