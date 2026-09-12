import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { AiProvider, AiMessage, AiOptions } from './ai-provider.interface';

@Injectable()
export class AnthropicProvider implements AiProvider {
  private readonly client: Anthropic;
  private readonly model: string;
  private readonly logger = new Logger(AnthropicProvider.name);

  constructor(private readonly config: ConfigService) {
    this.client = new Anthropic({
      apiKey: config.getOrThrow<string>('ANTHROPIC_API_KEY'),
    });
    this.model = config.get<string>('ANTHROPIC_MODEL', 'claude-sonnet-5');
  }

  async chat(
    system: string,
    messages: AiMessage[],
    options: AiOptions,
  ): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      system,
      messages,
    });

    const block = response.content[0];
    if (block.type === 'text') return block.text;
    throw new Error('Unexpected Anthropic response type');
  }
}
