import { Module } from '@nestjs/common';
import { DeepSeekProvider } from './providers/deepseek.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { IAiProvider } from './interfaces/ai-provider.interface';

const AI_PROVIDER_TOKEN = 'AI_PROVIDER';

const aiProviderFactory = {
  provide: AI_PROVIDER_TOKEN,
  useFactory: () => {
    const provider = process.env.AI_PROVIDER || 'deepseek';
    if (provider === 'gemini') return new GeminiProvider();
    return new DeepSeekProvider();
  },
};

@Module({
  providers: [aiProviderFactory],
  exports: [AI_PROVIDER_TOKEN],
})
export class AiModule {
  static readonly providerToken = AI_PROVIDER_TOKEN;
}
