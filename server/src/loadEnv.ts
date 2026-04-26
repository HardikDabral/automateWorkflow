import path from 'node:path'
import fs from 'node:fs'
import dotenv from 'dotenv'

// Walk up from this file to find the monorepo root (first dir containing .env),
// so env loading is robust regardless of CWD (server, worker, or root).
function findEnvPath(): string | null {
  let dir = __dirname
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(dir, '.env')
    if (fs.existsSync(candidate)) return candidate
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return null
}

const envPath = findEnvPath()
if (envPath) {
  dotenv.config({ path: envPath })
} else {
  dotenv.config()
}
