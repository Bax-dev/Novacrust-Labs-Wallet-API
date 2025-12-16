import { IdempotencyEntry } from '../types/idempotency.types';

class IdempotencyService {
  private store: Map<string, IdempotencyEntry<any>> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval>;
  private readonly defaultTtl: number = 24 * 60 * 60 * 1000; 

  constructor(cleanupIntervalMs: number = 60 * 60 * 1000) {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, cleanupIntervalMs);
  }

  generateKey(
    walletId: string,
    operation: 'fund' | 'transfer',
    amount: number,
    additionalData?: string,
  ): string {
    const data = `${walletId}:${operation}:${amount}:${additionalData || ''}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; 
    }
    return `idempotency:${Math.abs(hash).toString(36)}:${walletId}`;
  }

  generateTransferKey(
    senderWalletId: string,
    receiverWalletId: string,
    amount: number,
  ): string {
    return this.generateKey(
      senderWalletId,
      'transfer',
      amount,
      receiverWalletId,
    );
  }

  generateFundKey(walletId: string, amount: number): string {
    return this.generateKey(walletId, 'fund', amount);
  }


  get<T>(key: string): T | null {
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.result as T;
  }


  set<T>(key: string, result: T, ttl: number = this.defaultTtl): void {
    const now = Date.now();
    this.store.set(key, {
      result,
      timestamp: now,
      expiresAt: now + ttl,
    });
  }


  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }

    return true;
  }


  delete(key: string): void {
    this.store.delete(key);
  }


  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }


  getStats(): { total: number; expired: number } {
    const now = Date.now();
    let expired = 0;
    for (const entry of this.store.values()) {
      if (now > entry.expiresAt) {
        expired++;
      }
    }
    return {
      total: this.store.size,
      expired,
    };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

export const idempotencyService = new IdempotencyService();

export { IdempotencyService };

