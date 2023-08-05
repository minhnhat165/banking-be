import { Column, HasMany, Model, Table } from 'sequelize-typescript';

import { UserPermission } from 'src/user-permissions/user-permission.model';

@Table({
  tableName: 'Users',
})
export class User extends Model {
  @Column({ primaryKey: true, autoIncrement: true })
  id: number;

  @Column
  avatar: string;

  @Column
  password: string;

  @Column({ defaultValue: 0 })
  status: number;

  @Column({ field: 'first_name' })
  firstName: string;

  @Column({ field: 'last_name' })
  lastName: string;

  @Column
  dob: Date;

  @Column
  phone: string;

  @Column
  email: string;

  @Column
  address: string;

  @Column({ defaultValue: 0 })
  gender: number;

  @HasMany(() => UserPermission)
  permissions: UserPermission[];

  @Column({ field: 'created_date' })
  createdDate: Date;
}
