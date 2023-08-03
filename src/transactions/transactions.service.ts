import { Inject, Injectable } from '@nestjs/common';
import { Attributes, FindAndCountOptions } from 'sequelize';
import { Pagination } from 'src/common/dto/pagination';
import { PaginationParams } from 'src/common/dto/paginationParams';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Transaction } from './transaction.model';
import { Account } from 'src/accounts/account.model';

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

    const query: Omit<FindAndCountOptions<Attributes<Transaction>>, 'group'> = {
      where: filter,
      include: [
        {
          model: Account,
          attributes: {
            exclude: ['pin'],
          },
        },
      ],
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
}
