import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: CreateProductDto) {
    return this.prisma.product.create({
      data: { ...data, userId },
    });
  }

  async findAll(userId: string, query?: QueryProductDto) {
    const page = query?.page || 1;
    const limit = 10;
    const where: Record<string, unknown> = { userId };

    if (query?.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }
    if (query?.category) {
      where.category = query.category;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { products, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findOne(userId: string, id: string) {
    return this.prisma.product.findFirst({ where: { id, userId } });
  }

  async update(userId: string, id: string, data: UpdateProductDto) {
    const product = await this.findOne(userId, id);
    if (!product) return null;
    return this.prisma.product.update({ where: { id }, data });
  }

  async remove(userId: string, id: string) {
    const product = await this.findOne(userId, id);
    if (!product) return null;
    return this.prisma.product.delete({ where: { id } });
  }
}
