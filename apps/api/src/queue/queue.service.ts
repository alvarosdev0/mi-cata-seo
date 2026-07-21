import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

@Injectable()
export class QueueService implements OnModuleDestroy {
  private connection: IORedis;
  private articleQueue: Queue;

  constructor() {
    this.connection = new IORedis({ host: 'localhost', port: 6379, maxRetriesPerRequest: null });
    this.articleQueue = new Queue('article-generation', { connection: this.connection });
  }

  async enqueueArticleGeneration(data: { productId: string; userId: string; keywords?: string[] }) {
    return this.articleQueue.add('generate-article', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });
  }

  getArticleQueue() {
    return this.articleQueue;
  }

  async onModuleDestroy() {
    await this.articleQueue.close();
    await this.connection.quit();
  }
}
