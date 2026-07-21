import { Expose, Type } from 'class-transformer';

export class ArticleResponseDto {
  @Expose() id: string;
  @Expose() productId: string;
  @Expose() title: string;
  @Expose() content?: string;
  @Expose() metaTitle?: string;
  @Expose() metaDescription?: string;
  @Expose() slug: string;
  @Expose() status: string;
  @Expose() wordCount?: number;
  @Expose() keywords: string[];
  @Expose() seoScore?: number;
  @Expose() imageUrl?: string;
  @Expose() publishedAt?: Date;
  @Expose() createdAt: Date;
  @Expose() updatedAt: Date;
}

export class PaginatedArticlesDto {
  @Expose()
  @Type(() => ArticleResponseDto)
  articles: ArticleResponseDto[];

  @Expose()
  nextCursor: string | null;

  @Expose()
  hasMore: boolean;
}
