import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Product } from './product.model';
import { CreateProductDto } from './dto/create-product.dto';
import { User } from 'src/users/user.model';
import { PaginationParams } from 'src/common/dto/paginationParams';
import { Pagination } from 'src/common/dto/pagination';
import { Op } from 'sequelize';

@Injectable()
export class ProductsService {
  constructor(
    @Inject('ProductRepository')
    private readonly productModel: typeof Product,
  ) {}

  async findAll(
    paginationParams: PaginationParams,
  ): Promise<Pagination<Product>> {
    const { page = 0, limit = 10, ...filter } = paginationParams;
    const filterKeys = Object.keys(filter);
    let filterObject = {};
    if (filterKeys.includes('q')) {
      filterObject = {
        [Op.or]: {
          name: {
            [Op.like]: `%${filter.q}%`,
          },
          description: {
            [Op.like]: `%${filter.q}%`,
          },
        },
      };
    }
    filterKeys.forEach((key) => {
      if (key === 'q') {
        return;
      }
      filterObject[key] = filter[key];
    });
    const { rows, count } = await this.productModel.findAndCountAll({
      offset: page * limit,
      limit,
      where: filterObject,
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'],
        },
      ],
      order: [['id', 'DESC']],
    });
    return {
      items: rows,
      total: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    };
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
