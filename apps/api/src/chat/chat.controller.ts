import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateSessionDto } from './dto/create-session.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post('sessions')
  createSession(@Request() req: any, @Body() dto: CreateSessionDto) {
    return this.chat.createSession(req.user.id, dto);
  }

  @Get('sessions')
  listSessions(@Request() req: any) {
    return this.chat.getUserSessions(req.user.id);
  }

  @Get('sessions/:id')
  getSession(@Request() req: any, @Param('id') id: string) {
    return this.chat.getSession(req.user.id, id);
  }

  @Patch('sessions/:id/end')
  endSession(@Request() req: any, @Param('id') id: string) {
    return this.chat.endSession(req.user.id, id);
  }

  @Get('sessions/:id/vocabulary')
  getVocabulary(@Request() req: any, @Param('id') id: string) {
    return this.chat.getSessionVocabulary(req.user.id, id);
  }
}
