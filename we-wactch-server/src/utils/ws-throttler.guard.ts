import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsThrottlerGuard extends ThrottlerGuard {
  override getRequestResponse(context: ExecutionContext) {
    const ws = context.switchToWs();
    const client = ws.getClient();
    return {
      req: client,
      res: {},
    };
  }

  protected override async getTracker(req: any): Promise<string> {
    // req is the socket client instance
    return req.conn?.remoteAddress || req.id;
  }

  protected override async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const ws = context.switchToWs();
    const client = ws.getClient();
    
    // Notify the client directly over the socket about the rate limit
    client.emit('error', 'Thao tác quá nhanh. Vui lòng chậm lại.');
    
    throw new WsException(`Rate limit exceeded: ${throttlerLimitDetail.key}`);
  }
}
