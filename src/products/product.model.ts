import {
  BelongsTo,
  Column,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import { User } from 'src/users/user.model';

@Table({
  tableName: 'Product_Type',
})
export class Product extends Model {
  @Column({ primaryKey: true, autoIncrement: true })
  id: number;
  @Column
  name: string;
  @Column
  description: string;

  @ForeignKey(() => User)
  @Column({ field: 'created_by' })
  createdBy: number;

  @BelongsTo(() => User) // Define the association to the Roles model
  user: User;

  @Column({ field: 'created_date' })
  createdDate: Date;
}
