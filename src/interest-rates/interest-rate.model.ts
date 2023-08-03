import {
  BelongsTo,
  Column,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';

import { Account } from 'src/accounts/account.model';
import { Product } from 'src/products/product.model';
import { Term } from 'src/terms/terms.model';
import { User } from 'src/users/user.model';

@Table({
  tableName: 'Interest_Rate',
})
export class InterestRate extends Model {
  @Column({ primaryKey: true, autoIncrement: true })
  id: number;
  @ForeignKey(() => Product)
  @Column({ field: 'product_type_id' })
  productId: number;
  @BelongsTo(() => Product) // Define the association to the Roles model
  product: Product;

  @ForeignKey(() => Term)
  @Column({ field: 'term_id' })
  termId: number;
  @BelongsTo(() => Term) // Define the association to the Roles model
  term: Term;

  @Column({ defaultValue: 0 })
  status: number;

  @Column
  value: number;

  @Column({ field: 'created_date' })
  createdDate: Date;

  @Column({ field: 'effective_date' })
  effectiveDate: Date;

  @Column({ field: 'expired_date' })
  expiredDate: Date;

  @ForeignKey(() => User)
  @Column({ field: 'created_by' })
  createdBy: number;
  @BelongsTo(() => User) // Define the association to the Roles model
  user: User;

  @HasMany(() => Account) // Define the association to the Users model
  accounts: Account[];
}
