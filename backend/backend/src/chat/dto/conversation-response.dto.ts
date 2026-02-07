import { ApiProperty } from '@nestjs/swagger';
import { Message } from 'src/database/schemas/message.schema';

export class ConversationResponseDto {
  @ApiProperty() id: string;
  @ApiProperty({ type: [String] }) participants: string[];
  @ApiProperty({ required: false }) lastMessage: Message;
}
