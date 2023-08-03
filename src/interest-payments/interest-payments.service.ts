import { Inject, Injectable } from '@nestjs/common';
import { Pagination } from 'src/common/dto/pagination';
import { PaginationParams } from 'src/common/dto/paginationParams';
import { InterestPayment } from './interest-payment.model';

@Injectable()
export class InterestPaymentsService {
  constructor(
    @Inject('InterestPaymentRepository')
    private readonly interestPaymentModel: typeof InterestPayment,
  ) {}

  async findAll(
    paginationParams: PaginationParams,
  ): Promise<Pagination<InterestPayment>> {
    const { page = 0, limit = 10, ...filter } = paginationParams;
    const { rows, count } = await this.interestPaymentModel.findAndCountAll({
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
    const interestPayment = await this.interestPaymentModel.findByPk(id);
    interestPayment.description = description;
    await interestPayment.save();
    return interestPayment;
  }
}
