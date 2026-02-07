import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
// import { PlanType } from 'src/database/schemas/subscription-plan.schema';

export class CreateSubscriptionPlanDto {
  @ApiProperty({
    description: 'Name of the subscription plan',
    example: 'Premium Plan',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Amount/price of the subscription plan',
    example: '9.99',
  })
  @IsString()
  @IsNotEmpty()
  amount: string;

  @ApiPropertyOptional({
    description: 'Description of the subscription plan',
    example: 'Monthly premium subscription with full access',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Icon identifier for the subscription plan',
    example: 'premium',
  })
  @IsString()
  @IsOptional()
  icon?: string;

  // @ApiProperty({
  //   description: 'Type of the subscription plan',
  //   enum: PlanType,
  //   example: PlanType.ONETIME,
  // })
  // @IsEnum(PlanType)
  // type: PlanType;
}

export class UpdateSubscriptionPlanDto extends PartialType(
  CreateSubscriptionPlanDto,
) {}
