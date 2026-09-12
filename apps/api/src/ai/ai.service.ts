import {
  Inject,
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AI_PROVIDER, AiProvider } from './providers';
import { buildChatPrompt } from './prompts/chat.prompt';
import { buildPracticePrompt } from './prompts/practice.prompt';
import { buildTranslationPrompt } from './prompts/translation.prompt';

export interface ChatResponse {
  contentEn: string;
  contentEs: string;
  correctionEn?: string;
  isCorrect: boolean;
  vocabulary: Array<{
    wordEn: string;
    wordEs: string;
    phonetic?: string;
    exampleEn?: string;
    exampleEs?: string;
    partOfSpeech?: string;
  }>;
}

const MAX_USER_MESSAGE_LENGTH = 2000;
const MAX_TRANSLATION_LENGTH = 5000;

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)/i,
  /disregard\s+(all\s+)?(previous|prior|above)/i,
  /you\s+are\s+now\s+(a|an|the)\s+/i,
  /new\s+instructions?\s*:/i,
  /system\s*:\s*/i,
  /\bact\s+as\b/i,
  /\bpretend\s+(to\s+be|you\s+are)\b/i,
  /\bdo\s+not\s+follow\b.*\binstructions\b/i,
  /\boverride\b.*\b(rules|instructions|prompt)\b/i,
  /\bforget\b.*\b(rules|instructions|everything)\b/i,
  /\bjailbreak\b/i,
  /\bDAN\b/,
  /\b(reveal|show|output|print)\s+(your|the)\s+(system\s+)?prompt\b/i,
];

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly maxRetries: number;

  constructor(
    @Inject(AI_PROVIDER) private readonly provider: AiProvider,
    private readonly config: ConfigService,
  ) {
    this.maxRetries = config.get<number>('ANTHROPIC_MAX_RETRIES', 2);
  }

  async processMessage(params: {
    userMessage: string;
    language: 'en' | 'es';
    cefrLevel: string;
    topic: string;
    history: Array<{ role: string; contentEn: string; contentEs: string }>;
  }): Promise<ChatResponse> {
    const sanitized = this.sanitizeInput(params.userMessage, MAX_USER_MESSAGE_LENGTH);

    const systemPrompt = buildChatPrompt(params.cefrLevel, params.topic);

    const messages = params.history.map((msg) => ({
      role: msg.role.toLowerCase() as 'user' | 'assistant',
      content: msg.contentEn || msg.contentEs,
    }));

    messages.push({ role: 'user', content: sanitized });

    const response = await this.callWithRetry(
      () =>
        this.provider.chat(systemPrompt, messages, {
          temperature: 0.8,
          maxTokens: 1024,
        }),
      'processMessage',
    );

    return this.parseAiResponse<ChatResponse>(response, 'processMessage');
  }

  async generateExercise(params: {
    skillType: string;
    cefrLevel: string;
    vocabulary: string[];
  }): Promise<any> {
    const systemPrompt = buildPracticePrompt(
      params.skillType,
      params.cefrLevel,
    );

    const vocabList = params.vocabulary
      .slice(0, 20)
      .map((w) => w.slice(0, 50))
      .join(', ');

    const response = await this.callWithRetry(
      () =>
        this.provider.chat(
          systemPrompt,
          [
            {
              role: 'user',
              content: `Generate an exercise using these vocabulary words: ${vocabList}`,
            },
          ],
          { temperature: 0.6, maxTokens: 2048 },
        ),
      'generateExercise',
    );

    return this.parseAiResponse(response, 'generateExercise');
  }

  async evaluateExercise(params: {
    skillType: string;
    cefrLevel: string;
    exercise: any;
    userAnswer: string;
  }): Promise<any> {
    const sanitized = this.sanitizeInput(params.userAnswer, MAX_USER_MESSAGE_LENGTH);

    const systemPrompt = buildPracticePrompt(
      params.skillType,
      params.cefrLevel,
    );

    const response = await this.callWithRetry(
      () =>
        this.provider.chat(
          systemPrompt,
          [
            {
              role: 'user',
              content: JSON.stringify({
                action: 'evaluate',
                exercise: params.exercise,
                userAnswer: sanitized,
              }),
            },
          ],
          { temperature: 0.3, maxTokens: 512 },
        ),
      'evaluateExercise',
    );

    return this.parseAiResponse(response, 'evaluateExercise');
  }

  async translateText(params: {
    text: string;
    cefrLevel: string;
  }): Promise<any> {
    const sanitized = this.sanitizeInput(params.text, MAX_TRANSLATION_LENGTH);

    const systemPrompt = buildTranslationPrompt(params.cefrLevel);

    const response = await this.callWithRetry(
      () =>
        this.provider.chat(
          systemPrompt,
          [{ role: 'user', content: sanitized }],
          { temperature: 0.3, maxTokens: 2048 },
        ),
      'translateText',
    );

    return this.parseAiResponse(response, 'translateText');
  }

  private sanitizeInput(input: string, maxLength: number): string {
    if (!input || typeof input !== 'string') {
      throw new BadRequestException('Message content is required');
    }

    const trimmed = input.trim();

    if (trimmed.length === 0) {
      throw new BadRequestException('Message cannot be empty');
    }

    if (trimmed.length > maxLength) {
      throw new BadRequestException(
        `Message exceeds maximum length of ${maxLength} characters`,
      );
    }

    for (const pattern of PROMPT_INJECTION_PATTERNS) {
      if (pattern.test(trimmed)) {
        this.logger.warn(
          `Prompt injection attempt detected: "${trimmed.substring(0, 100)}"`,
        );
        throw new BadRequestException(
          'Message contains disallowed content. Please rephrase your message.',
        );
      }
    }

    return trimmed;
  }

  private parseAiResponse<T>(response: string, context: string): T {
    let text = response.trim();

    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      text = fenceMatch[1].trim();
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      this.logger.error(
        `Invalid AI JSON response [${context}]: ${text.substring(0, 200)}`,
      );
      throw new InternalServerErrorException(
        'The AI returned an invalid response. Please try again.',
      );
    }
  }

  private async callWithRetry(
    fn: () => Promise<string>,
    context: string,
  ): Promise<string> {
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === this.maxRetries) {
          this.logger.error(
            `AI call failed after ${this.maxRetries + 1} attempts [${context}]`,
            error,
          );
          throw error;
        }
        this.logger.warn(
          `AI call attempt ${attempt + 1} failed [${context}], retrying...`,
        );
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
    throw new Error('Unreachable');
  }
}
