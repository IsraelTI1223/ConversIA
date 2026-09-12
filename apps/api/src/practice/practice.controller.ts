import { Controller, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PracticeService } from './practice.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreatePracticeSessionDto } from './dto/create-practice-session.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

@Controller('practice')
@UseGuards(JwtAuthGuard)
export class PracticeController {
  constructor(private readonly practice: PracticeService) {}

  @Post('sessions')
  createSession(
    @Request() req: any,
    @Body() dto: CreatePracticeSessionDto,
  ) {
    return this.practice.createSession(req.user.id, dto.skillType, dto.cefrLevel);
  }

  @Post('exercises/:id/submit')
  submitAnswer(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: SubmitAnswerDto,
  ) {
    return this.practice.submitAnswer(req.user.id, id, dto.answer);
  }
}
