import { Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { ProductResponseDto, PaginatedProductsDto } from './dto/product-response.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: CreateProductDto) {
    const product = await this.prisma.product.create({
      data: { ...data, userId },
    });
    return plainToInstance(ProductResponseDto, product);
  }

  async findAll(userId: string, query?: QueryProductDto) {
    const take = query?.take || 10;
    const where: Record<string, unknown> = { userId };

    if (query?.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }
    if (query?.category) {
      where.category = query.category;
    }

    const products = await this.prisma.product.findMany({
      where,
      take: take + 1,
      ...(query?.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
    });

    const hasMore = products.length > take;
    if (hasMore) products.pop();

    return plainToInstance(PaginatedProductsDto, {
      products: products.map((p) => plainToInstance(ProductResponseDto, p)),
      nextCursor: hasMore ? products[products.length - 1].id : null,
      hasMore,
    });
  }

  async findOne(userId: string, id: string) {
    const product = await this.prisma.product.findFirst({ where: { id, userId } });
    if (!product) throw new NotFoundException('Producto no encontrado.');
    return plainToInstance(ProductResponseDto, product);
  }

  async update(userId: string, id: string, data: UpdateProductDto) {
    await this.findOne(userId, id);
    const updated = await this.prisma.product.update({ where: { id }, data });
    return plainToInstance(ProductResponseDto, updated);
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    const deleted = await this.prisma.product.delete({ where: { id } });
    return plainToInstance(ProductResponseDto, deleted);
  }
}
