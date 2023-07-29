import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Response } from 'src/common/types/responses';
import { Product } from './products.model';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}
  @Get()
  async findAll() {
    return this.productsService.findAll();
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
