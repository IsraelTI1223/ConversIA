import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { ChatService } from './chat.service';
import { AiService } from '../ai/ai.service';

const WS_RATE_LIMIT_WINDOW_MS = 60_000;
const WS_RATE_LIMIT_MAX_TEXT = 5;
const WS_RATE_LIMIT_MAX_VOICE = 30;

interface VoiceTimer {
  timeout: ReturnType<typeof setTimeout>;
  expiresAt: number;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly messageTimestamps = new Map<string, number[]>();
  private readonly voiceTimers = new Map<string, VoiceTimer>();

  constructor(
    private readonly chat: ChatService,
    private readonly ai: AiService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  handleConnection(client: Socket) {
    const token =
      client.handshake.auth?.token ||
      client.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      this.logger.warn(`Connection rejected: no token provided`);
      client.emit('error', { message: 'Authentication required' });
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      client.data.userId = payload.sub;
      this.logger.log(`User ${payload.sub} connected`);
    } catch {
      this.logger.warn(`Connection rejected: invalid token`);
      client.emit('error', { message: 'Invalid or expired token' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.userId) {
      this.messageTimestamps.delete(client.data.userId);
      this.clearVoiceTimer(client.data.userId);
      this.logger.log(`User ${client.data.userId} disconnected`);
    }
  }

  @SubscribeMessage('join_session')
  async handleJoinSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    client.join(data.sessionId);
    client.emit('session_joined', { sessionId: data.sessionId });
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      sessionId: string;
      content: string;
      language: 'en' | 'es';
    },
  ) {
    const userId = client.data.userId;

    if (!userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    if (this.isRateLimited(userId, WS_RATE_LIMIT_MAX_TEXT)) {
      client.emit('error', {
        message: 'Too many messages. Please wait a moment before sending another.',
      });
      return;
    }

    client.emit('typing_start');

    try {
      const session = await this.chat.getSession(userId, data.sessionId);

      await this.chat.saveMessage(data.sessionId, {
        role: 'USER',
        contentEn: data.language === 'en' ? data.content : '',
        contentEs: data.language === 'es' ? data.content : '',
      });

      const aiResponse = await this.ai.processMessage({
        userMessage: data.content,
        language: data.language,
        cefrLevel: session.cefrLevel,
        topic: session.topic,
        history: session.messages.slice(-10),
      });

      await this.chat.saveMessage(data.sessionId, {
        role: 'ASSISTANT',
        contentEn: aiResponse.contentEn,
        contentEs: aiResponse.contentEs,
        correctionEn: aiResponse.correctionEn,
        isCorrect: aiResponse.isCorrect,
      });

      if (aiResponse.vocabulary?.length) {
        await this.chat.saveVocabulary(
          data.sessionId,
          userId,
          aiResponse.vocabulary,
        );
      }

      client.emit('typing_stop');
      client.emit('new_message', aiResponse);
    } catch (error) {
      client.emit('typing_stop');
      client.emit('error', { message: 'Failed to process message' });
    }
  }

  @SubscribeMessage('voice_start_session')
  async handleVoiceStartSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) {
      client.emit('voice_error', { message: 'Not authenticated', code: 'AUTH' });
      return;
    }

