import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticleDto } from './dto/query-article.dto';
import { ArticleResponseDto, PaginatedArticlesDto } from './dto/article-response.dto';
import { generateSlug } from './utils/slug';

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) {}

  private async ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug;
    let counter = 0;
    while (await this.prisma.article.findFirst({
      where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
    })) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }
    return slug;
  }

  async create(userId: string, data: CreateArticleDto) {
    const baseSlug = generateSlug(data.title);
    const slug = await this.ensureUniqueSlug(baseSlug);

    const wordCount = data.content
      ? data.content.trim().split(/\s+/).length
      : 0;

    const article = await this.prisma.article.create({
      data: {
        title: data.title,
        content: data.content,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        slug,
        imageUrl: data.imageUrl,
        keywords: data.keywords || [],
        wordCount,
        productId: data.productId,
        userId,
      },
    });

    return plainToInstance(ArticleResponseDto, article);
  }

  async findAll(userId: string, query?: QueryArticleDto) {
    const take = query?.take || 10;
    const where: Record<string, unknown> = { userId };

    if (query?.search) {
      where.title = { contains: query.search, mode: 'insensitive' };
    }
    if (query?.status) {
      where.status = query.status;
    }
    if (query?.productId) {
      where.productId = query.productId;
    }

    const articles = await this.prisma.article.findMany({
      where,
      take: take + 1,
      ...(query?.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
    });

    const hasMore = articles.length > take;
    if (hasMore) articles.pop();

    return plainToInstance(PaginatedArticlesDto, {
      articles: articles.map((a) => plainToInstance(ArticleResponseDto, a)),
      nextCursor: hasMore ? articles[articles.length - 1].id : null,
      hasMore,
    });
  }

  async findOne(userId: string, id: string) {
    const article = await this.prisma.article.findFirst({ where: { id, userId } });
    return article ? plainToInstance(ArticleResponseDto, article) : null;
  }

  async update(userId: string, id: string, data: UpdateArticleDto) {
    const article = await this.findOne(userId, id);
    if (!article) return null;

    const updateData: Record<string, unknown> = { ...data };

    if (data.title) {
      updateData.slug = await this.ensureUniqueSlug(generateSlug(data.title), id);
    }
    if (data.content !== undefined) {
      updateData.wordCount = data.content
        ? data.content.trim().split(/\s+/).length
        : 0;
    }

    const updated = await this.prisma.article.update({ where: { id }, data: updateData });
    return plainToInstance(ArticleResponseDto, updated);
  }

  async remove(userId: string, id: string) {
    const article = await this.findOne(userId, id);
    if (!article) return null;
    const deleted = await this.prisma.article.delete({ where: { id } });
    return plainToInstance(ArticleResponseDto, deleted);
  }
}
