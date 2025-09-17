/**
 * Simple in-memory cache for session-related data
 * Reduces database queries for frequently accessed data
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // time to live in milliseconds
}

class SessionCache {
  private cache = new Map<string, CacheItem<any>>();

  /**
   * Set cache item with TTL
   */
  set<T>(key: string, data: T, ttlMs: number = 300000): void { // Default 5 minutes
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  /**
   * Get cache item if not expired
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    const now = Date.now();
    const isExpired = now - item.timestamp > item.ttl;

    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * Delete cache item
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear expired items (cleanup)
   */
  cleanup(): number {
    const now = Date.now();
    let deletedCount = 0;

    for (const [key, item] of this.cache.entries()) {
      const isExpired = now - item.timestamp > item.ttl;
      if (isExpired) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }
}

// Global singleton instance
const sessionCache = new SessionCache();

// Cleanup expired items every 10 minutes
setInterval(() => {
  const deletedCount = sessionCache.cleanup();
  if (deletedCount > 0) {
    console.log(`[CACHE] Cleaned up ${deletedCount} expired cache items`);
  }
}, 10 * 60 * 1000);

export { sessionCache };

// Cache key generators
export const getCacheKeys = {
  messageCount: (userId: string, hours: number) => `msg_count:${userId}:${hours}h`,
  userSession: (userId: string) => `session:${userId}`,
  chatInfo: (chatId: string) => `chat:${chatId}`,
};