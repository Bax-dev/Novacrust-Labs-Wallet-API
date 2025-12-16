import { RateLimitEntry } from '../types/rate-limit.types';

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor(
    private readonly maxRequests: number = 100,
    private readonly windowMs: number = 60000, 
    private readonly cleanupIntervalMs: number = 60000,
  ) {

    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.cleanupIntervalMs);
  }


  isAllowed(key: string): boolean {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry) {
      this.store.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    if (now > entry.resetTime) {
      entry.count = 1;
      entry.resetTime = now + this.windowMs;
      return true;
    }

    if (entry.count >= this.maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }


  getRemaining(key: string): number {
    const entry = this.store.get(key);
    if (!entry) {
      return this.maxRequests;
    }

    const now = Date.now();
    if (now > entry.resetTime) {
      return this.maxRequests;
    }

    return Math.max(0, this.maxRequests - entry.count);
  }

  getResetTime(key: string): number {
    const entry = this.store.get(key);
    if (!entry) {
      return Date.now() + this.windowMs;
    }
    return entry.resetTime;
  }


  reset(key: string): void {
    this.store.delete(key);
  }


  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }


  clear(): void {
    this.store.clear();
  }

 
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

export const defaultRateLimiter = new RateLimiter(100, 60000);
export const strictRateLimiter = new RateLimiter(10, 60000); 
export const fundRateLimiter = new RateLimiter(20, 60000);
export const transferRateLimiter = new RateLimiter(10, 60000); 

export { RateLimiter };

