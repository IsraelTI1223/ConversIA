import { Injectable, NotFoundException } from '@nestjs/common';
import { CefrLevel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const { passwordHash, ...safe } = user;
    return safe;
  }

  async getStats(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Profile not found');

    const vocabCount = await this.prisma.userVocabulary.count({
      where: { userId },
    });
    const sessionsCount = await this.prisma.chatSession.count({
      where: { userId, status: 'COMPLETED' },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayExercises = await this.prisma.practiceExercise.aggregate({
      _sum: { score: true },
      where: {
        session: { userId },
        answeredAt: { gte: todayStart },
      },
    });

    const todayTranslations = await this.prisma.translationLog.aggregate({
      _sum: { score: true },
      where: {
        userId,
        createdAt: { gte: todayStart },
      },
    });

    const dailyPoints =
      (todayExercises._sum.score ?? 0) + (todayTranslations._sum.score ?? 0);

    return {
      cefrLevel: profile.cefrLevel,
      totalPoints: profile.totalPoints,
      dailyPoints,
      streakDays: profile.streakDays,
      vocabularyCount: vocabCount,
      completedSessions: sessionsCount,
      skills: {
        writing: profile.writingScore,
        speaking: profile.speakingScore,
        reading: profile.readingScore,
        listening: profile.listeningScore,
      },
    };
  }

  async updateProfile(userId: string, data: { cefrLevel?: CefrLevel }) {
    return this.prisma.userProfile.update({
      where: { userId },
      data,
    });
  }
}
