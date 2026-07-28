export class CacheService {
  async get(key) {
    throw new Error("get() not implemented");
  }
  async set(key, value, ttlSeconds = 300) {
    throw new Error("set() not implemented");
  }
  async delete(key) {
    throw new Error("delete() not implemented");
  }
  async clear() {
    throw new Error("clear() not implemented");
  }
}

/**
 * 1. IN-MEMORY CACHE PROVIDER (with TTL support)
 */
export class MemoryCacheService extends CacheService {
  constructor() {
    super();
    this.store = new Map();
  }

  async get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;

    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key, value, ttlSeconds = 300) {
    const expiresAt = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value, expiresAt });
    return true;
  }

  async delete(key) {
    return this.store.delete(key);
  }

  async clear() {
    this.store.clear();
    return true;
  }
}

/**
 * 2. REDIS CACHE ADAPTER (Stubbed for future deployment integration)
 */
export class RedisCacheService extends CacheService {
  constructor() {
    super();
    // In production, instantiate ioredis or redis client:
    // this.client = new Redis(connectionString);
    this.fallback = new MemoryCacheService();
    console.log("[RedisCacheService] Initialized (stub fallback active)");
  }

  async get(key) {
    console.log(`[RedisCacheService] GET: ${key}`);
    return this.fallback.get(key);
  }

  async set(key, value, ttlSeconds = 300) {
    console.log(`[RedisCacheService] SET: ${key} (TTL: ${ttlSeconds}s)`);
    return this.fallback.set(key, value, ttlSeconds);
  }

  async delete(key) {
    console.log(`[RedisCacheService] DELETE: ${key}`);
    return this.fallback.delete(key);
  }

  async clear() {
    console.log(`[RedisCacheService] CLEAR`);
    return this.fallback.clear();
  }
}

// Export default memory cache instance (ensuring existing behavior remains unchanged)
export const cache = new MemoryCacheService();
export default cache;
