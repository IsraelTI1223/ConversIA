import { FactoryProvider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AI_PROVIDER } from './ai-provider.interface';
import { AnthropicProvider } from './anthropic.provider';
import { GeminiProvider } from './gemini.provider';

export const AiProviderFactory: FactoryProvider = {
  provide: AI_PROVIDER,
  useFactory: (config: ConfigService) => {
    const provider = config.get<string>('AI_PROVIDER', 'anthropic');

    switch (provider) {
      case 'gemini':
        return new GeminiProvider(config);
      case 'anthropic':
      default:
        return new AnthropicProvider(config);
    }
  },
  inject: [ConfigService],
};
