import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() body: CreateProductDto, @Session() session: UserSession) {
    return this.productsService.create(session.user.id, body);
  }

  @Get()
  findAll(@Query() query: QueryProductDto, @Session() session: UserSession) {
    return this.productsService.findAll(session.user.id, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Session() session: UserSession) {
    return this.productsService.findOne(session.user.id, id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdateProductDto, @Session() session: UserSession) {
    return this.productsService.update(session.user.id, id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Session() session: UserSession) {
    return this.productsService.remove(session.user.id, id);
  }
}
