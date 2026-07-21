import { Injectable, Inject, Logger } from '@nestjs/common';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { IAiProvider } from '../ai/interfaces/ai-provider.interface';
import { AiModule } from '../ai/ai.module';

@Injectable()
export class ArticleGeneratorProcessor {
  private readonly logger = new Logger(ArticleGeneratorProcessor.name);
  private worker: Worker;

  constructor(@Inject(AiModule.providerToken) private aiProvider: IAiProvider) {
    const connection = new IORedis({ host: 'localhost', port: 6379, maxRetriesPerRequest: null });
    this.worker = new Worker(
      'article-generation',
      async (job) => {
        const { productId, userId, keywords, productName, productDescription } = job.data;
        this.logger.log(`Generando articulo para producto ${productId}`);

        const article = await this.aiProvider.generateArticle({
          productName: productName || 'Producto',
          productDescription,
          keywords: keywords || [],
        });

        // TODO: guardar en DB y ejecutar SEO Validator
        this.logger.log(`Articulo generado: "${article.title}"`);
      },
      { connection },
    );

    this.logger.log('Worker article-generation iniciado con IA');
  }
}
