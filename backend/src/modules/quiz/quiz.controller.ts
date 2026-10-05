import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { QuizService } from './quiz.service';
import { SubmitQuizAnswerDto } from './dto/quiz.dto';
import { Public } from '../../common/decorators/roles.decorator';

@ApiTags('Quiz')
@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Get('questions')
  @Public()
  @ApiOperation({ summary: 'Lấy bộ câu hỏi trắc nghiệm dinh dưỡng (Mục tiêu, Chế độ ăn, Dị ứng)' })
  @ApiResponse({ status: 200, description: 'Danh sách câu hỏi kèm các lựa chọn' })
  getQuestions() {
    return this.quizService.getQuestions();
  }

  @Post('submit')
  @Public()
  @ApiOperation({ summary: 'Gửi kết quả làm bài trắc nghiệm & nhận giỏ hàng gợi ý thực phẩm cá nhân hóa' })
  @ApiResponse({ status: 200, description: 'Danh sách thực phẩm phù hợp nhất với thể trạng' })
  submit(@Body() dto: SubmitQuizAnswerDto, @Req() req?: any) {
    const userId = req?.user?.id;
    return this.quizService.submitAnswers(dto, userId);
  }
}
