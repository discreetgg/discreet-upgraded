import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch()
export class WsAllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(WsAllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();
    const data = host.switchToWs().getData();

    let message = 'Internal server error';

    if (exception instanceof WsException) {
      const err = exception.getError();
      message =
        typeof err === 'string' ? err : ((err as any)?.message ?? message);
    } else if (exception instanceof Error) {
      message = exception.message;
    } else if (typeof exception === 'object' && exception !== null) {
      message = (exception as any).message ?? message;
    }

    this.logger.error(
      `WS error: ${message}`,
      exception instanceof Error ? exception.stack : '',
    );

    // Emitting a structured error back to client
    try {
      client.emit('error', {
        event: data?.event ?? 'unknown',
        message,
      });
    } catch (emitErr) {
      this.logger.error('Failed to emit ws error', emitErr);
    }
  }
}
