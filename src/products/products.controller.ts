import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Response } from 'src/common/types/responses';
import { CreateProductDto } from './dto/create-product.dto';
import { Product } from './product.model';
import { ProductsService } from './products.service';
import { PaginationParams } from 'src/common/dto/paginationParams';
import { Pagination } from 'src/common/dto/pagination';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}
  @Get()
  async findAll(
    @Query() paginationParams: PaginationParams,
  ): Promise<Response<Pagination<Product>>> {
    const data = await this.productsService.findAll(paginationParams);
    return {
      message: 'Products have been found successfully',
      data: data,
    };
  }

  @Get(':id')
  async findOne(id: number) {
    return this.productsService.findOne(id);
  }
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Request() req,
    @Body() product: CreateProductDto,
  ): Promise<Response<Product>> {
    const newProduct = await this.productsService.create(product, req.user.id);
    return {
      message: 'Product has been created successfully',
      data: newProduct,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Body() product: Partial<CreateProductDto>,
    @Param('id') id: number,
  ): Promise<Response<Product>> {
    const updatedProduct = await this.productsService.update(id, product);
    return {
      message: 'Product has been updated successfully',
      data: updatedProduct,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: number): Promise<Response<null>> {
    await this.productsService.remove(id);
    return {
      message: 'Product has been deleted successfully',
      data: null,
    };
  }
}
