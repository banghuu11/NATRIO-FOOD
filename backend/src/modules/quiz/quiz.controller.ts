import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { QuizService } from './quiz.service';
import { SubmitQuizDto } from './dto/quiz.dto';
import { Public } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Quiz')
@Public()
@Controller('quiz')
export class QuizController {
  constructor(private readonly quiz: QuizService) {}

  @Get()
  @ApiOperation({ summary: 'Bộ câu hỏi tư vấn sản phẩm' })
  questions() {
    return this.quiz.questions();
  }

  @Post('submit')
  @HttpCode(200)
  @ApiOperation({ summary: 'Gửi câu trả lời, nhận gợi ý sản phẩm & combo phù hợp' })
  submit(@Body() dto: SubmitQuizDto, @CurrentUser() user?: CurrentUserPayload) {
    return this.quiz.submit(dto, user?.id);
  }
}
