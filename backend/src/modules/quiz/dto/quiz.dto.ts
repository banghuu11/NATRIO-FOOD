import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';

export class SubmitQuizAnswerDto {
  @ApiPropertyOptional({ example: 'quiz-session-uuid', description: 'Session token nếu đã có phiên trước' })
  @IsOptional()
  @IsString()
  sessionToken?: string;

  @ApiProperty({ example: [1, 4, 7], description: 'Danh sách ID các lựa chọn (option_id) đã chọn' })
  @IsArray()
  optionIds: number[];
}
