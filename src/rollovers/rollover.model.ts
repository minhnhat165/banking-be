import { Column, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'Rollover_Category',
})
export class Rollover extends Model {
  @Column({ primaryKey: true, autoIncrement: true })
  id: number;
  @Column
  name: string;
  @Column
  description: string;
}