    try {
      const session = await this.chat.getSession(userId, data.sessionId);

      if (session.mode !== 'VOICE') {
        client.emit('voice_error', { message: 'Not a voice session', code: 'INVALID_MODE' });
        return;
      }

      const durationMs = session.durationMinutes * 60_000;
      const expiresAt = Date.now() + durationMs;

      this.clearVoiceTimer(userId);

      const timeout = setTimeout(() => {
        this.handleVoiceExpired(client, data.sessionId, userId);
      }, durationMs);

      this.voiceTimers.set(userId, { timeout, expiresAt });

      client.emit('voice_turn_ready', { expiresAt });
      this.logger.log(`Voice session started for user ${userId}, ${session.durationMinutes}min`);
    } catch (error) {
      client.emit('voice_error', { message: 'Failed to start voice session', code: 'SERVER' });
    }
  }

  @SubscribeMessage('voice_message')
  async handleVoiceMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; transcript: string },
  ) {
    const userId = client.data.userId;

    if (!userId) {
      client.emit('voice_error', { message: 'Not authenticated', code: 'AUTH' });
      return;
    }

    const timer = this.voiceTimers.get(userId);
    if (!timer || Date.now() >= timer.expiresAt) {
      client.emit('voice_error', { message: 'Voice session expired', code: 'EXPIRED' });
      return;
    }

    if (this.isRateLimited(userId, WS_RATE_LIMIT_MAX_VOICE)) {
      client.emit('voice_error', { message: 'Too many messages', code: 'RATE_LIMIT' });
      return;
    }

    try {
      const session = await this.chat.getSession(userId, data.sessionId);

      await this.chat.saveMessage(data.sessionId, {
        role: 'USER',
        contentEn: data.transcript,
        contentEs: '',
      });

      let fullResponse = '';
      let chunkIndex = 0;

      for await (const chunk of this.ai.processVoiceMessage({
        userMessage: data.transcript,
        cefrLevel: session.cefrLevel,
        topic: session.topic,
        history: session.messages.slice(-10),
      })) {
        fullResponse += chunk;
        client.emit('voice_chunk', { text: chunk, index: chunkIndex++ });
      }

      const metadata = await this.ai.extractVoiceMetadata({
        userMessage: data.transcript,
        aiResponse: fullResponse,
        cefrLevel: session.cefrLevel,
      });

      await this.chat.saveMessage(data.sessionId, {
        role: 'ASSISTANT',
        contentEn: fullResponse,
        contentEs: '',
        correctionEn: metadata.correctionEn ?? undefined,
        isCorrect: metadata.isCorrect,
      });

      if (metadata.vocabulary?.length) {
        await this.chat.saveVocabulary(data.sessionId, userId, metadata.vocabulary);
      }

      client.emit('voice_chunk_end', { fullText: fullResponse, metadata });
      client.emit('voice_turn_ready', { expiresAt: timer.expiresAt });
    } catch (error) {
      this.logger.error(`Voice message error for user ${userId}`, error);
      client.emit('voice_error', { message: 'Failed to process voice message', code: 'SERVER' });
      client.emit('voice_turn_ready', { expiresAt: timer?.expiresAt });
    }
  }

  @SubscribeMessage('voice_end_session')
  async handleVoiceEndSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    this.clearVoiceTimer(userId);

    try {
      const session = await this.chat.getSession(userId, data.sessionId);
      await this.chat.endSession(userId, data.sessionId);

      const vocabulary = await this.chat.getSessionVocabulary(userId, data.sessionId);
      const corrections = session.messages
        .filter((m) => m.role === 'USER' && m.isCorrect === false)
        .map((m) => ({ original: m.contentEn, correction: m.correctionEn }));

      client.emit('voice_session_expired', {
        summary: {
          totalTurns: session.messages.filter((m) => m.role === 'USER').length,
          corrections,
          vocabulary,
        },
      });
    } catch (error) {
      this.logger.error(`Voice end session error for user ${userId}`, error);
      client.emit('voice_error', { message: 'Failed to end session', code: 'SERVER' });
    }
  }

  private async handleVoiceExpired(client: Socket, sessionId: string, userId: string) {
    this.clearVoiceTimer(userId);

    try {
      const session = await this.chat.getSession(userId, sessionId);
      await this.chat.endSession(userId, sessionId);

      const vocabulary = await this.chat.getSessionVocabulary(userId, sessionId);
      const corrections = session.messages
        .filter((m) => m.role === 'USER' && m.isCorrect === false)
        .map((m) => ({ original: m.contentEn, correction: m.correctionEn }));

      client.emit('voice_session_expired', {
        summary: {
          totalTurns: session.messages.filter((m) => m.role === 'USER').length,
          corrections,
          vocabulary,
        },
      });
    } catch (error) {
      this.logger.error(`Voice expiry handler error for user ${userId}`, error);
    }
  }

  private clearVoiceTimer(userId: string) {
    const timer = this.voiceTimers.get(userId);
    if (timer) {
      clearTimeout(timer.timeout);
      this.voiceTimers.delete(userId);
    }
  }

  private isRateLimited(userId: string, max: number): boolean {
    const now = Date.now();
    const timestamps = this.messageTimestamps.get(userId) ?? [];
    const recent = timestamps.filter((t) => now - t < WS_RATE_LIMIT_WINDOW_MS);

    if (recent.length >= max) {
      this.logger.warn(`Rate limit exceeded for user ${userId}`);
      return true;
    }

    recent.push(now);
    this.messageTimestamps.set(userId, recent);
    return false;
  }
}
