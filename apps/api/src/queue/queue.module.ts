import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { SeoModule } from '../seo/seo.module';
import { QueueService } from './queue.service';
import { ArticleGeneratorProcessor } from './article-generator.processor';

@Module({
  imports: [AiModule, SeoModule],
  providers: [QueueService, ArticleGeneratorProcessor],
  exports: [QueueService],
})
export class QueueModule {}
