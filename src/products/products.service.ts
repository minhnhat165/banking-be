import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Product } from './products.model';
import { CreateProductDto } from './dto/create-product.dto';
import { User } from 'src/users/user.model';

@Injectable()
export class ProductsService {
  constructor(
    @Inject('ProductRepository')
    private readonly productModel: typeof Product,
  ) {}
  async findAll(): Promise<Product[]> {
    return this.productModel.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });
  }
  async findOne(id: number): Promise<Product> {
    const existingProduct = await this.productModel.findByPk(id);
    if (!existingProduct) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    return existingProduct;
  }
  async create(product: CreateProductDto, userId: number): Promise<Product> {
    const newProduct = new Product();
    newProduct.name = product.name;
    newProduct.description = product.description;
    newProduct.createdBy = userId;
    newProduct.createdDate = new Date();
    return newProduct.save();
  }
  async update(
    id: number,
    product: Partial<CreateProductDto>,
  ): Promise<Product> {
    await this.findOne(id);
    const [_, [updatedProduct]] = await this.productModel.update(
      { ...product },
      { where: { id }, returning: true },
    );
    return updatedProduct;
  }
  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.productModel.destroy({ where: { id } });
  }
}
