export interface IdempotencyEntry<T> {
  result: T;
  timestamp: number;
  expiresAt: number;
}

