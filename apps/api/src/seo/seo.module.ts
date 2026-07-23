import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { SeoService } from './seo.service';

@Module({
  imports: [AiModule],
  providers: [SeoService],
  exports: [SeoService],
})
export class SeoModule {}
