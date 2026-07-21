import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryProductDto {
  @IsString()
  @IsOptional()
  cursor?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  take?: number;

  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  category?: string;
}
