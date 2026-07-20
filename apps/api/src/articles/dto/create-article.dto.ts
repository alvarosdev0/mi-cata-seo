import { IsString, IsOptional, IsArray, IsNumber, MinLength } from 'class-validator';

export class CreateArticleDto {
  @IsString()
  productId: string;

  @IsString()
  @MinLength(5)
  title: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  metaTitle?: string;

  @IsString()
  @IsOptional()
  metaDescription?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];
}
