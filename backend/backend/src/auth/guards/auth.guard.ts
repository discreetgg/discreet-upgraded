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
    //
    // console.log(process.env.NODE_ENV == 'production');
    const token = request.cookies?.auth_token;
    // console.log('token:', token);
    if (!token) {
      // return false;
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = await this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      // console.log('this is payload ', payload);
      request.user = payload;
      return true;
    } catch {
      // return false;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

// @UseGuards(JwtAuthGuard)
