import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { Race } from 'src/database/schemas/user.schema';

// export class SetRaceDto {
//   @IsNotEmpty()
//   @IsEnum(Race)
//   race: Race;
// }

export class SetRaceDto {
  @ApiProperty({
    description: 'Select race',
    enum: Race,
    enumName: 'Race',
  })
  @IsNotEmpty()
  @IsEnum(Race)
  race: Race;
}
