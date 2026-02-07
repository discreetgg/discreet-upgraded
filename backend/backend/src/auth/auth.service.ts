import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, User, UserDocument } from 'src/database/schemas/user.schema';
import { UserService } from 'src/user/user.service';
import { DiscordUser } from '../user/interfaces/userAuth.interface';
import * as bcrypt from 'bcrypt';
import * as OTPAuth from 'otpauth';
import { generateRandomBase32 } from './utils/base32.utils';
import { nanoid } from 'nanoid';
import { GenerateJWTDto } from './dto/jwt.dto';
import { CreatGuestUserDto } from './dto/guest-user';
import { generateUniqueGuestDiscordId } from './utils/generate-guest-id';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);
  private readonly saltRounds = 10;

  constructor(
    private readonly httpService: HttpService,
    private readonly jwtService: JwtService,
    private readonly usersService: UserService,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async authenticate(code: string): Promise<any> {
    this.logger.log(`Getting Discord access token for code: ${code}`);

    const url = 'https://discord.com/api/oauth2/token';
    const params = new URLSearchParams();
    params.append('client_id', process.env.DISCORD_CLIENT_ID);
    params.append('client_secret', process.env.DISCORD_CLIENT_SECRET);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', process.env.DISCORD_REDIRECT_URI);

    try {
      const response = await this.httpService.axiosRef.post(
        url,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept-Encoding': 'application/x-www-form-urlencoded',
          },
        },
      );
      this.logger.log('Discord access token retrieved successfully');
      const user = await this.httpService.axiosRef.get(
        'https://discord.com/api/users/@me',
        {
          headers: {
            Authorization: `Bearer ${response.data.access_token}`,
          },
        },
      );

      console.log(user.data); // contains Discord user info
      if (!user.data) {
        return;
      }
      const savedUser = await this.createOrUpdateUserDiscordDetails(user.data);
      console.log(savedUser);
      if (savedUser.isDeleted) {
        throw new ForbiddenException(
          'This account is scheduled for deletion. Restore within 30 days.',
        );
      }
      return savedUser;
    } catch (error) {
      this.logger.error('Error retrieving Discord access token', error);
      throw error;
    }
  }

  // safeUser = plainToInstance(UserResponseDto, newUser, {
  //   excludeExtraneousValues: true,
  // });

  async createOrUpdateUserDiscordDetails(user: DiscordUser): Promise<any> {
    console.log(user);
    try {
      const existingUser = await this.userModel.findOne({ discordId: user.id });
      if (existingUser) {
        this.logger.log(`User with Discord ID ${user.id} already exists.`);
        const updatedUser =
          await this.usersService.UpdateUserDiscordDetails(user);
        return updatedUser;
      }
      this.logger.log(`Creating new user with Discord ID ${user.id}.`);
      const newUser = await this.usersService.createUser(user);

      return newUser;
    } catch (error) {
      this.logger.error('Error finding user by Discord ID', error);
      throw error;
    }
  }

  async signUpGuestUser(dto: CreatGuestUserDto): Promise<any> {
    this.logger.log(`Guest signup attempt for username: ${dto.username}`);

    const existingUser = await this.userModel.findOne({
      username: dto.username,
    });
    if (existingUser) {
      throw new BadRequestException(`Username already taken`);
    }

    const hashedPassword = await bcrypt.hash(dto.password, this.saltRounds);

    const user = new this.userModel({
      discordId: generateUniqueGuestDiscordId(),
      username: dto.username,
      email: 'discreetglobal@gmail.com',
      displayName: dto.username,
      discordDisplayName: dto.username,
      role: dto.isSeller ? Role.SELLER : Role.BUYER,
      discordAvatar: '29c4551bd591cacf7e8a8a8f093296ec', // optional default
      hashedPassword,
    });

    const savedUser = await user.save();

    await this.usersService.walletService.createWallet(
      savedUser._id.toString(),
    );

    return {
      id: savedUser._id,
      username: savedUser.username,
      discordId: savedUser.discordId,
      displayName: savedUser.displayName,
      avatar: savedUser.discordAvatar,
    };
  }

  async loginGuestUser(dto: CreatGuestUserDto): Promise<any> {
    const user = await this.userModel.findOne({ username: dto.username });
    if (!user) throw new UnauthorizedException('Invalid username or password');

    const valid = await bcrypt.compare(dto.password, user.hashedPassword);
    if (!valid) throw new UnauthorizedException('Invalid username or password');

    return {
      id: user._id,
      username: user.username,
      discordId: user.discordId,
      displayName: user.displayName,
      avatar: user.discordAvatar,
    };
  }

  async generateJwt(user: UserDocument | GenerateJWTDto) {
    const payload = {
      sub: user.discordId,
      username: user.username,
      role: user.role,
      email: user.email,
      // userId: user._id.toString() || user.id,
      userId: user._id ? user._id.toString() : user.id,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_ACCESS_EXPIRES,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async verifyRefreshToken(token: string) {
    return this.jwtService.verifyAsync(token, {
      secret: process.env.JWT_REFRESH_SECRET,
    });
  }

  // async generateJwt(user: UserDocument) {
  //   const payload = {
  //     sub: user.discordId,
  //     username: user.username,
  //     roles: user.role,
  //     email: user.email,
  //     userId: user._id,
  //   };

  //   return {
  //     access_token: this.jwtService.sign(payload),
  //   };
  // }

  async createPin(discordId: string, pin: string) {
    const hashedPin = await bcrypt.hash(pin, this.saltRounds);
    const user = await this.userModel.findOne({ discordId });
    if (!user) throw new NotFoundException('User not found');
    if (user.hasAuthPin) throw new ConflictException('User already has pin');
    const updatedUser = await this.userModel.findOneAndUpdate(
      { discordId },
      { hashedPin, hasAuthPin: true },
      { new: true },
    );
    if (!updatedUser) throw new NotFoundException('User not found');
    return { status: 'success', message: 'Pin created successfully' };
  }

  async verifyAge(discordId: string): Promise<any> {
    try {
      const user = await this.userModel.findOne({ discordId });
      console.log(user);
      if (!user) throw new NotFoundException('User not found');
      if (user.isAgeVerified) {
        return {
          status: 'success',
          message: 'User age is already verified',
        };
      }
      const updatedUser = await this.userModel
        .findOneAndUpdate({ discordId }, { isAgeVerified: true }, { new: true })
        .select('-_2FAData');

      if (!updatedUser) throw new NotFoundException('User not found');

      return {
        status: 'success',
        message: 'Age verified successfully',
        updatedUser,
      };
    } catch (error) {
      this.logger.error('Error age verified', error);
      throw error;
    }
  }

  async verifyPin(discordId: string, pin: string) {
    const user = await this.userModel.findOne({ discordId });
    if (!user || !user.hashedPin)
      throw new NotFoundException('User or PIN not found');

    const isValid = await bcrypt.compare(pin, user.hashedPin);
    if (!isValid) throw new BadRequestException('Invalid PIN');

    return { status: 'verified', pin_valid: true };
  }

  async removePin(discordId: string, pin: string): Promise<any> {
    try {
      const user = await this.userModel.findOne({ discordId });

      if (!user) throw new NotFoundException('User not found');
      if (!user.hasAuthPin) throw new ConflictException('User has no pin');
      const isValid = await bcrypt.compare(pin, user.hashedPin);
      if (!isValid) throw new BadRequestException('Invalid PIN');
      const updatedUser = await this.userModel
        .findOneAndUpdate(
          { discordId },
          { $unset: { hashedPin: '' }, hasAuthPin: false },
          { new: true },
        )
        .select('-_2FAData');

      if (!updatedUser) throw new NotFoundException('User not found');

      return {
        status: 'success',
        message: 'Pin removed successfully',
      };
    } catch (error) {
      this.logger.error('Error removing Pin', error);
      throw error;
    }
  }

  async changePin(userId: string, oldPin: string, newPin: string) {
    const user = await this.userModel.findOne({ discordId: userId });

    if (!user || !user.hashedPin)
      throw new NotFoundException('User or PIN not found');

    const isValid = await bcrypt.compare(oldPin, user.hashedPin);
    if (!isValid) throw new BadRequestException('Old PIN is incorrect');

    const newHashedPin = await bcrypt.hash(newPin, this.saltRounds);
    user.hashedPin = newHashedPin;
    user.hasAuthPin = true;
    await user.save();

    return { status: 'success', message: 'pin changed' };
  }

  //generate OTP secret
  async generateOTP(userId: string): Promise<any> {
    try {
      const user = await this.userModel.findOne({ discordId: userId });
      if (!user) throw new NotFoundException('User not found');

      const base32 = generateRandomBase32();

      const otp = new OTPAuth.TOTP({
        label: 'discreet',
        algorithm: 'SHA1',
        digits: 6,
        secret: base32,
      });

      const otpUrl = otp.toString();

      user._2FAData = { url: otpUrl, base32 };
      await user.save();

      return {
        status: 'success',
        message: 'OTP generated successfully',
        otp: { base32, otpUrl },
      };
    } catch (error) {
      this.logger.error('Error finding user by Discord ID', error);
      throw error;
    }
  }

  async verifyOTP(userId: string, token: string): Promise<any> {
    try {
      const user = await this.userModel.findOne({ discordId: userId });
      if (!user) throw new NotFoundException('User not found');

      const otp = new OTPAuth.TOTP({
        label: 'discreet',
        algorithm: 'SHA1',
        digits: 6,
        secret: user._2FAData.base32,
      });

      const delta = otp.validate({ token });
      if (delta === null) {
        return { status: 'fail', message: 'Token is invalid' };
      }

      user._2FAEnabled = true;
      user._2FAVerified = true;
      await user.save();

      //TODO:update the jwt to include 2fa field true

      const { discordId, username, role, displayName, _2FAEnabled } = user;

      return {
        status: 'success',
        message: 'OTP verified successfully',
        user: { discordId, username, role, displayName, _2FAEnabled },
      };
    } catch (error: any) {
      this.logger.error('Error finding user by Discord ID', error);
      throw error;
    }
  }

  async validateOTP(userId: string, token: string): Promise<any> {
    try {
      const user = await this.userModel.findOne({ discordId: userId });
      if (!user) throw new NotFoundException('User not found');
      const otp = new OTPAuth.TOTP({
        label: 'discreet',
        algorithm: 'SHA1',
        digits: 6,
        secret: user._2FAData.base32,
      });
      const delta = otp.validate({ token });
      if (delta === null) {
        return { status: 'fail', message: 'Token is invalid' };
      }

      const { discordId, username, role, displayName, _2FAEnabled } = user;
      return {
        status: 'success',
        message: 'OTP validated successfully',
        otp_valid: true,
        user: { discordId, username, role, displayName, _2FAEnabled },
      };
    } catch (error) {
      this.logger.error('Error finding user by Discord ID', error);
      throw error;
    }
  }

  async disableOTP(userId: string): Promise<any> {
    try {
      const user = await this.userModel.findOne({ discordId: userId });
      if (!user) throw new NotFoundException('User not found');
      user._2FAEnabled = false;
      await user.save();
      //TODO:update the jwt to remove 2fa field true
      const { discordId, username, role, displayName, _2FAEnabled } = user;
      return {
        status: 'success',
        message: 'OTP disabled successfully',
        user: { discordId, username, role, displayName, _2FAEnabled },
      };
    } catch (error) {
      this.logger.error('Error finding user by Discord ID', error);
      throw error;
    }
  }

  async generateBackupCodes(userId: string) {
    const user = await this.userModel.findOne({ discordId: userId });
    if (!user) throw new NotFoundException('User not found');

    const rawCodes: string[] = [];
    const hashedCodes: string[] = [];

    for (let i = 0; i < 10; i++) {
      const code = nanoid(10); // short, unique
      rawCodes.push(code);
      hashedCodes.push(await bcrypt.hash(code, 10));
    }

    user.backupCodes = hashedCodes;
    await user.save();

    return {
      status: 'success',
      message: 'Backup codes generated',
      backupCodes: rawCodes, // Return only ONCE
    };
  }

  async verifyBackupCode(userId: string, inputCode: string) {
    const user = await this.userModel.findOne({ discordId: userId });
    if (!user || !user.backupCodes?.length) {
      throw new NotFoundException('No backup codes found');
    }

    const matchingIndex = await Promise.all(
      user.backupCodes.map(async (hash, idx) => {
        const match = await bcrypt.compare(inputCode, hash);
        return match ? idx : -1;
      }),
    ).then((results) => results.find((index) => index !== -1));

    if (matchingIndex === undefined || matchingIndex === -1) {
      throw new BadRequestException('Invalid backup code');
    }

    // Remove used code
    user.backupCodes.splice(matchingIndex, 1);
    await user.save();

    return {
      status: 'success',
      message: 'Backup code verified, 2FA bypassed',
      remainingCodes: user.backupCodes.length,
    };
  }
}
