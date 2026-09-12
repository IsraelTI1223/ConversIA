import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AiProvider, AiMessage, AiOptions } from './ai-provider.interface';

@Injectable()
export class GeminiProvider implements AiProvider {
  private readonly client: GoogleGenerativeAI;
  private readonly model: string;
  private readonly logger = new Logger(GeminiProvider.name);

  constructor(private readonly config: ConfigService) {
    this.client = new GoogleGenerativeAI(
      config.getOrThrow<string>('GEMINI_API_KEY'),
    );
    this.model = config.get<string>(
      'GEMINI_MODEL',
      'gemini-2.0-flash-lite',
    );
  }

  async chat(
    system: string,
    messages: AiMessage[],
    options: AiOptions,
  ): Promise<string> {
    const model = this.client.getGenerativeModel({
      model: this.model,
      systemInstruction: system,
      generationConfig: {
        temperature: options.temperature,
        maxOutputTokens: options.maxTokens,
      },
    });

    const history = messages.slice(0, -1).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const lastMessage = messages[messages.length - 1];

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage.content);
    const text = result.response.text();

    if (!text) throw new Error('Empty Gemini response');
    return text;
  }
}
