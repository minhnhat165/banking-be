import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InterestRate } from './interest-rate.model';
import { CreateInterestRateDto } from './dto/create-interst-rate.dto';
import { PaginationParams } from 'src/common/dto/paginationParams';
import { Pagination } from 'src/common/dto/pagination';
import { Product } from 'src/products/product.model';
import { Term } from 'src/terms/terms.model';
import { User } from 'src/users/user.model';

@Injectable()
export class InterestRatesService {
  constructor(
    @Inject('InterestRateRepository')
    private readonly interestRateModel: typeof InterestRate,
  ) {}

  async findAll(
    paginationParams: PaginationParams,
  ): Promise<Pagination<InterestRate>> {
    const { page = 0, limit = 10, ...filter } = paginationParams;
    const { rows, count } = await this.interestRateModel.findAndCountAll({
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

  async findOne(id: number): Promise<InterestRate> {
    const existingInterestRate = await this.interestRateModel.findByPk(id, {
      include: [
        {
          model: Product,
        },
        {
          model: Term,
        },
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });
    if (!existingInterestRate) {
      throw new NotFoundException(`InterestRate with id ${id} not found`);
    }
    return existingInterestRate;
  }

  async create(
    interestRate: CreateInterestRateDto,
    userId: number,
  ): Promise<InterestRate> {
    try {
      const newInterestRate = new InterestRate();
      newInterestRate.productId = interestRate.productId;
      newInterestRate.termId = interestRate.termId;
      newInterestRate.value = interestRate.value;
      newInterestRate.effectiveDate = interestRate.effectiveDate;
      newInterestRate.expiredDate = interestRate.expiredDate;
      newInterestRate.createdBy = userId;
      newInterestRate.createdDate = new Date();
      await newInterestRate.save();
      return this.findOne(newInterestRate.id);
    } catch (error) {
      const { message } = error;
      console.log(message);
      if (message.includes('CHK_FutureDates')) {
        throw new BadRequestException('Invalid effective date or expired date');
      } else if (message.includes('CHK_EffectiveAndExpiredDates')) {
        throw new BadRequestException(
          'Effective date must be before expired date',
        );
      }
      throw new Error(message);
    }
  }
  async update(
    id: number,
    interestRate: Partial<InterestRate>,
  ): Promise<InterestRate> {
    await this.findOne(id);
    const [_, [updatedInterestRate]] = await this.interestRateModel.update(
      { ...interestRate },
      { where: { id }, returning: true },
    );
    return this.findOne(updatedInterestRate.id);
  }
  async remove(id: number): Promise<void> {
    const interest = await this.findOne(id);
    await interest.destroy();
  }
}
