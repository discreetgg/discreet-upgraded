// import { IsString, IsOptional, IsEmail } from 'class-validator';

// export class sendEmailDto {
//   @IsEmail({}, { each: true })
//   recipients: string[];

//   @IsString()
//   subject: string;

//   @IsString()
//   html: string;

//   @IsOptional()
//   @IsString()
//   text?: string;
// }

import { IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendEmailDto {
  @ApiProperty({
    description: 'List of recipient email addresses',
    example: ['user1@example.com', 'user2@example.com'],
    isArray: true,
  })
  @IsEmail({}, { each: true })
  recipients: string[];

  @ApiProperty({
    description: 'Subject of the email',
    example: 'Welcome to our platform',
  })
  @IsString()
  subject: string;

  @ApiProperty({
    description: 'HTML body of the email',
    example: '<h1>Hello!</h1><p>This is a test email.</p>',
  })
  @IsString()
  html?: string;

  @ApiPropertyOptional({
    description: 'Plain text version of the email',
    example: 'Hello! This is a test email.',
  })
  @IsOptional()
  @IsString()
  text?: string;
}
