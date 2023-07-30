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
import { InterestRate } from 'src/interest-rates/interest-rate.model';
import { Rollover } from 'src/rollovers/rollover.model';

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

  @Column({ defaultValue: 0 })
  status: number;
  @Column({ field: 'number' })
  number: string;
  @Column
  pin: string;

  @ForeignKey(() => Customer)
  @Column({ field: 'customer_id' })
  customerId: number;
  @BelongsTo(() => Customer) // Define the association to the Roles model
  customer: Customer;
  @ForeignKey(() => InterestRate)
  @Column({
    field: 'interest_rate_id',
  })
  interestRateId: number;
  @BelongsTo(() => InterestRate) // Define the association to the Roles model
  interestRate: InterestRate;

  @ForeignKey(() => InterestPayment)
  @Column({ field: 'payment_method_id' })
  paymentMethodId: number;
  @BelongsTo(() => InterestPayment) // Define the association to the Roles model
  paymentMethod: InterestPayment;

  @ForeignKey(() => Rollover)
  @Column({
    field: 'rollover_id',
  })
  rolloverId: number;
  @BelongsTo(() => Rollover) // Define the association to the Roles model
  rollover: Rollover;
  @Column({
    field: 'created_date',
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  createdDate: Date;
  @Column({ field: 'activated_date' })
  activatedDate: Date;

  @Column({ field: 'maturity_date' })
  maturityDate: Date;
}