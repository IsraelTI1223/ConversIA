import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { TranslationService } from './translation.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TranslateTextDto } from './dto/translate-text.dto';

@Controller('translation')
@UseGuards(JwtAuthGuard)
export class TranslationController {
  constructor(private readonly translation: TranslationService) {}

  @Post()
  translate(@Request() req: any, @Body() dto: TranslateTextDto) {
    return this.translation.translate(req.user.id, dto.text);
  }
}
