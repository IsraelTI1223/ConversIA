import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class TranslationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  async translate(userId: string, text: string) {
    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount > 500) {
      throw new BadRequestException('Text exceeds 500 word limit');
    }

    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    const result = await this.ai.translateText({
      text,
      cefrLevel: profile?.cefrLevel ?? 'B1',
    });

    await this.prisma.translationLog.create({
      data: {
        userId,
        sourceText: text,
        translatedText: result.translation,
        score: result.score,
        analysis: result,
      },
    });

    return result;
  }
}
