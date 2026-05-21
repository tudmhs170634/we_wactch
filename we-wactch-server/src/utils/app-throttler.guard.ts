import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() === 'ws') {
      return true; // Bypass global rate limiting for WebSockets (gateways apply WsThrottlerGuard selectively)
    }
    return super.canActivate(context);
  }
}
