import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Request } from 'express';
import { RateLimiter } from './rate-limiter.util';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly rateLimiter: RateLimiter) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const key = this.getKey(request);

    if (!this.rateLimiter.isAllowed(key)) {
      const remaining = this.rateLimiter.getRemaining(key);
      const resetTime = this.rateLimiter.getResetTime(key);

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests, please try again later',
          retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
          remaining,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private getKey(request: Request): string {
    // Use IP address as the key, fallback to a default if not available
    const ip =
      request.ip ||
      request.headers['x-forwarded-for'] ||
      request.connection.remoteAddress ||
      'unknown';
    return Array.isArray(ip) ? ip[0] : ip;
  }
}

