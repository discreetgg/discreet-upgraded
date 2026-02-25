import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const cookieToken =
      typeof request.cookies?.auth_token === 'string'
        ? request.cookies.auth_token
        : '';
    const authorizationHeader =
      typeof request.headers?.authorization === 'string'
        ? request.headers.authorization
        : '';
    const bearerToken = authorizationHeader.startsWith('Bearer ')
      ? authorizationHeader.slice('Bearer '.length).trim()
      : '';
    const token = cookieToken || bearerToken;
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = await this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

// @UseGuards(JwtAuthGuard)
