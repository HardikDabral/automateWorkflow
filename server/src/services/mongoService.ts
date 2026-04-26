import mongoose from 'mongoose'

let connected = false

export async function connectMongo(): Promise<void> {
  if (connected) return
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set')
  mongoose.set('strictQuery', true)
  await mongoose.connect(uri)
  connected = true
  console.log('[mongo] connected')
}

export async function disconnectMongo(): Promise<void> {
  if (!connected) return
  await mongoose.disconnect()
  connected = false
}
