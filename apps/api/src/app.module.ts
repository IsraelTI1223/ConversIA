import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ChatModule } from './chat/chat.module';
import { PracticeModule } from './practice/practice.module';
import { TranslationModule } from './translation/translation.module';
import { AiModule } from './ai/ai.module';
import { AppController } from './app.controller';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: 'general', ttl: 60_000, limit: 60 },
      { name: 'ai', ttl: 60_000, limit: 10 },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    ChatModule,
    PracticeModule,
    TranslationModule,
    AiModule,
  ],
})
export class AppModule {}
