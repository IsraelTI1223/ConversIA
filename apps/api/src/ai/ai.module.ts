import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiProviderFactory } from './providers';

@Module({
  providers: [AiProviderFactory, AiService],
  exports: [AiService],
})
export class AiModule {}
