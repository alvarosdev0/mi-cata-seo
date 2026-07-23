import { Injectable, Inject, Logger } from '@nestjs/common';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { IAiProvider } from '../ai/interfaces/ai-provider.interface';
import { AiModule } from '../ai/ai.module';
import { PrismaService } from '../prisma/prisma.service';
import { SeoService } from '../seo/seo.service';
import { generateSlug } from '../articles/utils/slug';

@Injectable()
export class ArticleGeneratorProcessor {
  private readonly logger = new Logger(ArticleGeneratorProcessor.name);
  private worker: Worker;

  constructor(
    @Inject(AiModule.providerToken) private aiProvider: IAiProvider,
    private prisma: PrismaService,
    private seo: SeoService,
  ) {
    const connection = new IORedis({ host: 'localhost', port: 6379, maxRetriesPerRequest: null });
    this.worker = new Worker(
      'article-generation',
      async (job) => {
        const { productId, userId, keywords } = job.data;
        this.logger.log(`[Intento ${(job.attemptsMade || 0) + 1}/3] Generando articulo para producto ${productId}`);

        const product = await this.prisma.product.findFirst({ where: { id: productId } });
        if (!product) throw new Error(`Producto ${productId} no encontrado`);

        const generated = await this.aiProvider.generateArticle({
          productName: product.name,
          productDescription: product.description || undefined,
          keywords: keywords || product.keywords,
        });

        const seoResult = this.seo.validateArticle({
          title: generated.title,
          content: generated.content,
          metaTitle: generated.metaTitle,
          metaDescription: generated.metaDescription,
          keywords: generated.keywords,
          hasSchemaJsonLd: true,
        });

        const factCheck = await this.aiProvider.verifyClaims(generated.content);

        const slug = generateSlug(generated.title);
        const wordCount = generated.content.trim().split(/\s+/).length;

        const article = await this.prisma.article.create({
          data: {
            productId,
            userId,
            title: generated.title,
            content: generated.content,
            metaTitle: generated.metaTitle,
            metaDescription: generated.metaDescription,
            slug,
            wordCount,
            keywords: generated.keywords,
            seoScore: seoResult.score,
            status: seoResult.passed ? 'draft' : 'needs_review',
          },
        });

        this.logger.log(`Articulo ${article.id} creado. Score SEO: ${seoResult.score}, Fact-check issues: ${factCheck.hasIssues}`);
      },
      { connection },
    );

    this.logger.log('Worker article-generation iniciado');
  }
}
