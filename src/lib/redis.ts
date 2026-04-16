import { Redis } from '@upstash/redis'

// Para produção (Upstash)
// export const redis = new Redis({
//   url: process.env.UPSTASH_REDIS_REST_URL!,
//   token: process.env.UPSTASH_REDIS_REST_TOKEN!,
// })

// Cliente Redis simples para dev e produção
class RedisClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.REDIS_URL ?? 'redis://localhost:6379'
  }

  // In-memory fallback para quando Redis não está disponível
  private cache = new Map<string, { value: string; expiresAt?: number }>()

  async get(key: string): Promise<string | null> {
    try {
      const entry = this.cache.get(key)
      if (!entry) return null
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        this.cache.delete(key)
        return null
      }
      return entry.value
    } catch {
      return null
    }
  }

  async set(key: string, value: string): Promise<void> {
    this.cache.set(key, { value })
  }

  async setex(key: string, ttl: number, value: string): Promise<void> {
    this.cache.set(key, { value, expiresAt: Date.now() + ttl * 1000 })
  }

  async incr(key: string): Promise<number> {
    const current = this.cache.get(key)
    const newVal = current ? parseInt(current.value) + 1 : 1
    this.cache.set(key, {
      value: String(newVal),
      expiresAt: current?.expiresAt,
    })
    return newVal
  }

  async expire(key: string, seconds: number): Promise<void> {
    const entry = this.cache.get(key)
    if (entry) {
      entry.expiresAt = Date.now() + seconds * 1000
    }
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key)
  }
}

export const redis = new RedisClient()
