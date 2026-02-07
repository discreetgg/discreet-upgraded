import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class TopUpDto {
  @ApiProperty({ example: '50.00', description: 'Amount in dollars' })
  @IsString()
  @IsNotEmpty()
  amount: string;

  //   @ApiProperty({
  //     example: 'ref_12345',
  //     required: false,
  //     description: 'Transaction reference',
  //   })
  //   @IsOptional()
  //   @IsString()
  //   reference?: string;
}

export class TransferDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Sender user ID',
  })
  @IsString()
  @IsNotEmpty()
  senderId: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439022',
    description: 'Receiver user ID',
  })
  @IsString()
  @IsNotEmpty()
  receiverId: string;

  @ApiProperty({ example: '25.50', description: 'Amount in dollars' })
  @IsString()
  @IsNotEmpty()
  amount: string;
}

// export class PayDto {
//   @ApiProperty({
//     example: '507f1f77bcf86cd799439011',
//     description: 'Payer user ID',
//   })
//   @IsString()
//   @IsNotEmpty()
//   payerId: string;

//   @ApiProperty({
//     example: '507f1f77bcf86cd799439022',
//     description: 'Merchant user ID',
//   })
//   @IsString()
//   @IsNotEmpty()
//   merchantId: string;

//   @ApiProperty({ example: '99.99', description: 'Amount in dollars' })
//   @IsString()
//   @IsNotEmpty()
//   amount: string;

//   @ApiProperty({
//     example: 'Order #12345',
//     required: false,
//     description: 'Payment description',
//   })
//   @IsOptional()
//   @IsString()
//   description?: string;
// }
