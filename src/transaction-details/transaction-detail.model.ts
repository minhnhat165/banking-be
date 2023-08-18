import {
  BelongsTo,
  Column,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import { Account } from 'src/accounts/account.model';
import { Transaction } from 'src/transactions/transaction.model';

@Table({
  tableName: 'Transaction-Details',
})
export class TransactionDetail extends Model {
  @Column({ primaryKey: true, autoIncrement: true })
  id: number;
  @ForeignKey(() => Transaction)
  @Column({ field: 'transaction_id' })
  transactionId: number;
  @BelongsTo(() => Transaction) // Define the association to the Roles model
  transaction: Transaction;
  @ForeignKey(() => Account)
  @Column({ field: 'account_id' })
  accountId: number;
  @BelongsTo(() => Account) // Define the association to the Roles model
  account: Account;
  @Column
  balance: number;
  @Column({ field: 'is_increase' })
  isIncrease: boolean;
  @Column
  fee: number;
}
