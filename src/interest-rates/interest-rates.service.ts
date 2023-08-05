import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Cron, CronExpression } from '@nestjs/schedule';
import * as moment from 'moment';
import { Op } from 'sequelize';
import { INTEREST_RATE } from 'src/common/constant/interest-rate';
import { Pagination } from 'src/common/dto/pagination';
import { PaginationParams } from 'src/common/dto/paginationParams';
import { Product } from 'src/products/product.model';
import { Term } from 'src/terms/terms.model';
import { User } from 'src/users/user.model';
import { CreateInterestRateDto } from './dto/create-interst-rate.dto';
import { InterestRate } from './interest-rate.model';

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
      include: [
        'term',
        'product',
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

  async findOne(id: number, includeAccount = false): Promise<InterestRate> {
    const existingInterestRate = await this.interestRateModel.findByPk(id, {
      include: [
        'accounts',
        'product',
        'term',
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

  async findByProductId(productId: number): Promise<InterestRate[]> {
    return this.interestRateModel.findAll({
      where: { productId },
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
      order: [['id', 'DESC']],
    });
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
      newInterestRate.effectiveDate = new Date(interestRate.effectiveDate);
      newInterestRate.expiredDate = new Date(interestRate.expiredDate);
      newInterestRate.createdBy = userId;
      newInterestRate.createdDate = new Date();
      if (moment(newInterestRate.effectiveDate).isSame(new Date(), 'day')) {
        newInterestRate.status = INTEREST_RATE.STATUS.ACTIVATED;
      }
      await newInterestRate.save();
      return this.findOne(newInterestRate.id);
    } catch (error) {
      const { message } = error;
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
    const updateInterestRate = await this.findOne(id, true);

    if (updateInterestRate.accounts.length > 0) {
      throw new ForbiddenException(
        'Cannot update because this interest rate is being used',
      );
    }
    const [_, [updatedInterestRate]] = await this.interestRateModel.update(
      { ...interestRate },
      { where: { id }, returning: true },
    );
    return this.findOne(updatedInterestRate.id);
  }
  async remove(id: number): Promise<void> {
    try {
      const interest = await this.findOne(id);
      await interest.destroy();
    } catch (error) {
      const { message } = error;
      if (message.includes('FK')) {
        throw new BadRequestException(
          'Cannot delete because this interest rate is being used',
        );
      }
      throw new Error(message);
    }
  }

  @Cron(CronExpression.EVERY_10_HOURS)
  async updateStatusInterestRate() {
    const interestRates = await this.interestRateModel.findAll({
      where: {
        status: INTEREST_RATE.STATUS.ACTIVATED,
        expiredDate: {
          [Op.lte]: new Date(),
        },
      },
    });
    if (interestRates.length > 0) {
      await this.interestRateModel.update(
        { status: INTEREST_RATE.STATUS.EXPIRED },
        {
          where: {
            id: interestRates.map((interestRate) => interestRate.id),
          },
        },
      );
    }

    // update status activated
    const interestRatesActivated = await this.interestRateModel.findAll({
      where: {
        status: INTEREST_RATE.STATUS.INACTIVATED,
        effectiveDate: {
          [Op.lte]: new Date(),
        },
      },
    });
    if (interestRatesActivated.length > 0) {
      await this.interestRateModel.update(
        { status: INTEREST_RATE.STATUS.ACTIVATED },
        {
          where: {
            id: interestRatesActivated.map((interestRate) => interestRate.id),
          },
        },
      );
    }
  }
}
