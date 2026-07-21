import { Expose, Type } from 'class-transformer';

export class ProductResponseDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() description?: string;
  @Expose() type?: string;
  @Expose() category?: string;
  @Expose() price: number;
  @Expose() currency: string;
  @Expose() sku?: string;
  @Expose() images: string[];
  @Expose() keywords: string[];
  @Expose() status: string;
  @Expose() createdAt: Date;
  @Expose() updatedAt: Date;
}

export class PaginatedProductsDto {
  @Expose()
  @Type(() => ProductResponseDto)
  products: ProductResponseDto[];

  @Expose()
  nextCursor: string | null;

  @Expose()
  hasMore: boolean;
}
