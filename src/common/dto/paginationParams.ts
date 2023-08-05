import 'reflect-metadata';

import { IsNumber, IsOptional, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class PaginationParams extends Object {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @IsOptional()
  q?: string;
}
