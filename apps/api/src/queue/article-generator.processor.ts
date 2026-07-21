import { Injectable, Logger } from '@nestjs/common';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';

@Injectable()
export class ArticleGeneratorProcessor {
  private readonly logger = new Logger(ArticleGeneratorProcessor.name);
  private worker: Worker;

  constructor() {
    const connection = new IORedis({ host: 'localhost', port: 6379, maxRetriesPerRequest: null });
    this.worker = new Worker(
      'article-generation',
      async (job) => {
        const { productId, userId } = job.data;
        this.logger.log(`Procesando job ${job.id}: producto=${productId}`);

        // TODO: CATA-4 — IAiProvider.generateArticle()
        // TODO: CATA-5 — SEO Validator
        await new Promise((resolve) => setTimeout(resolve, 1000));

        this.logger.log(`Job ${job.id} completado`);
      },
      { connection },
    );

    this.logger.log('Worker article-generation iniciado');
  }
}
