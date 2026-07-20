import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticleDto } from './dto/query-article.dto';
import { generateSlug } from './utils/slug';

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: CreateArticleDto) {
    const slug = generateSlug(data.title);

    const wordCount = data.content
      ? data.content.trim().split(/\s+/).length
      : 0;

    return this.prisma.article.create({
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
  }

  async findAll(userId: string, query?: QueryArticleDto) {
    const page = query?.page || 1;
    const limit = 10;
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

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.article.count({ where }),
    ]);

    return { articles, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findOne(userId: string, id: string) {
    return this.prisma.article.findFirst({ where: { id, userId } });
  }

  async update(userId: string, id: string, data: UpdateArticleDto) {
    const article = await this.findOne(userId, id);
    if (!article) return null;

    const updateData: Record<string, unknown> = { ...data };

    if (data.title) {
      updateData.slug = generateSlug(data.title);
    }
    if (data.content !== undefined) {
      updateData.wordCount = data.content
        ? data.content.trim().split(/\s+/).length
        : 0;
    }

    return this.prisma.article.update({ where: { id }, data: updateData });
  }

  async remove(userId: string, id: string) {
    const article = await this.findOne(userId, id);
    if (!article) return null;
    return this.prisma.article.delete({ where: { id } });
  }
}
