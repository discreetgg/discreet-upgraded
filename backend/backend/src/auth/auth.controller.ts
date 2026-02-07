import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Redirect,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { ApiExcludeEndpoint, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChangePinDto, CreatePinDto, VerifyPinDto } from './dto/pin.dto';
import { JwtAuthGuard } from './guards/auth.guard';
import {
  DisableOtpDto,
  GenerateOtpDto,
  ValidateOtpDto,
  VerifyOtpDto,
} from './dto/otp.dto';
import { VerifyAgeDto } from './dto/verify-age.dto';
import { CreatGuestUserDto } from './dto/guest-user';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('discord/signup')
  @ApiOperation({ summary: 'Register a guest user (discord-like account)' })
  @ApiResponse({ status: 201, description: 'Guest user signup successful' })
  async guestSignUp(
    @Body() dto: CreatGuestUserDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<any> {
    try {
      const baseUrl = req.headers.origin;

      const user = await this.authService.signUpGuestUser(dto);

      if (!user) {
        return { authenticated: false, message: 'Authentication failed' };
      }

      const jwt = await this.authService.generateJwt(user);
      const isProduction = process.env.NODE_ENV === 'production';

      res.cookie('auth_token', jwt.accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('refresh_token', jwt.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      if (process.env.NODE_ENV == 'production') {
        //discreet.fans/
        //TODO:redirect to the homepage
        // return res.redirect('https://discreet-mocha.vercel.app/');
        return {
          authenticated: true,
          redirect: baseUrl,
          user,
        };
      }

      return { authenticated: true, user, token: jwt.accessToken };
    } catch (error) {
      console.log(error);
      return { authenticated: false, message: `${error.message}` };
    }
  }

  @Post('discord/signin')
  @ApiOperation({ summary: 'Login a guest user (discord-like account)' })
  @ApiResponse({ status: 201, description: 'Guest user signin successful' })
  async guestSignIn(
    @Body() dto: CreatGuestUserDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<any> {
    try {
      const baseUrl = req.headers.origin;
      const user = await this.authService.loginGuestUser(dto);

      if (!user) {
        return { authenticated: false, message: 'Authentication failed' };
      }

      const jwt = await this.authService.generateJwt(user);
      const isProduction = process.env.NODE_ENV === 'production';

      res.cookie('auth_token', jwt.accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('refresh_token', jwt.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      if (process.env.NODE_ENV == 'production') {
        //discreet.fans/
        //TODO:redirect to the homepage
        // return res.redirect('https://discreet-mocha.vercel.app/');
        return {
          authenticated: true,
          redirect: baseUrl,
          user,
        };
      }

      return { authenticated: true, user, token: jwt.accessToken };
    } catch (error) {
      console.log(error);
      return { authenticated: false, message: `${error.message}` };
    }
  }

  @Get('discord/signin')
  @ApiOperation({ summary: 'Signin a user using discord' })
  @Redirect(process.env.DISCORD_OAUTH2_URL, 302)
  discordSignIn(): Promise<any> {
    return;
  }

  @ApiExcludeEndpoint()
  @Get('discord/callback')
  async discordCallback(
    @Query('code') code: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<any> {
    try {
      const user = await this.authService.authenticate(code);
      if (!user) {
        return { authenticated: false, message: 'Authentication failed' };
      }
      const jwt = await this.authService.generateJwt(user);
      const isProduction = process.env.NODE_ENV === 'production';

      res.cookie('auth_token', jwt.accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('refresh_token', jwt.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      if (process.env.NODE_ENV == 'production') {
        //discreet.fans/
        //TODO:redirect to the homepage
        // return res.redirect('https://discreet-mocha.vercel.app/');
        return res.redirect('https://www.discreet.gg');
      }

      return { authenticated: true, user, token: jwt.accessToken };
    } catch (error) {
      console.log(error);
      return { authenticated: false, message: 'Authentication error' };
    }
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies['refresh_token'];
    if (!token) {
      throw new UnauthorizedException('No refresh token');
    }

    try {
      const payload = await this.authService.verifyRefreshToken(token);

      const { sub, userId, ...rest } = payload;

      const { accessToken, refreshToken } = await this.authService.generateJwt({
        discordId: sub,
        _id: userId,
        ...rest,
      });

      const isProduction = process.env.NODE_ENV === 'production';

      res.cookie('auth_token', accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return { statusCode: 200, message: 'Token refreshed' };
    } catch (error) {
      console.log(error);
      // Refresh token invalid/expired → force logout
      res.clearCookie('auth_token');
      res.clearCookie('refresh_token');
      console.log('hereee');
      throw new UnauthorizedException('Session expired, please login again');
    }
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout user' })
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('auth_token');
    res.clearCookie('refresh_token');
    return { message: 'Logged out successfully', successful: true };
  }

  @Post('verify-age')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Call after verifying a users Age, to update the state',
  })
  @HttpCode(200)
  async verifyAge(@Body() dto: VerifyAgeDto, @Req() req: any) {
    //TODO:check if bot provided discord ID and logged in ID are same
    const userId = req.user.sub;
    return this.authService.verifyAge(userId);
  }

  @Post('create-pin')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create user PIN' })
  @HttpCode(201)
  async createPin(@Body() dto: CreatePinDto) {
    return this.authService.createPin(dto.discordId, dto.pin);
  }

  @Post('change-pin')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Change user PIN' })
  @HttpCode(200)
  async changePin(@Body() dto: ChangePinDto, @Req() req: any) {
    const userId = req.user.sub;
    console.log(userId);
    //TODO: check if userId is same as discord users
    return this.authService.changePin(dto.discordId, dto.oldPin, dto.newPin);
  }

  @Post('remove-pin')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Remove or disable user PIN' })
  @HttpCode(200)
  async removePin(@Body() dto: VerifyPinDto, @Req() req: any) {
    const userId = req.user.sub;
    console.log(userId);
    return this.authService.removePin(userId, dto.pin);
  }

  @Post('2fa/generate')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Generate OTP secret for user' })
  @ApiResponse({ status: 200, description: 'OTP generated successfully' })
  async generateOTP(@Body() dto: GenerateOtpDto) {
    return this.authService.generateOTP(dto.discordId);
  }

  @Post('2fa/verify')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Verify OTP token and enable 2FA' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  async verifyOTP(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOTP(dto.discordId, dto.token);
  }

  @Post('2fa/validate')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Validate OTP token (for login/session auth)' })
  @ApiResponse({ status: 200, description: 'OTP validated successfully' })
  async validateOTP(@Body() dto: ValidateOtpDto) {
    return this.authService.validateOTP(dto.discordId, dto.token);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Disable OTP for user' })
  @ApiResponse({ status: 200, description: 'OTP disabled successfully' })
  async disableOTP(@Body() dto: DisableOtpDto) {
    return this.authService.disableOTP(dto.discordId);
  }

  @Post('2fa/generate-backup-codes')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Generate 2FA backup codes' })
  async generateBackupCodes(@Body() dto: GenerateOtpDto) {
    return this.authService.generateBackupCodes(dto.discordId);
  }

  @Post('2fa/verify-backup-code')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Verify a backup code to bypass 2FA' })
  async verifyBackupCode(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyBackupCode(dto.discordId, dto.token);
  }
}
