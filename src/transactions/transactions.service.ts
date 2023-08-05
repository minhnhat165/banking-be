import { Inject, Injectable } from '@nestjs/common';
import { Attributes, FindAndCountOptions } from 'sequelize';
import { Pagination } from 'src/common/dto/pagination';
import { PaginationParams } from 'src/common/dto/paginationParams';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Transaction } from './transaction.model';

import * as moment from 'moment';
import { Op } from 'sequelize';

@Injectable()
export class TransactionsService {
  constructor(
    @Inject('TransactionRepository')
    private readonly transactionModel: typeof Transaction,
  ) {}

  async findAll(
    paginationParams: PaginationParams,
    all = false,
  ): Promise<Pagination<Transaction>> {
    const { page = 0, limit = 10, ...filter } = paginationParams;
    const filterKeys = Object.keys(filter);
    let filterObject = {};
    if (filterKeys.includes('q')) {
      filterObject = {
        [Op.or]: {
          '$account.number$': {
            [Op.like]: `%${filter.q}%`,
          },
          '$bnfAccount.number$': {
            [Op.like]: `%${filter.q}%`,
          },
          description: {
            [Op.like]: `%${filter.q}%`,
          },
          balance: {
            [Op.like]: `%${filter.q}%`,
          },
          amount: {
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

    const query: Omit<FindAndCountOptions<Attributes<Transaction>>, 'group'> = {
      where: filterObject,
      include: ['account', 'bnfAccount'],
      order: [['id', 'DESC']],
    };

    if (!all) {
      query.offset = page * limit;
      query.limit = limit;
    }
    const { rows, count } = await this.transactionModel.findAndCountAll(query);
    return {
      items: rows,
      total: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    };
  }

  async findById(id: number): Promise<Transaction> {
    return this.transactionModel.findByPk(id);
  }

  async create(transaction: CreateTransactionDto): Promise<Transaction> {
    const newTransaction = new Transaction();
    newTransaction.accountId = transaction.accountId;
    newTransaction.amount = transaction.amount;
    newTransaction.type = transaction.type;
    newTransaction.description = transaction.description;
    newTransaction.status = 1;
    newTransaction.transactionDate = new Date();
    newTransaction.balance = transaction.balance;
    newTransaction.drcrInd = transaction.drcrInd || 0;
    if (transaction.bnfAccountId) {
      newTransaction.bnfAccountId = transaction.bnfAccountId;
    }
    return newTransaction.save();
  }

  async findBetweenDate(
    accountId: number,
    from: Date,
    to: Date,
  ): Promise<Transaction[]> {
    return this.transactionModel.findAll({
      where: {
        accountId: accountId,
        transactionDate: {
          $between: [from, to],
        },
      },
    });
  }
  async getOverviews() {
    const total = await this.transactionModel.count();
    const totalLastMonth = await this.transactionModel.count({
      where: {
        transactionDate: {
          [Op.gte]: moment().subtract(1, 'months').startOf('month').toDate(),
          [Op.lte]: moment().subtract(1, 'months').endOf('month').toDate(),
        },
      },
    });
    console.log(totalLastMonth);
    const totalThisMonth = await this.transactionModel.count({
      where: {
        transactionDate: {
          [Op.gte]: moment().startOf('month').toDate(),
        },
      },
    });

    if (totalLastMonth - totalThisMonth === 0) {
      return {
        total,
        percent: 0,
        totalLastMonth,
        totalThisMonth,
        status: 0,
      };
    }

    if (totalLastMonth === 0) {
      return {
        total,
        percent: 100,
        totalLastMonth,
        totalThisMonth,
        status: 1,
      };
    }

    if (totalThisMonth === 0) {
      return {
        total,
        percent: -100,
        totalLastMonth,
        totalThisMonth,
        status: -1,
      };
    }

    const percent = ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100;
    return {
      total,
      percent,
      totalLastMonth,
      totalThisMonth,
      status: percent > 0 ? 1 : -1,
    };
  }
}
