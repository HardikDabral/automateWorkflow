import Redis from 'ioredis'

let client: Redis | null = null
let publisher: Redis | null = null
let subscriber: Redis | null = null

function buildRedisOptions() {
  const password = process.env.REDIS_PASSWORD || undefined
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT || 6379),
    password,
    maxRetriesPerRequest: null as null, // BullMQ requires this
  }
}

export function getRedis(): Redis {
  if (!client) client = new Redis(buildRedisOptions())
  return client
}

export function getPublisher(): Redis {
  if (!publisher) publisher = new Redis(buildRedisOptions())
  return publisher
}

export function getSubscriber(): Redis {
  if (!subscriber) subscriber = new Redis(buildRedisOptions())
  return subscriber
}

/** Cache helper: get value by key, or null if missing. */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const raw = await getRedis().get(key)
  if (raw == null) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

/** Cache helper: set value with TTL (seconds). */
export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  await getRedis().set(key, JSON.stringify(value), 'EX', ttlSeconds)
}

export async function cacheDel(key: string): Promise<void> {
  await getRedis().del(key)
}

export function vocabCacheKey(tenantId: string): string {
  return `vocab:${tenantId}`
}

export function sessionCacheKey(sessionId: string): string {
  return `session:${sessionId}`
}

export function runEventsChannel(tenantId: string): string {
  return `run-events:${tenantId}`
}
