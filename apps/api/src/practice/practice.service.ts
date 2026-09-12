import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class PracticeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  async createSession(userId: string, skillType: string, cefrLevel: string) {
    const vocab = await this.prisma.userVocabulary.findMany({
      where: { userId, mastery: { lt: 80 } },
      orderBy: [{ mastery: 'asc' }, { lastPracticed: 'asc' }],
      take: 5,
    });

    const session = await this.prisma.practiceSession.create({
      data: { userId, skillType: skillType as any, cefrLevel: cefrLevel as any },
    });

    const exercise = await this.ai.generateExercise({
      skillType,
      cefrLevel,
      vocabulary: vocab.map((v) => v.wordEn),
    });

    const saved = await this.prisma.practiceExercise.create({
      data: {
        sessionId: session.id,
        exerciseType: exercise.type,
        prompt: JSON.stringify(exercise),
      },
    });

    return { session, exercise: { id: saved.id, ...exercise } };
  }

  async submitAnswer(userId: string, exerciseId: string, userAnswer: string) {
    const exercise = await this.prisma.practiceExercise.findUnique({
      where: { id: exerciseId },
      include: { session: true },
    });
    if (!exercise || exercise.session.userId !== userId) {
      throw new NotFoundException();
    }

    const result = await this.ai.evaluateExercise({
      skillType: exercise.session.skillType,
      cefrLevel: exercise.session.cefrLevel,
      exercise: JSON.parse(exercise.prompt),
      userAnswer,
    });

    await this.prisma.practiceExercise.update({
      where: { id: exerciseId },
      data: {
        userAnswer,
        score: result.score,
        feedbackEn: result.feedbackEn,
        feedbackEs: result.feedbackEs,
        answeredAt: new Date(),
      },
    });

    await this.updatePoints(userId, exercise.session.skillType, result.score);

    return result;
  }

  private async updatePoints(userId: string, skillType: string, score: number) {
    const field = `${skillType.toLowerCase()}Score` as any;
    await this.prisma.userProfile.update({
      where: { userId },
      data: {
        totalPoints: { increment: score },
        [field]: { increment: Math.round(score / 10) },
      },
    });
  }
}
