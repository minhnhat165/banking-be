import {
  BelongsTo,
  Column,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import { Account } from 'src/accounts/account.model';

@Table({
  tableName: 'Transactions',
})
export class Transaction extends Model {
  @Column({ primaryKey: true, autoIncrement: true })
  id: number;

  @ForeignKey(() => Account)
  @Column({ field: 'account_id' })
  accountId: number;
  @BelongsTo(() => Account) // Define the association to the Roles model
  account: Account;

  @Column({ field: 'type' })
  type: number;

  @Column({ field: 'amount' })
  amount: number;

  @Column({ field: 'description' })
  description: string;

  @Column({ field: 'status' })
  status: number;

  @Column({
    field: 'transaction_date',
  })
  transactionDate: Date;

  @Column({
    field: 'drcr_ind',
  })
  drcrInd: string;
}
