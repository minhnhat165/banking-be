import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import { Customer } from 'src/customers/customer.model';
import { InterestPayment } from 'src/interest-payments/interest-payment.model';
import { Product } from 'src/products/product.model';
import { Rollover } from 'src/rollovers/rollover.model';
import { Term } from 'src/terms/terms.model';

@Table({
  tableName: 'Banking_Account',
})
export class Account extends Model {
  @Column({ primaryKey: true, autoIncrement: true })
  id: number;

  @Column
  type: number;
  @Column
  balance: number;

  @Column
  principal: number;

  @Column({ defaultValue: 0 })
  status: number;
  @Column({ field: 'number' })
  number: string;

  @ForeignKey(() => Customer)
  @Column({ field: 'customer_id' })
  customerId: number;
  @BelongsTo(() => Customer)
  customer: Customer;
  @ForeignKey(() => Product)
  @Column({
    field: 'product_id',
  })
  productId: number;
  @BelongsTo(() => Product)
  product: Product;
  @ForeignKey(() => Term)
  @Column({
    field: 'term_id',
  })
  termId: number;
  @BelongsTo(() => Term)
  term: Term;

  @ForeignKey(() => InterestPayment)
  @Column({ field: 'payment_method_id' })
  paymentMethodId: number;
  @BelongsTo(() => InterestPayment)
  paymentMethod: InterestPayment;

  @ForeignKey(() => Rollover)
  @Column({
    field: 'rollover_id',
  })
  rolloverId: number;
  @BelongsTo(() => Rollover)
  rollover: Rollover;
  @Column({
    field: 'interest_rate',
  })
  interestRate: number;
  @Column({
    field: 'created_date',
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  createdDate: Date;
  @ForeignKey(() => Account)
  @Column({ field: 'transfer_account_id' })
  transferAccountId: number;
  @BelongsTo(() => Account)
  transferAccount: Account;

  @Column({ field: 'maturity_date' })
  maturityDate: Date;

  @Column({ field: 'started_date' })
  startedDate: Date;

  @Column({
    field: 'closed_date',
  })
  closedDate: Date;
}
