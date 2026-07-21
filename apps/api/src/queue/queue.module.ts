import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { ArticleGeneratorProcessor } from './article-generator.processor';

@Module({
  providers: [QueueService, ArticleGeneratorProcessor],
  exports: [QueueService],
})
export class QueueModule {}
