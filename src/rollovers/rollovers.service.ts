import { Inject, Injectable } from '@nestjs/common';
import { Rollover } from './rollover.model';
import { PaginationParams } from 'src/common/dto/paginationParams';
import { Pagination } from 'src/common/dto/pagination';

@Injectable()
export class RolloversService {
  constructor(
    @Inject('RolloverRepository')
    private readonly rolloverModel: typeof Rollover,
  ) {}
  async findAll(
    paginationParams: PaginationParams,
  ): Promise<Pagination<Rollover>> {
    const { page = 0, limit = 10, ...filter } = paginationParams;
    const { rows, count } = await this.rolloverModel.findAndCountAll({
      offset: page * limit,
      limit,
      where: filter,
    });
    return {
      items: rows,
      total: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    };
  }
  async update(id: number, description: string) {
    const interestPayment = await this.rolloverModel.findByPk(id);
    interestPayment.description = description;
    await interestPayment.save();
    return interestPayment;
  }
}
