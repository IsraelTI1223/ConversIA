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
const WS_RATE_LIMIT_MAX = 5;

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

    if (this.isRateLimited(userId)) {
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

  private isRateLimited(userId: string): boolean {
    const now = Date.now();
    const timestamps = this.messageTimestamps.get(userId) ?? [];
    const recent = timestamps.filter((t) => now - t < WS_RATE_LIMIT_WINDOW_MS);

    if (recent.length >= WS_RATE_LIMIT_MAX) {
      this.logger.warn(`Rate limit exceeded for user ${userId}`);
      return true;
    }

    recent.push(now);
    this.messageTimestamps.set(userId, recent);
    return false;
  }
}
