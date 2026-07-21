import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { QueueService } from './queue.service';
import { ArticleGeneratorProcessor } from './article-generator.processor';

@Module({
  imports: [AiModule],
  providers: [QueueService, ArticleGeneratorProcessor],
  exports: [QueueService],
})
export class QueueModule {}
