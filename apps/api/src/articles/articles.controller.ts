import { Controller, Get, Post, Put, Delete, Param, Body, Query, NotFoundException } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticleDto } from './dto/query-article.dto';

@Controller('articles')
export class ArticlesController {
  constructor(
    private readonly articlesService: ArticlesService,
    private readonly queueService: QueueService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  create(@Body() body: CreateArticleDto, @Session() session: UserSession) {
    return this.articlesService.create(session.user.id, body);
  }

  @Get()
  findAll(@Query() query: QueryArticleDto, @Session() session: UserSession) {
    return this.articlesService.findAll(session.user.id, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Session() session: UserSession) {
    return this.articlesService.findOne(session.user.id, id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdateArticleDto, @Session() session: UserSession) {
    return this.articlesService.update(session.user.id, id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Session() session: UserSession) {
    return this.articlesService.remove(session.user.id, id);
  }

  @Post('generate/:productId')
  async generate(@Param('productId') productId: string, @Session() session: UserSession) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, userId: session.user.id },
    });
    if (!product) throw new NotFoundException('Producto no encontrado.');

    const job = await this.queueService.enqueueArticleGeneration({
      productId,
      userId: session.user.id,
      keywords: product.keywords,
    });

    return { jobId: job.id, status: 'pending' };
  }
}
