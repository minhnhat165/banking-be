import { Injectable, Inject } from '@nestjs/common';
import { Transaction } from './transaction.model';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @Inject('TransactionRepository')
    private readonly transactionModel: typeof Transaction,
  ) {}

  async findAll(): Promise<Transaction[]> {
    return this.transactionModel.findAll();
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
    return newTransaction.save();
  }
}
