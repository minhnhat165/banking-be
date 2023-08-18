import { Column, HasMany, Model, Table } from 'sequelize-typescript';

import { TransactionDetail } from 'src/transaction-details/transaction-detail.model';

@Table({
  tableName: 'Transactions',
})
export class Transaction extends Model {
  @Column({ primaryKey: true, autoIncrement: true })
  id: number;

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

  @HasMany(() => TransactionDetail)
  transactionDetails: TransactionDetail[];
}
