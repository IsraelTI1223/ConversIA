import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(userId: string, dto: CreateSessionDto) {
    return this.prisma.chatSession.create({
      data: {
        userId,
        cefrLevel: dto.cefrLevel,
        topic: dto.topic,
        durationMinutes: dto.durationMinutes ?? 15,
      },
    });
  }

  async getSession(userId: string, sessionId: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new ForbiddenException();
    return session;
  }

  async endSession(userId: string, sessionId: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new ForbiddenException();

    return this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { status: 'COMPLETED', endedAt: new Date() },
    });
  }

  async saveMessage(
    sessionId: string,
    data: {
      role: 'USER' | 'ASSISTANT';
      contentEn: string;
      contentEs: string;
      correctionEn?: string;
      isCorrect?: boolean;
    },
  ) {
    return this.prisma.chatMessage.create({
      data: { sessionId, ...data },
    });
  }

  async saveVocabulary(
    sessionId: string,
    userId: string,
    words: Array<{
      wordEn: string;
      wordEs: string;
      phonetic?: string;
      exampleEn?: string;
      exampleEs?: string;
      partOfSpeech?: string;
    }>,
  ) {
    for (const word of words) {
      await this.prisma.sessionVocabulary.create({
        data: { sessionId, ...word },
      });

      await this.prisma.userVocabulary.upsert({
        where: { userId_wordEn: { userId, wordEn: word.wordEn } },
        create: { userId, wordEn: word.wordEn, wordEs: word.wordEs, phonetic: word.phonetic },
        update: {},
      });
    }
  }

  async getSessionVocabulary(userId: string, sessionId: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.userId !== userId) throw new NotFoundException();

    return this.prisma.sessionVocabulary.findMany({
      where: { sessionId },
    });
  }

  async getUserSessions(userId: string) {
    return this.prisma.chatSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: 20,
    });
  }
}
