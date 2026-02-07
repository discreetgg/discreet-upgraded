import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { CallStatus, CallType } from 'src/database/schemas/message.schema';

export class StartCallDto {
  @ApiProperty({
    description: 'DiscordId of the caller',
    example: '1234567890',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  callerId: string;

  @ApiProperty({
    description: 'DiscordId of the callee',
    example: '1234567890',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  calleeId: string;

  @ApiProperty({
    enum: CallType,
    example: CallType.AUDIO,
    description: 'Type of call: audio or video',
  })
  @IsEnum(CallType)
  callType: CallType;

  // @ApiPropertyOptional({
  //   description: 'Conversation ID',
  //   example: '64d2f5bd7c5a1a44a0ef1234',
  //   type: String,
  // })
  // @IsOptional()
  // @IsString()
  // conversationId?: string;
}

export class AcceptCallDto {
  @ApiProperty({
    description: 'call id',
    example: '1234567890',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  callId: string;
}

export class CallSessionDto {
  @ApiProperty({
    description: 'call id',
    example: '1234567890',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  callId: string;

  @ApiProperty({
    description: 'DiscordId of the caller',
    example: '1234567890',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  callerId: string;

  @ApiProperty({
    description: 'DiscordId of the callee',
    example: '1234567890',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  calleeId: string;

  @ApiProperty({
    enum: CallType,
    example: CallType.AUDIO,
    description: 'Type of call: audio or video',
  })
  @IsEnum(CallType)
  callType: CallType;
}

export class EndCallDto {
  @ApiProperty({
    description: 'DiscordId of the caller',
    example: '1234567890',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  callerId: string;

  @ApiProperty({
    description: 'DiscordId of the callee',
    example: '1234567890',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  calleeId: string;

  @ApiProperty({
    description: 'call id',
    example: '1234567890',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  callId: string;

  @ApiProperty({
    enum: CallStatus,
    example: CallStatus.ENDED,
    description: 'status of call : ended | missed | decline',
  })
  @IsEnum(CallStatus)
  callStatus: CallStatus;

  @ApiPropertyOptional({
    example: '60',
    description: 'durations of call in seconds',
  })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @IsOptional()
  duration?: number;
}
