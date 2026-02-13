import { Controller, Get } from '@nestjs/common';
import { RedisService } from './redis.service';

@Controller('redis')
export class RedisController {
  constructor(private readonly redisService: RedisService) {}

  @Get('ping')
  async ping() {
    return {
      configured: this.redisService.isConfigured(),
      connected: this.redisService.isConnected(),
      pong: await this.redisService.ping(),
    };
  }
}
