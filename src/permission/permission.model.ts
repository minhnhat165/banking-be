import { Column, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'Permission',
})
export class Permission extends Model {
  @Column({ primaryKey: true, autoIncrement: true })
  id: number;

  @Column
  name: string;

  @Column
  description: string;
}
