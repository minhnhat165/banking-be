import { Column, HasMany, Model, Table } from 'sequelize-typescript';

import { User } from 'src/users/user.model';

@Table({
  tableName: 'Roles',
})
export class Role extends Model {
  @Column({ primaryKey: true, autoIncrement: true })
  id: number;

  @Column
  name: string;

  @Column
  description: string;
  @HasMany(() => User) // Define the association to the Users model
  users: User[];
}
